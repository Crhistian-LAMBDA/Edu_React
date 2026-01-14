
import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Checkbox from '@mui/material/Checkbox';
import asignaturasService from '../services/asignaturasService';
import { useSearch } from '../../../shared/context/SearchContext';
import { useAuth } from '../../../hooks/AuthContext';

const defaultForm = {
  nombre: '',
  codigo: '',
  descripcion: '',
  creditos: 0,
  estado: true,
  periodo_academico: '',
    profesores: [],
  prerrequisitos: [],
};

export default function AsignaturasPage() {
  
    const quitarProfesorDeAsignatura = async (asignaturaId, profesorId) => {
      const asignatura = items.find(a => a.id === asignaturaId);
      if (!asignatura) return;
      const nuevosProfesores = asignatura.profesores_info
        .filter(p => p.id !== profesorId)
        .map(p => p.id);
      try {
        await asignaturasService.actualizar(asignaturaId, { profesores: nuevosProfesores });
        setMessage({ type: 'success', text: 'Profesor eliminado de la asignatura' });
        await cargarDatos();
      } catch (e) {
        setMessage({ type: 'error', text: 'No se pudo eliminar el profesor' });
      }
    };
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
  // Importación CSV/Excel
  const [importDialog, setImportDialog] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [validacionResultado, setValidacionResultado] = useState(null);
  const [importando, setImportando] = useState(false);
  const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState({});
  const [paginaValidacion, setPaginaValidacion] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

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

  const prerrequisitoOptions = useMemo(() => {
    return items
      .filter((a) => !editing || a.id !== editing.id)
      .map((a) => ({ id: a.id, label: `${a.codigo} - ${a.nombre}` }));
  }, [items, editing]);

  const abrirCrear = () => {
    setForm(defaultForm);
    setEditing(null);
    setOpen(true);
  };

  // Agrupar asignaturas por Facultad y Carrera (solo se muestran las que tengan carrera/facultad asociada)
  const asignaturasAgrupadas = useMemo(() => {
    const grupos = {};
    filtradas.forEach((a) => {
      const facultad = a.carrera_facultad || a.facultad_nombre || 'Sin Facultad';
      const carrera = a.carrera_nombre || 'Sin Carrera';
      if (!a.carrera_nombre && !a.carrera_facultad) return; // si no hay vínculo, omitir en el árbol
      if (!grupos[facultad]) grupos[facultad] = {};
      if (!grupos[facultad][carrera]) grupos[facultad][carrera] = [];
      grupos[facultad][carrera].push(a);
    });
    return grupos;
  }, [filtradas]);

  const abrirEditar = async (row) => {
    setEditing(row);
    setForm({
      nombre: row.nombre || '',
      codigo: row.codigo || '',
      descripcion: row.descripcion || '',
      creditos: row.creditos ?? 0,
      estado: row.estado ?? true,
      docente_responsable: row.docente_responsable || '',
      periodo_academico: row.periodo_academico || '',
        profesores: row.profesores_info ? row.profesores_info.map(p => p.id) : [],
      prerrequisitos: row.prerrequisitos || [],
    });
    
    // Cargar docentes filtrados por facultad de la asignatura ANTES de abrir
    if (row.carrera_id) {
      await cargarDocentesPorFacultad(row.carrera_id);
    } else {
      // Si no hay carrera_id, cargar todos los docentes como fallback
      await cargarCatalogos();
    }
    
    setOpen(true);
  };

  const cargarDocentesPorFacultad = async (carreraId) => {
    try {
      // Enviar carrera_id para que el backend filtre docentes por facultad
      const res = await asignaturasService.listarDocentes({ carrera_id: carreraId });
      setDocentes(res.data.results || res.data);
    } catch (e) {
      console.error('Error cargando docentes por facultad:', e);
      // Fallback: cargar todos los docentes si falla el filtrado
      await cargarCatalogos();
    }
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

  // Importación
  const abrirImportDialog = () => {
    setArchivo(null);
    setValidacionResultado(null);
    setImportDialog(true);
  };

  const cerrarImportDialog = () => {
    setArchivo(null);
    setValidacionResultado(null);
    setImportDialog(false);
    setPaginaValidacion(0);
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setMessage({ type: 'error', text: 'Solo se permiten archivos CSV o Excel' });
      return;
    }
    setArchivo(file);
    setValidacionResultado(null);
  };

  const validarImportacion = async () => {
    if (!archivo) {
      setMessage({ type: 'error', text: 'Selecciona un archivo CSV o Excel' });
      return;
    }
    setImportando(true);
    setPaginaValidacion(0);
    try {
      const res = await asignaturasService.importarAsignaturas(archivo, null, true);
      setValidacionResultado(res.data);
      setMessage({ type: 'success', text: 'Validación realizada. Revisa el resumen.' });
    } catch (e) {
      const errMsg = e.response?.data?.error || 'Error al validar archivo';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setImportando(false);
    }
  };

  const confirmarImportacion = async () => {
    if (!archivo) {
      setMessage({ type: 'error', text: 'Selecciona un archivo antes de importar' });
      return;
    }
    setImportando(true);
    try {
      await asignaturasService.importarAsignaturas(archivo, null, false);
      setMessage({ type: 'success', text: 'Asignaturas importadas correctamente' });
      cerrarImportDialog();
      cargarDatos();
    } catch (e) {
      const errMsg = e.response?.data?.error || 'Error al importar archivo';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setImportando(false);
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.codigo.trim() || !form.periodo_academico) {
      setMessage({ type: 'error', text: 'Nombre, código y período son obligatorios.' });
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

  const eliminarAsignatura = async (id, nombre) => {
    if (window.confirm(`¿Eliminar asignatura "${nombre}"?`)) {
      try {
        await asignaturasService.eliminar(id);
        setMessage({ type: 'success', text: 'Asignatura eliminada' });
        await cargarDatos();
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (e) {
        setMessage({ type: 'error', text: 'No se pudo eliminar la asignatura' });
      }
    }
  };

  const eliminarAsignaturasCarrera = async (carreraNombre, listaAsignaturas) => {
    if (window.confirm(`¿Eliminar TODAS las asignaturas de "${carreraNombre}"? Esta acción no se puede deshacer.`)) {
      try {
        for (const asignatura of listaAsignaturas) {
          await asignaturasService.eliminar(asignatura.id);
        }
        setMessage({ type: 'success', text: `Se eliminaron ${listaAsignaturas.length} asignaturas` });
        await cargarDatos();
        setCarrerasSeleccionadas({});
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (e) {
        setMessage({ type: 'error', text: 'Error al eliminar asignaturas' });
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Asignaturas</Typography>
        {puedeGestionar && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={abrirImportDialog}>
              Importar CSV/Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
              Nueva Asignatura
            </Button>
          </Box>
        )}
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {!loading && Object.keys(asignaturasAgrupadas).length === 0 && (
        <Alert severity="info">No hay asignaturas con facultad/carrera asignada.</Alert>
      )}

      {!loading && Object.entries(asignaturasAgrupadas).map(([facultad, carreras]) => (
        <Accordion key={facultad} defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{facultad}</Typography>
              <Chip label={`${Object.values(carreras).reduce((acc, arr) => acc + arr.length, 0)} asignaturas`} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {Object.entries(carreras).map(([carrera, lista]) => (
              <Accordion key={carrera} disableGutters sx={{ mb: 1, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Checkbox
                      checked={carrerasSeleccionadas[carrera] || false}
                      onChange={() => {
                        setCarrerasSeleccionadas({
                          ...carrerasSeleccionadas,
                          [carrera]: !carrerasSeleccionadas[carrera]
                        });
                      }}
                      size="small"
                      disabled={!puedeGestionar}
                    />
                    <Typography sx={{ fontWeight: 600 }}>{carrera}</Typography>
                    <Chip label={`${lista.length} materias`} size="small" />
                  </Box>
                </AccordionSummary>
                {carrerasSeleccionadas[carrera] && (
                  <Box sx={{ p: 1, bgcolor: 'warning.light', borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      endIcon={<DeleteIcon />}
                      onClick={() => {
                        eliminarAsignaturasCarrera(carrera, lista);
                      }}
                      disabled={!puedeGestionar}
                    >
                      Eliminar todas las asignaturas
                    </Button>
                  </Box>
                )}
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Prerrequisitos</TableCell>
                          <TableCell>Docente</TableCell>
                          <TableCell align="center">Estado</TableCell>
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lista.map((a) => (
                          <TableRow key={a.id} hover>
                            <TableCell>{a.codigo}</TableCell>
                            <TableCell>{a.nombre}</TableCell>
                            <TableCell>
                              {a.prerrequisitos_nombres && a.prerrequisitos_nombres.length
                                ? a.prerrequisitos_nombres.map((p) => p.codigo || p.nombre).join(', ')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {a.profesores_info && a.profesores_info.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {a.profesores_info.map((p) => (
                                    <Chip
                                      key={p.id}
                                      label={p.nombre_completo}
                                      onDelete={puedeGestionar ? () => quitarProfesorDeAsignatura(a.id, p.id) : undefined}
                                      deleteIcon={<CloseIcon />}
                                      sx={{ mr: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              ) : '-'}
                            </TableCell>
                              
                            <TableCell align="center">
                              <Chip
                                label={a.estado ? 'Activo' : 'Inactivo'}
                                color={a.estado ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <IconButton size="small" onClick={() => abrirEditar(a)} disabled={!puedeGestionar}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => eliminarAsignatura(a.id, a.nombre)} disabled={!puedeGestionar}>
                                  <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={!!a.estado}
                                      onChange={() => toggleEstado(a)}
                                      size="small"
                                      color="primary"
                                      disabled={!puedeGestionar}
                                    />
                                  }
                                  label=""
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog open={open} onClose={cerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar Asignatura' : 'Nueva Asignatura'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
              <TextField
                label="Nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
              <TextField
                label="Código"
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
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
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
              <FormControl fullWidth>
                <InputLabel id="profesores-label">Profesores</InputLabel>
                <Select
                  labelId="profesores-label"
                  label="Profesores"
                  name="profesores"
                  multiple
                  value={form.profesores || []}
                  onChange={e => setForm(prev => ({ ...prev, profesores: e.target.value }))}
                  input={<OutlinedInput label="Profesores" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(id => {
                        const docente = docentes.find(d => d.id === id);
                        const nombre = docente
                          ? (docente.first_name || docente.last_name
                              ? `${docente.first_name || ''} ${docente.last_name || ''}`.trim()
                              : docente.username)
                          : '';
                        return <Chip key={id} label={nombre} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {docentes.map(d => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.first_name || d.last_name ? `${d.first_name || ''} ${d.last_name || ''}`.trim() : d.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {form.profesores && form.profesores.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  endIcon={<CloseIcon />}
                  onClick={() => setForm(prev => ({ ...prev, profesores: [] }))}
                  sx={{ mt: 1 }}
                >
                  Quitar profesores
                </Button>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
              <FormControl fullWidth>
                <InputLabel id="prerrequisitos-label">Prerrequisitos</InputLabel>
                <Select
                  labelId="prerrequisitos-label"
                  label="Prerrequisitos"
                  name="prerrequisitos"
                  multiple
                  value={form.prerrequisitos || []}
                  onChange={(e) => {
                    const value = e.target.value || [];
                    const filtrado = editing ? value.filter((id) => id !== editing.id) : value;
                    setForm((prev) => ({ ...prev, prerrequisitos: filtrado }));
                  }}
                  input={<OutlinedInput label="Prerrequisitos" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const opt = prerrequisitoOptions.find((p) => p.id === id);
                        return <Chip key={id} label={opt ? opt.label : id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {prerrequisitoOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              {form.prerrequisitos && form.prerrequisitos.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  endIcon={<CloseIcon />}
                  onClick={() => setForm((prev) => ({ ...prev, prerrequisitos: [] }))}
                  sx={{ mt: 1 }}
                >
                  Quitar prerrequisitos
                </Button>
              )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
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
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 260 }}>
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
            <Grid size={{ xs: 12 }}>
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

      {/* Dialog de importación CSV/Excel */}
      <Dialog open={importDialog} onClose={cerrarImportDialog} maxWidth="md" fullWidth>
        <DialogTitle>Importar Asignaturas desde CSV/Excel</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Columnas requeridas: Carrera, Semestre, Materia, Créditos, Código, Descripción (opcional), Prerrequisitos (códigos separados por coma)
          </Alert>
          <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
            Seleccionar archivo CSV/Excel
            <input type="file" accept=".csv,.xls,.xlsx" hidden onChange={handleArchivoChange} />
          </Button>
          {archivo && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Archivo seleccionado: <strong>{archivo.name}</strong>
            </Typography>
          )}
          {validacionResultado && (
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity={validacionResultado.invalidas > 0 ? 'warning' : 'success'} 
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total: {validacionResultado.total} | 
                  Válidas: {validacionResultado.validas} | 
                  Con errores: {validacionResultado.invalidas}
                </Typography>
                {validacionResultado.invalidas > 0 ? (
                  <Typography variant="body2">
                    Revisa los errores en la tabla. Solo se importarán las filas válidas si corriges los errores.
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    ✓ Todas las filas son válidas. Listo para importar.
                  </Typography>
                )}
              </Alert>
              
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fila</TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Materia</TableCell>
                      <TableCell>Semestre</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Detalles</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validacionResultado.filas
                      .sort((a, b) => {
                        const semA = a.datos?.Semestre || a.datos?.semestre || 0;
                        const semB = b.datos?.Semestre || b.datos?.semestre || 0;
                        return semA - semB;
                      })
                      .slice(paginaValidacion * filasPorPagina, paginaValidacion * filasPorPagina + filasPorPagina)
                      .map((fila, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{fila.fila}</TableCell>
                          <TableCell>
                            {fila.datos?.Código || fila.datos?.Codigo || fila.datos?.codigo || fila.codigo_usado || '-'}
                          </TableCell>
                          <TableCell>
                            {fila.datos?.Materia || fila.datos?.materia || fila.datos?.Nombre || fila.datos?.nombre || '-'}
                          </TableCell>
                          <TableCell>
                            {fila.datos?.Semestre || fila.datos?.semestre || '-'}
                          </TableCell>
                          <TableCell>
                            {fila.errores && fila.errores.length > 0 ? (
                              <Chip label="Error" size="small" color="error" />
                            ) : fila.advertencias && fila.advertencias.length > 0 ? (
                              <Chip label="Advertencia" size="small" color="warning" />
                            ) : (
                              <Chip label="Válida" size="small" color="success" />
                            )}
                          </TableCell>
                          <TableCell>
                            {fila.errores && fila.errores.length > 0 && (
                              <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                ⚠ {fila.errores.join('; ')}
                              </Typography>
                            )}
                            {fila.advertencias && fila.advertencias.length > 0 && (
                              <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                ⚡ {fila.advertencias.join('; ')}
                              </Typography>
                            )}
                            {(!fila.errores || fila.errores.length === 0) && 
                             (!fila.advertencias || fila.advertencias.length === 0) && (
                              <Typography variant="caption" color="success.main">
                                ✓ OK
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={validacionResultado.filas.length}
                page={paginaValidacion}
                onPageChange={(e, newPage) => setPaginaValidacion(newPage)}
                rowsPerPage={filasPorPagina}
                onRowsPerPageChange={(e) => {
                  setFilasPorPagina(parseInt(e.target.value, 10));
                  setPaginaValidacion(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarImportDialog}>Cerrar</Button>
          <Button onClick={validarImportacion} disabled={importando || !archivo}>
            Validar
          </Button>
          <Button 
            variant="contained" 
            onClick={confirmarImportacion} 
            disabled={importando || !validacionResultado || validacionResultado.invalidas > 0}
          >
            Importar ({validacionResultado?.validas || 0} materias)
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
    </Container>
  );
}
