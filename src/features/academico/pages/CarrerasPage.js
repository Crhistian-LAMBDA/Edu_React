import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  IconButton,
  Typography,
  Container,
  Stack,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import carrerasService from '../services/carrerasService';
import facultadesService from '../services/facultadesService';
import { useSearch } from '../../../shared/context/SearchContext';

const CarrerasPage = () => {
  const { searchTerm } = useSearch();
  const [carreras, setCarreras] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    facultad: '',
    nivel: 'pregrado',
    modalidad: 'presencial',
    descripcion: '',
    estado: true,
  });

  useEffect(() => {
    cargarFacultades();
    cargarCarreras();
  }, []);

  const cargarFacultades = async () => {
    try {
      const response = await facultadesService.listar();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setFacultades(data);
    } catch (err) {
      setError('Error al cargar facultades');
    }
  };

  const cargarCarreras = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await carrerasService.listar();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setCarreras(data);
    } catch (err) {
      setError('Error al cargar carreras: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setFormData({
      nombre: '',
      codigo: '',
      facultad: '',
      nivel: 'pregrado',
      modalidad: 'presencial',
      descripcion: '',
      estado: true,
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleEditar = (carrera) => {
    setFormData({
      id: carrera.id,
      nombre: carrera.nombre,
      codigo: carrera.codigo,
      facultad: carrera.facultad,
      nivel: carrera.nivel,
      modalidad: carrera.modalidad,
      descripcion: carrera.descripcion,
      estado: carrera.estado,
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleGuardar = async () => {
    try {
      setError('');
      if (!formData.nombre || !formData.codigo || !formData.facultad) {
        setError('Nombre, código y facultad son obligatorios');
        return;
      }

      if (isEditing) {
        await carrerasService.actualizar(formData.id, formData);
      } else {
        await carrerasService.crear(formData);
      }

      setOpenDialog(false);
      cargarCarreras();
    } catch (err) {
      setError('Error al guardar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta carrera?')) {
      try {
        await carrerasService.eliminar(id);
        cargarCarreras();
      } catch (err) {
        setError('Error al eliminar: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Filtrado en tiempo real por todos los campos
  const carrerasFiltradas = useMemo(() => {
    if (!searchTerm?.trim()) return carreras;
    const termino = searchTerm.toLowerCase();
    return carreras.filter(carrera => 
      carrera.id?.toString().includes(termino) ||
      carrera.nombre?.toLowerCase().includes(termino) ||
      carrera.codigo?.toLowerCase().includes(termino) ||
      carrera.descripcion?.toLowerCase().includes(termino) ||
      carrera.nivel?.toLowerCase().includes(termino) ||
      carrera.modalidad?.toLowerCase().includes(termino) ||
      carrera.facultad_nombre?.toLowerCase().includes(termino) ||
      (carrera.estado ? 'activa' : 'inactiva').includes(termino) ||
      carrera.fecha_creacion?.toLowerCase().includes(termino)
    );
  }, [carreras, searchTerm]);

  // Configuración de columnas para DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'nombre', headerName: 'Nombre', width: 250 },
    { field: 'facultad_nombre', headerName: 'Facultad', width: 200 },
    { 
      field: 'nivel', 
      headerName: 'Nivel', 
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value === 'pregrado' ? 'Pregrado' : 'Posgrado'}
          color="primary"
          size="small"
          variant="outlined"
        />
      )
    },
    { 
      field: 'modalidad', 
      headerName: 'Modalidad', 
      width: 130,
      valueFormatter: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activa' : 'Inactiva'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      )
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton size="small" color="primary" onClick={() => handleEditar(params.row)} title="Editar">
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleEliminar(params.row.id)} title="Eliminar">
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">Gestión de Carreras</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNuevo}>
            Nueva Carrera
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Paper variant="outlined" sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={carrerasFiltradas}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
          />
        </Paper>
      </Stack>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Carrera' : 'Nueva Carrera'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: Ingeniería de Sistemas"
          />
          <TextField
            fullWidth
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={handleInputChange}
            placeholder="Ej: IS"
            disabled={isEditing}
          />
          <FormControl fullWidth>
            <InputLabel>Facultad</InputLabel>
            <Select name="facultad" value={formData.facultad} onChange={handleInputChange} label="Facultad">
              <MenuItem value="">Selecciona una facultad</MenuItem>
              {facultades.map((fac) => (
                <MenuItem key={fac.id} value={fac.id}>
                  {fac.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Nivel</InputLabel>
            <Select name="nivel" value={formData.nivel} onChange={handleInputChange} label="Nivel">
              <MenuItem value="pregrado">Pregrado</MenuItem>
              <MenuItem value="posgrado">Posgrado</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Modalidad</InputLabel>
            <Select name="modalidad" value={formData.modalidad} onChange={handleInputChange} label="Modalidad">
              <MenuItem value="presencial">Presencial</MenuItem>
              <MenuItem value="virtual">Virtual</MenuItem>
              <MenuItem value="mixta">Mixta</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
          <FormControlLabel
            control={<Checkbox name="estado" checked={formData.estado} onChange={handleInputChange} />}
            label="Activa"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained">
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CarrerasPage;
