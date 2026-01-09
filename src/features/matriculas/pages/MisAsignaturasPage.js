// Página para ver asignaturas matriculadas
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import matriculasService from '../services/matriculasService';

export default function MisAsignaturasPage() {
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [horarios, setHorarios] = useState({}); // { [id]: { dia: Date, inicio: Date, fin: Date } }
  const [ok, setOk] = useState('');
  const [editando, setEditando] = useState({}); // { [id]: true/false }

  const cargarAsignaturas = () => {
    setLoading(true);
    matriculasService.listar()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAsignaturas(data);
        // Inicializar horarios desde el backend si existen
        const horariosIniciales = {};
        data.forEach(m => {
          if (m.horario) {
            try {
              // Si el horario es string, lo parsea
              const h = typeof m.horario === 'string' ? JSON.parse(m.horario) : m.horario;
              horariosIniciales[m.id] = {
                dia: h.dia ? dayjs(h.dia) : null,
                inicio: h.inicio ? dayjs(h.inicio, 'HH:mm') : null,
                fin: h.fin ? dayjs(h.fin, 'HH:mm') : null
              };
            } catch {
              // Si el horario no es JSON válido, lo ignora
            }
          }
        });
        setHorarios(horariosIniciales);
        setEditando({});
      })
      .catch(() => setError('No se pudieron cargar las asignaturas matriculadas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarAsignaturas();
  }, []);

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
      setOk('Debes seleccionar día, hora de inicio y fin.');
      return;
    }
    // Serializar horario como string JSON
    const horarioStr = JSON.stringify({
      dia: horarioObj.dia.format('YYYY-MM-DD'),
      inicio: horarioObj.inicio.format('HH:mm'),
      fin: horarioObj.fin.format('HH:mm')
    });
    try {
      await matriculasService.actualizarHorario(id, { horario: horarioStr });
      setOk('Horario guardado correctamente.');
      setEditando(prev => ({ ...prev, [id]: false }));
      cargarAsignaturas();
    } catch {
      setOk('Error al guardar el horario.');
    }
  };

  const handleEditar = (id) => {
    setEditando(prev => ({ ...prev, [id]: true }));
  };

  const handleCancelar = (id) => {
    setEditando(prev => ({ ...prev, [id]: false }));
    cargarAsignaturas();
  };

  const handleEliminar = async (id) => {
    setOk('');
    try {
      await matriculasService.actualizarHorario(id, { horario: '' });
      setOk('Horario eliminado correctamente.');
      cargarAsignaturas();
    } catch {
      setOk('Error al eliminar el horario.');
    }
  };
// ...existing code...

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box maxWidth={800} mx="auto" mt={4}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Mis Asignaturas</Typography>
        <Typography variant="h3" color="error" sx={{ my: 2 }}>PRUEBA VISUAL 🚩</Typography>
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
            {asignaturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No tienes asignaturas matriculadas.</TableCell>
              </TableRow>
            ) : (
              asignaturas.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.asignatura?.codigo}</TableCell>
                  <TableCell>{m.asignatura?.nombre}</TableCell>
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
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <DatePicker
                            label="Día"
                            value={horarios[m.id]?.dia || null}
                            onChange={value => handleHorarioChange(m.id, 'dia', value)}
                            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
                          />
                          <TimePicker
                            label="Hora inicio"
                            value={horarios[m.id]?.inicio || null}
                            onChange={value => handleHorarioChange(m.id, 'inicio', value)}
                            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
                          />
                          <TimePicker
                            label="Hora fin"
                            value={horarios[m.id]?.fin || null}
                            onChange={value => handleHorarioChange(m.id, 'fin', value)}
                            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
                          />
                        </Box>
                      </LocalizationProvider>
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
    </Box>
  );
}
