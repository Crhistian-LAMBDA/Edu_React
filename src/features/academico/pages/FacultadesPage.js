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
  Alert,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import facultadesService from '../services/facultadesService';
import { useSearch } from '../../../shared/context/SearchContext';

const FacultadesPage = () => {
  const { searchTerm } = useSearch();
  const [facultades, setFacultades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    estado: true,
  });

  useEffect(() => {
    cargarFacultades();
  }, []);

  const cargarFacultades = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await facultadesService.listar();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setFacultades(data);
    } catch (err) {
      setError('Error al cargar facultades: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setFormData({ nombre: '', codigo: '', descripcion: '', estado: true });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleEditar = (facultad) => {
    setFormData(facultad);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleGuardar = async () => {
    try {
      setError('');
      if (!formData.nombre || !formData.codigo) {
        setError('Nombre y código son obligatorios');
        return;
      }

      if (isEditing) {
        await facultadesService.actualizar(formData.id, formData);
      } else {
        await facultadesService.crear(formData);
      }

      setOpenDialog(false);
      cargarFacultades();
    } catch (err) {
      setError('Error al guardar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta facultad?')) {
      try {
        await facultadesService.eliminar(id);
        cargarFacultades();
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
  const facultadesFiltradas = useMemo(() => {
    if (!searchTerm?.trim()) return facultades;
    const termino = searchTerm.toLowerCase();
    return facultades.filter(facultad => 
      facultad.id?.toString().includes(termino) ||
      facultad.nombre?.toLowerCase().includes(termino) ||
      facultad.codigo?.toLowerCase().includes(termino) ||
      facultad.descripcion?.toLowerCase().includes(termino) ||
      facultad.coordinador_nombre?.toLowerCase().includes(termino) ||
      (facultad.estado ? 'activa' : 'inactiva').includes(termino) ||
      facultad.fecha_creacion?.toLowerCase().includes(termino)
    );
  }, [facultades, searchTerm]);

  // Configuración de columnas para DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'nombre', headerName: 'Nombre', width: 250 },
    { field: 'coordinador_nombre', headerName: 'Coordinador', width: 200 },
    { field: 'descripcion', headerName: 'Descripción', width: 250 },
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
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Gestión de Facultades</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNuevo}>
          Nueva Facultad
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={facultadesFiltradas}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Facultad' : 'Nueva Facultad'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: Facultad de Ciencias"
          />
          <TextField
            fullWidth
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={handleInputChange}
            placeholder="Ej: FCI"
            disabled={isEditing}
          />
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
    </Box>
  );
};

export default FacultadesPage;
