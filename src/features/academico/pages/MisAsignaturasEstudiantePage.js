import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import matriculasService from '../../matriculas/services/matriculasService';
import { useSearch } from '../../../shared/context/SearchContext';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const parseHorario = (horario) => {
  if (!horario) return null;
  if (typeof horario === 'object') return horario;
  try {
    return JSON.parse(horario);
  } catch {
    return null;
  }
};

const isValidTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test((t || '').toString());

export default function MisAsignaturasEstudiantePage() {
  const { searchTerm } = useSearch();
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [horarios, setHorarios] = useState({}); // { [id]: { dia, inicio, fin } }
  const [feedback, setFeedback] = useState({ message: '', severity: 'success' });
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
          const h = parseHorario(m.horario);
          if (h) {
            horariosIniciales[m.id] = {
              dia: h.dia || '',
              inicio: h.inicio || '',
              fin: h.fin || '',
            };
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

  const ensureHorarioState = (id) => {
    setHorarios((prev) => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: { dia: '', inicio: '', fin: '' },
      };
    });
  };

  const handleGuardar = async (id) => {
    setFeedback({ message: '', severity: 'success' });
    const horarioObj = horarios[id];
    if (!horarioObj?.dia || !horarioObj?.inicio || !horarioObj?.fin) {
      setFeedback({ message: 'Debes seleccionar día, hora de inicio y fin.', severity: 'error' });
      return;
    }

    if (!isValidTime(horarioObj.inicio) || !isValidTime(horarioObj.fin)) {
      setFeedback({ message: 'Formato de hora inválido. Usa HH:MM.', severity: 'error' });
      return;
    }

    if (horarioObj.fin <= horarioObj.inicio) {
      setFeedback({ message: 'La hora fin debe ser mayor que la hora inicio.', severity: 'error' });
      return;
    }

    const horarioStr = JSON.stringify({
      dia: horarioObj.dia,
      inicio: horarioObj.inicio,
      fin: horarioObj.fin
    });
    try {
      await matriculasService.actualizarHorario(id, { horario: horarioStr });
      setFeedback({ message: 'Horario guardado correctamente.', severity: 'success' });
      setEditando(prev => ({ ...prev, [id]: false }));
      cargarMatriculas();
    } catch {
      setFeedback({ message: 'Error al guardar el horario.', severity: 'error' });
    }
  };

  const handleEditar = (id) => {
    ensureHorarioState(id);
    setEditando(prev => ({ ...prev, [id]: true }));
  };

  const handleCancelar = (id) => {
    setEditando(prev => ({ ...prev, [id]: false }));
    cargarMatriculas();
  };

  const handleEliminar = async (id) => {
    setFeedback({ message: '', severity: 'success' });
    try {
      await matriculasService.actualizarHorario(id, { horario: '' });
      setFeedback({ message: 'Horario eliminado correctamente.', severity: 'success' });
      cargarMatriculas();
    } catch {
      setFeedback({ message: 'Error al eliminar el horario.', severity: 'error' });
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
        {feedback.message ? (
          <Alert severity={feedback.severity} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        ) : null}
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
                    {(() => {
                      const h = parseHorario(m.horario);
                      const hayHorario = Boolean(h && (h.dia || h.inicio || h.fin));

                      if (!editando[m.id]) {
                        return (
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {hayHorario ? (
                              <>
                                <Chip size="small" label={`Día: ${h.dia || '-'}`} />
                                <Chip size="small" label={`Inicio: ${h.inicio || '-'}`} />
                                <Chip size="small" label={`Fin: ${h.fin || '-'}`} />
                              </>
                            ) : (
                              <Chip size="small" label="Sin horario" variant="outlined" />
                            )}
                          </Stack>
                        );
                      }

                      return (
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel id={`dia-label-${m.id}`}>Día</InputLabel>
                            <Select
                              labelId={`dia-label-${m.id}`}
                              label="Día"
                              value={horarios[m.id]?.dia || ''}
                              onChange={(e) => handleHorarioChange(m.id, 'dia', e.target.value)}
                            >
                              {DIAS.map((d) => (
                                <MenuItem key={d} value={d}>
                                  {d}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <TextField
                            size="small"
                            label="Inicio"
                            type="time"
                            value={horarios[m.id]?.inicio || ''}
                            onChange={(e) => handleHorarioChange(m.id, 'inicio', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                            sx={{ width: 140 }}
                          />
                          <TextField
                            size="small"
                            label="Fin"
                            type="time"
                            value={horarios[m.id]?.fin || ''}
                            onChange={(e) => handleHorarioChange(m.id, 'fin', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                            sx={{ width: 140 }}
                          />
                        </Box>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {!editando[m.id] ? (
                      <>
                        <IconButton color="primary" onClick={() => handleEditar(m.id)} title="Asignar/editar horario">
                          <EditIcon />
                        </IconButton>
                        {m.horario ? (
                          <IconButton color="error" onClick={() => handleEliminar(m.id)} title="Eliminar horario">
                            <DeleteIcon />
                          </IconButton>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Button variant="contained" onClick={() => handleGuardar(m.id)} sx={{ mr: 1 }}>Guardar</Button>
                        <Button variant="outlined" onClick={() => handleCancelar(m.id)}>Cancelar</Button>
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
