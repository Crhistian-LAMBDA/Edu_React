import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { asignaturasService } from '../../academico/services/asignaturasService';
import apiClient from '../../usuarios/services/usuariosService';

export default function PeriodosAdminPage() {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    cargarPeriodos();
  }, []);
  const handleOpen = () => { setOpen(true); setEditId(null); };
  const handleClose = () => { setOpen(false); setForm({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' }); setEditId(null); };
  const handleEdit = (periodo) => {
    setForm({
      nombre: periodo.nombre,
      descripcion: periodo.descripcion,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin
    });
    setEditId(periodo.id);
    setOpen(true);
  };
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };
  const crearOEditarPeriodo = async () => {
    setError(''); setOk('');
    try {
      if (editId) {
        await apiClient.put(`/periodos-academicos/${editId}/`, form);
        setOk('Periodo editado correctamente');
      } else {
        await apiClient.post('/periodos-academicos/', form);
        setOk('Periodo creado correctamente');
      }
      cargarPeriodos();
      handleClose();
    } catch {
      setError(editId ? 'No se pudo editar el periodo' : 'No se pudo crear el periodo');
    }
  };
  const eliminarPeriodo = async (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este período académico?')) return;
    setError(''); setOk('');
    try {
      await apiClient.delete(`/periodos-academicos/${id}/`);
      setOk('Periodo eliminado correctamente');
      cargarPeriodos();
    } catch {
      setError('No se pudo eliminar el periodo');
    }
  };

  const cargarPeriodos = async () => {
    setLoading(true);
    setError('');
    setOk('');
    try {
      const res = await asignaturasService.listarPeriodos();
      setPeriodos(res.data.results || res.data);
    } catch {
      setError('No se pudieron cargar los periodos');
    } finally {
      setLoading(false);
    }
  };

  const activarPeriodo = async (id) => {
    setOk(''); setError('');
    try {
      await apiClient.post(`/periodos-academicos/${id}/activar/`);
      setOk('Periodo activado correctamente');
      cargarPeriodos();
    } catch {
      setError('No se pudo activar el periodo');
    }
  };

  const desactivarPeriodo = async (id) => {
    setOk(''); setError('');
    try {
      await apiClient.post(`/periodos-academicos/${id}/desactivar/`);
      setOk('Periodo desactivado correctamente');
      cargarPeriodos();
    } catch {
      setError('No se pudo desactivar el periodo');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
  return (
    <Box>
      <Typography variant="h5" mb={2}>Gestión de Períodos Académicos</Typography>
      <Button variant="contained" color="success" sx={{ mb: 2 }} onClick={handleOpen}>Crear nuevo período académico</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {ok && <Alert severity="success">{ok}</Alert>}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar Período Académico' : 'Crear Período Académico'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nombre" name="nombre" fullWidth value={form.nombre} onChange={handleChange} />
          <TextField margin="dense" label="Descripción" name="descripcion" fullWidth value={form.descripcion} onChange={handleChange} />
          <TextField margin="dense" label="Fecha Inicio" name="fecha_inicio" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.fecha_inicio} onChange={handleChange} />
          <TextField margin="dense" label="Fecha Fin" name="fecha_fin" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.fecha_fin} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={crearOEditarPeriodo} variant="contained" color="primary">{editId ? 'Guardar cambios' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periodos.map((p) => (
              <TableRow key={p.id} selected={p.activo}>
                <TableCell>{p.nombre}</TableCell>
                <TableCell>{p.descripcion}</TableCell>
                <TableCell>{p.fecha_inicio}</TableCell>
                <TableCell>{p.fecha_fin}</TableCell>
                <TableCell>{p.activo ? 'Sí' : 'No'}</TableCell>
                <TableCell>
                  {p.activo ? (
                    <Button color="warning" variant="outlined" onClick={() => desactivarPeriodo(p.id)} sx={{ mr: 1 }}>Desactivar</Button>
                  ) : (
                    <Button color="primary" variant="contained" onClick={() => activarPeriodo(p.id)} sx={{ mr: 1 }}>Activar</Button>
                  )}
                  <Button color="info" variant="outlined" onClick={() => handleEdit(p)} sx={{ mr: 1 }}>Editar</Button>
                  <Button color="error" variant="outlined" onClick={() => eliminarPeriodo(p.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
