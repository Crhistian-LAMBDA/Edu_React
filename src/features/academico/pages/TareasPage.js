import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
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
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import tareasService from '../services/tareasService';
import { useAuth } from '../../../hooks/AuthContext';
import { useSearch } from '../../../shared/context/SearchContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const defaultForm = {
  asignatura: '',
  titulo: '',
  descripcion: '',
  tipo_tarea: 'tarea',
  peso_porcentual: 0,
  fecha_publicacion: '',
  fecha_vencimiento: '',
  estado: 'borrador',
  permite_entrega_tardia: false,
  publicar_automaticamente: true,
  archivo_adjunto: null, // Nuevo campo para archivo
};

export default function TareasPage() {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const userRoles = useMemo(() => {
    if (Array.isArray(user?.roles)) return user.roles;
    return user?.rol ? [user.rol] : [];
  }, [user]);

  const esStaffTareas = useMemo(() => {
    const allowed = ['profesor', 'docente', 'coordinador', 'admin', 'super_admin'];
    return userRoles.some((r) => allowed.includes(r));
  }, [userRoles]);

  const puedeCrear = useMemo(() => {
    // HU: botón "Nueva Tarea" solo para docentes
    return userRoles.some((r) => ['profesor', 'docente'].includes(r));
  }, [userRoles]);

  const [tareas, setTareas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pesosPorAsignatura, setPesosPorAsignatura] = useState({});
  const [archivoAdjunto, setArchivoAdjunto] = useState(null); // Estado para archivo

  const [filterAsignatura, setFilterAsignatura] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [confirmDelete, setConfirmDelete] = useState({ open: false, tarea: null });
  const [confirmToggle, setConfirmToggle] = useState({ open: false, tarea: null, nextEstado: null });
  const [confirmCerrar, setConfirmCerrar] = useState({ open: false, tarea: null });
  const [preview, setPreview] = useState({ open: false, tarea: null });

  useEffect(() => {
    if (esStaffTareas) {
      cargarDatos();
      cargarAsignaturas();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esStaffTareas]);

  useEffect(() => {
    if (!esStaffTareas) return;
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAsignatura, filterTipo, filterEstado]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAsignatura) params.asignatura = filterAsignatura;
      if (filterTipo) params.tipo_tarea = filterTipo;
      if (filterEstado) params.estado = filterEstado;

      const res = await tareasService.listar(params);
      setTareas(res.data.results || res.data);
      
      // Cargar pesos por asignatura
      cargarPesosAsignaturas(res.data.results || res.data);
    } catch (e) {
      console.error('Error cargando tareas:', e);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaturas = async () => {
    try {
      // Nota: si el backend soporta docente_id, lo usamos; si no, igual filtramos en frontend.
      const params = {};
      if (userRoles.some((r) => ['profesor', 'docente'].includes(r)) && user?.id) {
        params.docente_id = user.id;
      }
      const res = await tareasService.listarAsignaturas(params);
      const lista = res.data.results || res.data;

      // Filtrar en frontend para que el dropdown muestre solo asignaturas donde el usuario es docente
      const filtrada = (() => {
        if (!userRoles.some((r) => ['profesor', 'docente'].includes(r))) return lista;
        if (!user?.id) return lista;
        return (lista || []).filter((a) => {
          // Si el backend ya devuelve profesores_info, usamos eso; si no, dejamos pasar.
          const profesores = Array.isArray(a?.profesores_info) ? a.profesores_info : null;
          if (!profesores) return true;
          return profesores.some((p) => p?.id === user.id);
        });
      })();

      setAsignaturas(filtrada);
    } catch (e) {
      console.error('Error cargando asignaturas:', e);
    }
  };

  const cargarPesosAsignaturas = async (tareasList) => {
    const asignaturaIds = [...new Set(tareasList.map(t => t.asignatura))];
    const pesos = {};

    for (const asigId of asignaturaIds) {
      try {
        const res = await tareasService.pesoAsignatura(asigId);
        pesos[asigId] = res.data;
      } catch (e) {
        pesos[asigId] = { peso_total: 0, peso_disponible: 100, completo: false };
      }
    }
    
    setPesosPorAsignatura(pesos);
  };

  const tareasFiltradas = useMemo(() => {
    let resultado = tareas;

    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(t =>
        t.titulo?.toLowerCase().includes(term) ||
        t.descripcion?.toLowerCase().includes(term) ||
        t.asignatura_nombre?.toLowerCase().includes(term) ||
        t.asignatura_codigo?.toLowerCase().includes(term)
      );
    }

    return resultado;
  }, [tareas, searchTerm]);

  const tareasAgrupadas = useMemo(() => {
    const grupos = {};
    tareasFiltradas.forEach(t => {
      const key = `${t.asignatura} - ${t.asignatura_nombre}`;
      if (!grupos[key]) {
        grupos[key] = {
          asignatura_id: t.asignatura,
          asignatura_nombre: t.asignatura_nombre,
          asignatura_codigo: t.asignatura_codigo,
          tareas: []
        };
      }
      grupos[key].tareas.push(t);
    });
    return grupos;
  }, [tareasFiltradas]);

  const abrirCrear = () => {
    setForm(defaultForm);
    setArchivoAdjunto(null);
    setEditing(null);
    setOpen(true);
  };

  const formatearFechaInput = (fechaIso) => {
    // Convierte "2026-01-04T21:13:00-05:00" a "2026-01-04T21:13"
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const abrirEditar = (tarea) => {
    setEditing(tarea);
    setForm({
      asignatura: tarea.asignatura,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      tipo_tarea: tarea.tipo_tarea,
      peso_porcentual: tarea.peso_porcentual,
      fecha_publicacion: formatearFechaInput(tarea.fecha_publicacion),
      fecha_vencimiento: formatearFechaInput(tarea.fecha_vencimiento),
      estado: tarea.estado,
      permite_entrega_tardia: tarea.permite_entrega_tardia || false,
      publicar_automaticamente: tarea.estado === 'publicada',
      archivo_adjunto: null, // No pre-cargamos archivo
    });
    setArchivoAdjunto(null);
    setOpen(true);
  };

  const cerrarDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejar cambio de archivo
  const handleArchivoChange = (e) => {
    const file = e.target.files[0] || null;
    setArchivoAdjunto(file);
  };

  const pesoContexto = useMemo(() => {
    const asignaturaId = form.asignatura;
    if (!asignaturaId) {
      return {
        pesoEsta: Number(form.peso_porcentual || 0),
        totalSinEsta: 0,
        totalConEsta: Number(form.peso_porcentual || 0),
        disponible: 100 - Number(form.peso_porcentual || 0),
      };
    }

    const pesoEsta = Number(form.peso_porcentual || 0);
    const totalSinEsta = (tareas || [])
      .filter((t) => String(t.asignatura) === String(asignaturaId))
      .filter((t) => (editing ? t.id !== editing.id : true))
      .reduce((acc, t) => acc + Number(t.peso_porcentual || 0), 0);

    const totalConEsta = totalSinEsta + pesoEsta;
    const disponible = 100 - totalConEsta;

    return { pesoEsta, totalSinEsta, totalConEsta, disponible };
  }, [form.asignatura, form.peso_porcentual, tareas, editing]);

  const tituloDuplicado = useMemo(() => {
    if (!form.asignatura || !form.titulo?.trim()) return false;
    const titulo = form.titulo.trim().toLowerCase();
    return (tareas || [])
      .filter((t) => String(t.asignatura) === String(form.asignatura))
      .filter((t) => (editing ? t.id !== editing.id : true))
      .some((t) => (t.titulo || '').trim().toLowerCase() === titulo);
  }, [form.asignatura, form.titulo, tareas, editing]);

  const validarFormulario = () => {
    if (!form.asignatura) {
      setMessage({ type: 'error', text: 'Debe seleccionar una asignatura' });
      return false;
    }
    if (!form.titulo?.trim() || form.titulo.trim().length < 5) {
      setMessage({ type: 'error', text: 'El título debe tener al menos 5 caracteres' });
      return false;
    }
    if (form.titulo.trim().length > 200) {
      setMessage({ type: 'error', text: 'El título no puede superar 200 caracteres' });
      return false;
    }
    if (tituloDuplicado) {
      setMessage({ type: 'error', text: 'Ya existe una tarea con ese título en esta asignatura' });
      return false;
    }
    if (!form.fecha_publicacion) {
      setMessage({ type: 'error', text: 'Debe indicar fecha de publicación' });
      return false;
    }
    if (!form.fecha_vencimiento) {
      setMessage({ type: 'error', text: 'Debe indicar fecha de vencimiento' });
      return false;
    }
    if (new Date(form.fecha_vencimiento) <= new Date(form.fecha_publicacion)) {
      setMessage({ type: 'error', text: 'Fecha de vencimiento debe ser posterior a publicación' });
      return false;
    }
    if (form.peso_porcentual < 0 || form.peso_porcentual > 100) {
      setMessage({ type: 'error', text: 'El peso debe estar entre 0 y 100' });
      return false;
    }
    return true;
  };

  const construirFormData = (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key !== 'archivo_adjunto') {
        formData.append(key, value);
      }
    });
    if (archivoAdjunto) {
      formData.append('archivo_adjunto', archivoAdjunto);
    }
    return formData;
  };

  const guardar = async (estadoObjetivo) => {
    if (!validarFormulario()) return;

    try {
      let estadoFinal = estadoObjetivo;
      if (estadoObjetivo === 'publicada' && !form.publicar_automaticamente) {
        estadoFinal = 'borrador';
      }

      const payload = { ...form, estado: estadoFinal };
      const formData = construirFormData(payload);

      if (editing) {
        await tareasService.actualizar(editing.id, formData, true);
        if (estadoObjetivo === 'publicada' && !form.publicar_automaticamente) {
          setMessage({ type: 'warning', text: 'Tarea actualizada y guardada como borrador (Publicar automáticamente desactivado)' });
        } else {
          setMessage({ type: 'success', text: 'Tarea actualizada' });
        }
      } else {
        const res = await tareasService.crear(formData, true);
        const count = res?.data?.estudiantes_notificados;

        if (estadoObjetivo === 'publicada' && !form.publicar_automaticamente) {
          setMessage({ type: 'warning', text: 'Tarea creada y guardada como borrador (Publicar automáticamente desactivado)' });
        } else if (estadoFinal === 'publicada' && Number.isFinite(count)) {
          setMessage({ type: 'success', text: `Tarea creada exitosamente. ${count} estudiantes notificados por email` });
        } else {
          setMessage({ type: 'success', text: 'Tarea creada exitosamente' });
        }
      }

      await cargarDatos();
      cerrarDialog();
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
    } catch (e) {
      const errMsg =
        e.response?.data?.fecha_vencimiento?.[0] ||
        e.response?.data?.peso_porcentual?.[0] ||
        e.response?.data?.titulo?.[0] ||
        e.response?.data?.detail ||
        'Error al guardar tarea';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  const confirmarEliminar = (tarea) => setConfirmDelete({ open: true, tarea });
  const eliminarConfirmado = async () => {
    const tarea = confirmDelete.tarea;
    if (!tarea) return;
    try {
      await tareasService.eliminar(tarea.id);
      await cargarDatos();

      const pesoInfo = pesosPorAsignatura[tarea.asignatura] || { peso_total: 0 };
      const disponible = Math.max(0, 100 - Number(pesoInfo.peso_total || 0));
      setMessage({ type: 'success', text: `Tarea eliminada. Peso disponible: ${disponible}%` });
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
    } catch (e) {
      setMessage({ type: 'error', text: 'No se pudo eliminar la tarea' });
    } finally {
      setConfirmDelete({ open: false, tarea: null });
    }
  };

  const confirmarToggleEstado = (tarea, nextEstado) => {
    setConfirmToggle({ open: true, tarea, nextEstado });
  };

  const aplicarToggleEstado = async () => {
    const { tarea, nextEstado } = confirmToggle;
    if (!tarea || !nextEstado) return;
    try {
      if (nextEstado === 'publicada') {
        const res = await tareasService.publicar(tarea.id);
        const count = res?.data?.estudiantes_notificados;
        if (Number.isFinite(count)) {
          setMessage({ type: 'success', text: `Tarea publicada exitosamente. ${count} estudiantes notificados por email` });
        } else {
          setMessage({ type: 'success', text: 'Tarea publicada exitosamente. Se enviará email a estudiantes' });
        }
      } else {
        await tareasService.editarParcial(tarea.id, { estado: 'borrador' });
        setMessage({ type: 'warning', text: 'Tarea despublicada (borrador). Ya no será visible para estudiantes' });
      }
      await cargarDatos();
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
    } catch (e) {
      const errMsg = e.response?.data?.peso_porcentual?.[0] || e.response?.data?.detail || 'No se pudo cambiar el estado';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setConfirmToggle({ open: false, tarea: null, nextEstado: null });
    }
  };

  const confirmarCerrar = (tarea) => setConfirmCerrar({ open: true, tarea });
  const cerrarConfirmado = async () => {
    const tarea = confirmCerrar.tarea;
    if (!tarea) return;
    try {
      await tareasService.cerrar(tarea.id);
      setMessage({ type: 'success', text: 'Tarea cerrada' });
      await cargarDatos();
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al cerrar tarea' });
    } finally {
      setConfirmCerrar({ open: false, tarea: null });
    }
  };

  const obtenerColorPeso = (pesoTotal) => {
    if (pesoTotal === 100) return '#4caf50'; // verde
    if (pesoTotal < 100) return '#ff9800'; // naranja
    return '#f44336'; // rojo
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'publicada': return 'success';
      case 'borrador': return 'warning';
      case 'cerrada': return 'error';
      default: return 'default';
    }
  };

  if (!esStaffTareas) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tienes permisos para acceder a esta página</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="/dashboard">
            Inicio
          </Link>
          <Typography color="text.primary">Académico</Typography>
          <Typography color="text.primary">Tareas y Exámenes</Typography>
        </Breadcrumbs>

        <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Tareas y Exámenes</Typography>
        {puedeCrear && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
            Nueva Tarea
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="filtro-asignatura">Asignatura</InputLabel>
          <Select
            labelId="filtro-asignatura"
            label="Asignatura"
            value={filterAsignatura}
            onChange={(e) => setFilterAsignatura(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {asignaturas.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.codigo} - {a.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="filtro-tipo">Tipo</InputLabel>
          <Select
            labelId="filtro-tipo"
            label="Tipo"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="tarea">Tarea</MenuItem>
            <MenuItem value="examen">Examen</MenuItem>
            <MenuItem value="quiz">Quiz</MenuItem>
            <MenuItem value="proyecto">Proyecto</MenuItem>
            <MenuItem value="participacion">Participación</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filtro-estado">Estado</InputLabel>
          <Select
            labelId="filtro-estado"
            label="Estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="publicada">Publicada</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
            <MenuItem value="cerrada">Cerrada</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {loading && <Typography>Cargando...</Typography>}

      {!loading && Object.keys(tareasAgrupadas).length === 0 && (
        <Alert severity="info">No hay tareas creadas aún</Alert>
      )}

      {!loading && Object.entries(tareasAgrupadas).map(([key, grupo]) => {
        const pesoInfo = pesosPorAsignatura[grupo.asignatura_id] || { peso_total: 0, peso_disponible: 100, completo: false };
        const pesoTotal = pesoInfo.peso_total || 0;

        const bannerPeso = (() => {
          if (pesoTotal === 100) return null;
          if (pesoTotal > 100) {
            return (
              <Alert severity="error" sx={{ mt: 1 }}>
                ❌ Peso total supera 100% (actual: {pesoTotal}%). Excede por {pesoTotal - 100}%
              </Alert>
            );
          }
          if (pesoTotal < 100 && pesoTotal > 0) {
            return (
              <Alert severity="warning" sx={{ mt: 1 }}>
                ⚠️ Peso total asignado: {pesoTotal}%. Falta {100 - pesoTotal}% para completar 100%
              </Alert>
            );
          }
          return (
            <Alert severity="warning" sx={{ mt: 1 }}>
              ⚠️ Peso total asignado: {pesoTotal}%. Falta {100 - pesoTotal}% para completar 100%
            </Alert>
          );
        })();

        return (
          <Accordion key={key} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {grupo.asignatura_codigo} - {grupo.asignatura_nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ width: 200, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(pesoTotal, 100)}
                        sx={{
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: obtenerColorPeso(pesoTotal)
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: obtenerColorPeso(pesoTotal) }}>
                      {pesoTotal}% asignado de 100%
                    </Typography>
                    {pesoTotal > 100 && (
                      <Chip label={`Excede ${pesoTotal - 100}%`} color="error" size="small" />
                    )}
                    {pesoTotal < 100 && pesoTotal > 0 && (
                      <Chip label={`Falta ${100 - pesoTotal}%`} color="warning" size="small" />
                    )}
                  </Box>
                  {bannerPeso}
                </Box>
                <Chip label={`${grupo.tareas.length} tarea(s)`} size="small" />
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asignatura</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center">Peso</TableCell>
                      <TableCell>Publicación</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell>Archivo</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grupo.tareas.map(tarea => (
                      <TableRow key={tarea.id} hover>
                        <TableCell>
                          {grupo.asignatura_codigo} - {grupo.asignatura_nombre}
                        </TableCell>
                        <TableCell>{tarea.titulo}</TableCell>
                        <TableCell>
                          <Chip
                            label={tarea.tipo_tarea.charAt(0).toUpperCase() + tarea.tipo_tarea.slice(1)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ minWidth: 140 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(Number(tarea.peso_porcentual || 0), 100)}
                              sx={{
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: obtenerColorPeso(Number(tarea.peso_porcentual || 0))
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: obtenerColorPeso(Number(tarea.peso_porcentual || 0)) }}>
                              {tarea.peso_porcentual}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(tarea.fecha_publicacion).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {tarea.archivo_adjunto ? (
                            <a href={tarea.archivo_adjunto} target="_blank" rel="noopener noreferrer">
                              Descargar
                            </a>
                          ) : (
                            <span style={{ color: '#aaa' }}>—</span>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={tarea.estado.charAt(0).toUpperCase() + tarea.estado.slice(1)}
                            size="small"
                            color={obtenerColorEstado(tarea.estado)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => setPreview({ open: true, tarea })}
                              title="Vista previa"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>

                            <Tooltip title={tarea.estado === 'cerrada' ? 'No se puede editar tarea cerrada' : 'Editar'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => abrirEditar(tarea)}
                                  disabled={tarea.estado === 'cerrada'}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {tarea.estado !== 'cerrada' && tarea.estado === 'borrador' && (
                              <IconButton
                                size="small"
                                onClick={() => confirmarToggleEstado(tarea, 'publicada')}
                                color="success"
                                title="Publicar"
                              >
                                <PublishIcon fontSize="small" />
                              </IconButton>
                            )}

                            {tarea.estado !== 'cerrada' && tarea.estado === 'publicada' && (
                              <IconButton
                                size="small"
                                onClick={() => confirmarToggleEstado(tarea, 'borrador')}
                                color="warning"
                                title="Despublicar"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                            {tarea.estado !== 'cerrada' && tarea.esta_vencida && (
                              <IconButton
                                size="small"
                                onClick={() => confirmarCerrar(tarea)}
                                color="error"
                                title="Cerrar"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => confirmarEliminar(tarea)}
                              color="error"
                              title="Eliminar"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Dialog Crear/Editar Tarea */}
      <Dialog open={open} onClose={cerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editing ? 'Editar Tarea' : 'Nueva Tarea'}
        </DialogTitle>
        <DialogContent dividers>
          {/* Warnings persistentes de peso (permitimos guardar aunque != 100) */}
          {form.asignatura && (
            pesoContexto.totalConEsta !== 100 ? (
              <Alert severity={pesoContexto.totalConEsta > 100 ? 'error' : 'warning'} sx={{ mb: 2 }}>
                {pesoContexto.totalConEsta > 100
                  ? `❌ Peso total supera 100% (actual: ${pesoContexto.totalConEsta}%). Excede por ${pesoContexto.totalConEsta - 100}%`
                  : `⚠️ Peso total asignado: ${pesoContexto.totalConEsta}%. Falta ${100 - pesoContexto.totalConEsta}% para completar 100%`}
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Peso total asignado: 100%
              </Alert>
            )
          )}

          {form.asignatura && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Esta tarea: {pesoContexto.pesoEsta}% | Total asignado: {pesoContexto.totalConEsta}% | Disponible: {Math.max(0, 100 - pesoContexto.totalConEsta)}%
              </Typography>
            </Box>
          )}

          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Asignatura - Fila completa */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', display: 'block', mb: 0.5 }}>
                Asignatura *
              </Typography>
              <TextField
                select
                name="asignatura"
                value={form.asignatura}
                onChange={handleChange}
                fullWidth
                required
                disabled={!!editing}
              >
                {asignaturas.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.codigo} - {a.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Título - Fila completa */}
            <Grid item xs={12}>
              <TextField
                label="Título"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                fullWidth
                required
                error={tituloDuplicado}
                inputProps={{ maxLength: 200 }}
                helperText={
                  tituloDuplicado
                    ? 'Nombre único por asignatura: ya existe'
                    : (form.titulo.length > 200
                      ? 'Máximo 200 caracteres'
                      : (form.titulo.length < 5 && form.titulo.length > 0 ? 'Mínimo 5 caracteres' : ''))
                }
              />
            </Grid>

            {/* Tipo y Peso - Misma fila */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="tipo-label">Tipo de Evaluación</InputLabel>
                <Select
                  labelId="tipo-label"
                  id="tipo-select"
                  label="Tipo de Evaluación"
                  name="tipo_tarea"
                  value={form.tipo_tarea}
                  onChange={handleChange}
                >
                  <MenuItem value="tarea">Tarea</MenuItem>
                  <MenuItem value="examen">Examen</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="proyecto">Proyecto</MenuItem>
                  <MenuItem value="participacion">Participación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Peso Porcentual (%)"
                name="peso_porcentual"
                type="number"
                value={form.peso_porcentual}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ step: 0.5, min: 0, max: 100 }}
                helperText="Valor entre 0 y 100"
              />
            </Grid>

            {/* Fechas - Misma fila */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha Publicación"
                name="fecha_publicacion"
                type="datetime-local"
                value={form.fecha_publicacion}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                helperText="Fecha cuando se hará visible"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha Vencimiento"
                name="fecha_vencimiento"
                type="datetime-local"
                value={form.fecha_vencimiento}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                helperText="Fecha límite de entrega"
                error={
                  !!form.fecha_publicacion &&
                  !!form.fecha_vencimiento &&
                  new Date(form.fecha_vencimiento) <= new Date(form.fecha_publicacion)
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.permite_entrega_tardia}
                    onChange={(e) => setForm((prev) => ({ ...prev, permite_entrega_tardia: e.target.checked }))}
                  />
                }
                label="Permitir envío tardío"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.publicar_automaticamente}
                    onChange={(e) => setForm((prev) => ({ ...prev, publicar_automaticamente: e.target.checked }))}
                  />
                }
                label="Publicar automáticamente"
              />
            </Grid>

            {/* Descripción - Fila completa */}
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Instrucciones detalladas de la tarea..."
                helperText="Puedes usar Markdown"
              />
            </Grid>

            {/* Archivo adjunto - Fila completa */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<PublishIcon />}>
                {archivoAdjunto ? archivoAdjunto.name : 'Adjuntar archivo (opcional)'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  hidden
                  onChange={handleArchivoChange}
                />
              </Button>
              {editing && editing.archivo_adjunto && !archivoAdjunto && (
                <Box mt={1}>
                  <a href={editing.archivo_adjunto} target="_blank" rel="noopener noreferrer">
                    Descargar archivo actual
                  </a>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={cerrarDialog} color="inherit">
            Cancelar
          </Button>
          <Button variant="outlined" onClick={() => guardar('borrador')} size="large">
            Guardar como Borrador
          </Button>
          <Button
            variant="contained"
            onClick={() => guardar('publicada')}
            size="large"
          >
            Publicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación eliminar */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, tarea: null })}>
        <DialogTitle>Eliminar tarea</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ¿Eliminar tarea "{confirmDelete.tarea?.titulo}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, tarea: null })}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={eliminarConfirmado}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación publicar/despublicar */}
      <Dialog open={confirmToggle.open} onClose={() => setConfirmToggle({ open: false, tarea: null, nextEstado: null })}>
        <DialogTitle>
          {confirmToggle.nextEstado === 'publicada' ? 'Publicar tarea' : 'Despublicar tarea'}
        </DialogTitle>
        <DialogContent dividers>
          {confirmToggle.nextEstado === 'publicada' ? (
            <Typography>¿Publicar ahora? Se enviará email a estudiantes</Typography>
          ) : (
            <Typography>Al despublicar, la tarea dejará de ser visible para estudiantes.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggle({ open: false, tarea: null, nextEstado: null })}>Cancelar</Button>
          <Button variant="contained" onClick={aplicarToggleEstado}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación cerrar tarea */}
      <Dialog open={confirmCerrar.open} onClose={() => setConfirmCerrar({ open: false, tarea: null })}>
        <DialogTitle>Cerrar tarea</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ¿Cerrar tarea "{confirmCerrar.tarea?.titulo}"? Los estudiantes no podrán enviar más trabajos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCerrar({ open: false, tarea: null })}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={cerrarConfirmado}>Cerrar tarea</Button>
        </DialogActions>
      </Dialog>

      {/* Vista previa */}
      <Dialog open={preview.open} onClose={() => setPreview({ open: false, tarea: null })} maxWidth="md" fullWidth>
        <DialogTitle>Vista previa</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" sx={{ mb: 1 }}>{preview.tarea?.titulo}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {preview.tarea?.asignatura_codigo} - {preview.tarea?.asignatura_nombre}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Publicación: {preview.tarea?.fecha_publicacion ? new Date(preview.tarea.fecha_publicacion).toLocaleString() : '—'}
            {'  '}|{'  '}
            Vencimiento: {preview.tarea?.fecha_vencimiento ? new Date(preview.tarea.fecha_vencimiento).toLocaleString() : '—'}
          </Typography>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {preview.tarea?.descripcion || 'Sin descripción'}
          </ReactMarkdown>
          {preview.tarea?.archivo_adjunto && (
            <Box sx={{ mt: 2 }}>
              <Link href={preview.tarea.archivo_adjunto} target="_blank" rel="noopener noreferrer">
                Descargar archivo adjunto
              </Link>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview({ open: false, tarea: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
        </Paper>
      </Stack>
    </Container>
  );
}
