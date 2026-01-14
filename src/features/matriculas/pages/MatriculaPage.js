// Página para matrícula de asignaturas

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, Checkbox, List, ListItem, ListItemText, Divider, Chip, Tooltip } from '@mui/material';
import { asignaturasService } from '../../academico/services/asignaturasService';
import { useAuth } from '../../../hooks/AuthContext';
import matriculasService from '../services/matriculasService';

export default function MatriculaPage() {
  const { user } = useAuth();
  const [asignaturas, setAsignaturas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [matriculadas, setMatriculadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // Obtener carrera del usuario (estudiante)
  const carreraId = user?.carrera?.id || user?.carrera_id || null;

  // Cargar periodos y asignaturas filtradas por carrera y periodo
  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      asignaturasService.listarPeriodos(),
      matriculasService.disponibles(),
      matriculasService.listar()
    ])
      .then(([perRes, dispRes, matRes]) => {
        const periodosData = perRes.data.results || perRes.data;
        setPeriodos(periodosData);
        if (periodosData.length > 0 && !periodoId) setPeriodoId(periodosData[0].id);
        setAsignaturas(dispRes.data);
        setMatriculadas(matRes.data.results || matRes.data);
      })
      .catch(() => setError('No se pudo cargar la información'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [carreraId]);

  // Filtrar asignaturas por periodo seleccionado
  // IDs de asignaturas ya matriculadas en este periodo
  const idsMatriculadas = useMemo(() => {
    return matriculadas
      .filter(m => String(m.periodo) === String(periodoId))
      .map(m => (typeof m.asignatura === 'object' ? m.asignatura.id : m.asignatura));
  }, [matriculadas, periodoId]);

  // IDs de asignaturas aprobadas (para prerrequisitos, aquí solo las ya matriculadas en cualquier periodo, puedes ajustar si tienes info de "aprobadas")
  const idsAprobadas = useMemo(() => {
    return matriculadas.map(m => (typeof m.asignatura === 'object' ? m.asignatura.id : m.asignatura));
  }, [matriculadas]);

  // Mostrar solo las asignaturas disponibles para matrícula en el periodo activo
  const asignaturasFiltradas = useMemo(() => {
    return asignaturas.filter(a => String(a.periodo_academico) === String(periodoId));
  }, [asignaturas, periodoId]);

  // Agrupar asignaturas por semestre
  const asignaturasPorSemestre = useMemo(() => {
    const grupos = {};
    asignaturasFiltradas.forEach(a => {
      const semestre = a.semestre || 'Sin semestre';
      if (!grupos[semestre]) grupos[semestre] = [];
      grupos[semestre].push(a);
    });
    return grupos;
  }, [asignaturasFiltradas]);

  const handleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleMatricular = async () => {
    setOk(''); setError('');
    try {
      await Promise.all(
        seleccionadas.map(asignaturaId =>
          matriculasService.matricular({ asignatura: asignaturaId, periodo: periodoId })
        )
      );
      setOk('Asignaturas matriculadas correctamente.');
      setSeleccionadas([]);
    } catch {
      setError('Error al matricular asignaturas.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box maxWidth={700} mx="auto" mt={4}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Matrícula de Asignaturas</Typography>
        {/* Mostrar facultad y carrera del usuario */}
        {user?.carrera?.facultad && (
          <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
            Facultad: {user.carrera.facultad}
          </Typography>
        )}
        {user?.carrera?.nombre && (
          <Typography variant="subtitle1" color="secondary" sx={{ mb: 1 }}>
            Carrera: {user.carrera.nombre}
          </Typography>
        )}
        {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="periodo-label">Período académico</InputLabel>
          <Select
            labelId="periodo-label"
            value={periodoId}
            label="Período académico"
            onChange={e => setPeriodoId(e.target.value)}
          >
            {periodos.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Divider sx={{ my: 2 }} />
        {Object.keys(asignaturasPorSemestre).length === 0 ? (
          <Box>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              No hay asignaturas disponibles para matricular en este periodo.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Posibles causas:<br />
              - Ya estás matriculado en todas las materias disponibles para este periodo.<br />
              - No cumples los prerrequisitos de las materias disponibles.<br />
              - No existen materias activas para tu carrera y periodo.<br />
              <br />
              Si crees que esto es un error, consulta con el administrador o revisa la configuración de tu carrera.
            </Typography>
          </Box>
        ) : (
          Object.entries(asignaturasPorSemestre).sort((a, b) => {
            if (a[0] === 'Sin semestre') return 1;
            if (b[0] === 'Sin semestre') return -1;
            return Number(a[0]) - Number(b[0]);
          }).map(([semestre, asigns]) => (
            <Box key={semestre} mb={3}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Semestre {semestre !== 'Sin semestre' ? semestre : <Chip label="Sin semestre" size="small" />}
              </Typography>
              <List dense>
                {asigns.map(asig => {
                  const idsPrerreq = (asig.prerrequisitos || []);
                  const nombresPrerreq = (asig.prerrequisitos_nombres || []);
                  const tienePrerreqNoCumplido = idsPrerreq.length > 0 && !idsPrerreq.every(id => idsAprobadas.includes(id));
                  const yaMatriculada = idsMatriculadas.includes(asig.id);
                  return (
                    <Tooltip
                      key={asig.id}
                      title={
                        yaMatriculada
                          ? 'Ya matriculada'
                          : tienePrerreqNoCumplido
                            ? `Prerrequisitos no cumplidos: ${nombresPrerreq.map(p => p.nombre || p.codigo).join(', ')}`
                            : ''
                      }
                      arrow
                      disableHoverListener={!tienePrerreqNoCumplido && !yaMatriculada}
                    >
                      <span>
                        <ListItem
                          sx={{ borderBottom: '1px solid #eee', opacity: tienePrerreqNoCumplido ? 0.5 : 1, background: yaMatriculada ? '#f5f5f5' : 'inherit' }}
                          secondaryAction={
                            <Checkbox
                              edge="end"
                              checked={seleccionadas.includes(asig.id)}
                              onChange={() => handleSeleccion(asig.id)}
                              inputProps={{ 'aria-label': `matricular ${asig.nombre}` }}
                              disabled={tienePrerreqNoCumplido || yaMatriculada}
                            />
                          }
                          disabled={tienePrerreqNoCumplido || yaMatriculada}
                        >
                          <ListItemText
                            primary={<span><b>{asig.nombre}</b> <span style={{ color: '#888' }}>({asig.codigo})</span> {yaMatriculada && <Chip label="Matriculada" size="small" sx={{ ml: 1 }} />}</span>}
                            secondary={
                              <>
                                {asig.descripcion}
                                {idsPrerreq.length > 0 && (
                                  <span style={{ color: '#b77', marginLeft: 8 }}>
                                    Prerrequisitos: {nombresPrerreq.map(p => p.nombre || p.codigo).join(', ')}
                                  </span>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      </span>
                    </Tooltip>
                  );
                })}
              </List>
            </Box>
          ))
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleMatricular}
          disabled={seleccionadas.length === 0}
          sx={{ mt: 2 }}
        >
          Matricular seleccionadas
        </Button>
      </Paper>
    </Box>
  );
}
