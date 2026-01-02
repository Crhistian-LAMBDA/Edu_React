import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import asignaturasService from '../services/asignaturasService';
import { useSearch } from '../../../shared/context/SearchContext';
import { useAuth } from '../../../hooks/AuthContext';

const defaultForm = {
  nombre: '',
  codigo: '',
  descripcion: '',
  creditos: 0,
  estado: true,
  docente_responsable: '',
  periodo_academico: '',
  profesores_adicionales_ids: [],
};

export default function AsignaturasPage() {
  const { searchTerm } = useSearch();
  const { user } = useAuth();
  const puedeGestionar = ['admin', 'super_admin', 'coordinador'].includes(user?.rol);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [periodos, setPeriodos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (puedeGestionar) {
      cargarDatos();
      cargarCatalogos();
    } else {
      setLoading(false);
    }
  }, [puedeGestionar]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await asignaturasService.listar();
      setItems(res.data.results || res.data);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [perRes, docRes] = await Promise.all([
        asignaturasService.listarPeriodos(),
        asignaturasService.listarDocentes(),
      ]);
      setPeriodos(perRes.data.results || perRes.data);
      setDocentes(docRes.data.results || docRes.data);
    } catch (e) {
      // silencio: evitar bloquear UI
    }
  };

  const filtradas = useMemo(() => {
    if (!searchTerm?.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((a) =>
      a.nombre?.toLowerCase().includes(term) ||
      a.codigo?.toLowerCase().includes(term) ||
      a.descripcion?.toLowerCase().includes(term) ||
      a.docente_responsable_nombre?.toLowerCase().includes(term) ||
      a.periodo_academico_nombre?.toLowerCase().includes(term) ||
      a.profesores_adicionales_nombres?.some((nombre) =>
        nombre?.toLowerCase().includes(term)
      )
    );
  }, [items, searchTerm]);

  const abrirCrear = () => {
    setForm(defaultForm);
    setEditing(null);
    setOpen(true);
  };

  const abrirEditar = (row) => {
    setEditing(row);
    setForm({
      nombre: row.nombre || '',
      codigo: row.codigo || '',
      descripcion: row.descripcion || '',
      creditos: row.creditos ?? 0,
      estado: row.estado ?? true,
      docente_responsable: row.docente_responsable || '',
      periodo_academico: row.periodo_academico || '',
      profesores_adicionales_ids: row.profesores_adicionales_ids || [],
    });
    setOpen(true);
  };

  const cerrarDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.codigo.trim() || !form.periodo_academico || !form.docente_responsable) {
      setMessage({ type: 'error', text: 'Nombre, código, período y docente son obligatorios.' });
      return;
    }
    try {
      if (editing) {
        await asignaturasService.actualizar(editing.id, form);
        setMessage({ type: 'success', text: 'Asignatura actualizada' });
      } else {
        await asignaturasService.crear(form);
        setMessage({ type: 'success', text: 'Asignatura creada' });
      }
      await cargarDatos();
      cerrarDialog();
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
    } catch (e) {
      const errMsg = e.response?.data?.detail || 'Error al guardar asignatura';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  const toggleEstado = async (row) => {
    try {
      await asignaturasService.cambiarEstado(row.id, !row.estado);
      setItems((prev) => prev.map((a) => (a.id === row.id ? { ...a, estado: !row.estado } : a)));
    } catch (e) {
      setMessage({ type: 'error', text: 'No se pudo cambiar el estado' });
    }
  };

  const columns = [
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'nombre', headerName: 'Nombre', width: 180 },
    { field: 'periodo_academico_nombre', headerName: 'Período', width: 140 },
    { field: 'docente_responsable_nombre', headerName: 'Docente', width: 180 },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={!!params.row.estado}
              onChange={() => toggleEstado(params.row)}
              size="small"
              color="primary"
              disabled={!puedeGestionar}
            />
          }
          label={params.row.estado ? 'Activo' : 'Inactivo'}
        />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'fecha_creacion',
      headerName: 'Creación',
      width: 130,
      valueGetter: (value, row) => {
        if (!row?.fecha_creacion) return '-';
        return new Date(row.fecha_creacion).toLocaleDateString('es-ES');
      },
    },
    {
      field: 'profesores_adicionales_nombres',
      headerName: 'Profesores adicionales',
      width: 200,
      renderCell: (params) => {
        const nombres = params.row.profesores_adicionales_nombres || [];
        if (!nombres.length) return '-';
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {nombres.map((nombre, idx) => (
              <Chip key={idx} label={nombre} size="small" />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          aria-label="editar"
          size="small"
          onClick={() => abrirEditar(params.row)}
          disabled={!puedeGestionar}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Asignaturas</Typography>
        {puedeGestionar && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
            Nueva Asignatura
          </Button>
        )}
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <div style={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={filtradas}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          disableRowSelectionOnClick
        />
      </div>

      <Dialog open={open} onClose={cerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar Asignatura' : 'Nueva Asignatura'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <TextField
                label="Nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <TextField
                label="Código"
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <FormControl fullWidth required>
                <InputLabel id="periodo-label">Período</InputLabel>
                <Select
                  labelId="periodo-label"
                  label="Período"
                  name="periodo_academico"
                  value={form.periodo_academico}
                  onChange={handleChange}
                >
                  {periodos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <FormControl fullWidth required>
                <InputLabel id="docente-label">Docente responsable</InputLabel>
                <Select
                  labelId="docente-label"
                  label="Docente responsable"
                  name="docente_responsable"
                  value={form.docente_responsable}
                  onChange={handleChange}
                >
                  {docentes.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.first_name || d.last_name ? `${d.first_name || ''} ${d.last_name || ''}`.trim() : d.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <FormControl fullWidth>
                <InputLabel id="profesores-adicionales-label">Profesores adicionales</InputLabel>
                <Select
                  labelId="profesores-adicionales-label"
                  label="Profesores adicionales"
                  multiple
                  value={form.profesores_adicionales_ids || []}
                  onChange={(e) => setForm((prev) => ({ ...prev, profesores_adicionales_ids: e.target.value }))}
                  input={<OutlinedInput label="Profesores adicionales" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const docente = docentes.find((d) => d.id === id);
                        const nombre = docente
                          ? (docente.first_name || docente.last_name
                              ? `${docente.first_name || ''} ${docente.last_name || ''}`.trim()
                              : docente.username)
                          : '';
                        return (
                          <Chip
                            key={id}
                            label={nombre}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {docentes.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.first_name || d.last_name ? `${d.first_name || ''} ${d.last_name || ''}`.trim() : d.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <TextField
                label="Créditos"
                name="creditos"
                type="number"
                inputProps={{ min: 0 }}
                value={form.creditos}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: 260 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.estado}
                    onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.checked }))}
                    color="primary"
                  />
                }
                label={form.estado ? 'Activo' : 'Inactivo'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={!puedeGestionar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
