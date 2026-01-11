import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress, Alert, IconButton, Container } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import matriculasService from '../../academico/services/matriculasService';
import { useSearch } from '../../../shared/context/SearchContext';

export default function MisAsignaturasEstudiantePage() {
  const { searchTerm } = useSearch();
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [horarios, setHorarios] = useState({}); // { [id]: { dia, inicio, fin } }
  const [ok, setOk] = useState('');
  const [editando, setEditando] = useState({});

  const cargarMatriculas = async () => {
    setLoading(true);
    try {
      const res = await matriculasService.listar();
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setMatriculas(data);
      // Inicializar horarios
      const horariosIniciales = {};
      data.forEach(m => {
        if (m.horario) {
          try {
            const h = typeof m.horario === 'string' ? JSON.parse(m.horario) : m.horario;
            horariosIniciales[m.id] = {
              dia: h.dia || '',
              inicio: h.inicio || '',
              fin: h.fin || ''
            };
          } catch {
            // Si el horario no es JSON válido, lo ignora
          }
        }
      });
      setHorarios(horariosIniciales);
      setEditando({});
    } catch {
      setError('No se pudieron cargar las asignaturas matriculadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMatriculas();
  }, []);

  const matriculasFiltradas = useMemo(() => {
    if (!searchTerm?.trim()) return matriculas;
    const term = searchTerm.toLowerCase();
    return matriculas.filter((m) => {
      const codigo = (m?.asignatura?.codigo || m?.asignatura_codigo || '').toString().toLowerCase();
      const nombre = (m?.asignatura?.nombre || m?.asignatura_nombre || '').toString().toLowerCase();
      const horario = (m?.horario || '').toString().toLowerCase();
      return (
        codigo.includes(term) ||
        nombre.includes(term) ||
        horario.includes(term) ||
        m?.id?.toString().includes(term)
      );
    });
  }, [matriculas, searchTerm]);

  const handleHorarioChange = (id, field, value) => {
    setHorarios(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleGuardar = async (id) => {
    setOk('');
    const horarioObj = horarios[id];
    if (!horarioObj?.dia || !horarioObj?.inicio || !horarioObj?.fin) {
      setOk('Debes completar día, hora de inicio y fin.');
      return;
    }
    const horarioStr = JSON.stringify({
      dia: horarioObj.dia,
      inicio: horarioObj.inicio,
      fin: horarioObj.fin
    });
    try {
      await matriculasService.actualizar(id, { horario: horarioStr });
      setOk('Horario guardado correctamente.');
      setEditando(prev => ({ ...prev, [id]: false }));
      cargarMatriculas();
    } catch {
      setOk('Error al guardar el horario.');
    }
  };

  const handleEditar = (id) => {
    setEditando(prev => ({ ...prev, [id]: true }));
  };

  const handleCancelar = (id) => {
    setEditando(prev => ({ ...prev, [id]: false }));
    cargarMatriculas();
  };

  const handleEliminar = async (id) => {
    setOk('');
    try {
      await matriculasService.actualizar(id, { horario: '' });
      setOk('Horario eliminado correctamente.');
      cargarMatriculas();
    } catch {
      setOk('Error al eliminar el horario.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
      </Container>
    );
  }
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Mis Asignaturas</Typography>
        {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Código</b></TableCell>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Horario de estudio</b></TableCell>
              <TableCell><b>Acción</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matriculasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No tienes asignaturas matriculadas.</TableCell>
              </TableRow>
            ) : (
              matriculasFiltradas.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.asignatura?.codigo || m.asignatura_codigo}</TableCell>
                  <TableCell>{m.asignatura?.nombre || m.asignatura_nombre}</TableCell>
                  <TableCell>
                    {m.horario && !editando[m.id] ? (
                      <>
                        <Typography variant="body2" color="primary">
                          {(() => {
                            try {
                              const h = typeof m.horario === 'string' ? JSON.parse(m.horario) : m.horario;
                              return `Día: ${h.dia || '-'} | Inicio: ${h.inicio || '-'} | Fin: ${h.fin || '-'}`;
                            } catch {
                              return m.horario;
                            }
                          })()}
                        </Typography>
                      </>
                    ) : (
                      <Box display="flex" flexDirection="row" gap={1}>
                        <input
                          type="text"
                          placeholder="Día"
                          value={horarios[m.id]?.dia || ''}
                          onChange={e => handleHorarioChange(m.id, 'dia', e.target.value)}
                          style={{ width: 80 }}
                        />
                        <input
                          type="text"
                          placeholder="Inicio"
                          value={horarios[m.id]?.inicio || ''}
                          onChange={e => handleHorarioChange(m.id, 'inicio', e.target.value)}
                          style={{ width: 60 }}
                        />
                        <input
                          type="text"
                          placeholder="Fin"
                          value={horarios[m.id]?.fin || ''}
                          onChange={e => handleHorarioChange(m.id, 'fin', e.target.value)}
                          style={{ width: 60 }}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.horario && !editando[m.id] ? (
                      <>
                        <IconButton color="primary" onClick={() => handleEditar(m.id)} title="Editar horario">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleEliminar(m.id)} title="Eliminar horario">
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Button variant="contained" onClick={() => handleGuardar(m.id)} sx={{ mr: 1 }}>Guardar</Button>
                        {m.horario && (
                          <Button variant="outlined" onClick={() => handleCancelar(m.id)}>Cancelar</Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
