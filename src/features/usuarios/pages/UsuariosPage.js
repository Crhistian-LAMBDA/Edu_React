import React, { useEffect, useState, useMemo } from 'react';
import { usuariosService } from '../services/usuariosService';
import { Paper, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Grid, Chip, OutlinedInput } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '../../../hooks/AuthContext';
import { useSearch } from '../../../shared/context/SearchContext';

export default function UsuariosPage() {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para entidades académicas
  const [facultades, setFacultades] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);

  // Validar permisos: solo admin y super_admin
  const tienePermisos = user?.rol === 'admin' || user?.rol === 'super_admin';

  useEffect(() => {
    if (tienePermisos) {
      cargarUsuarios();
      cargarEntidadesAcademicas();
    }
  }, [tienePermisos]);
  
  const cargarEntidadesAcademicas = async () => {
    try {
      const [facRes, progRes, asigRes] = await Promise.all([
        usuariosService.listarFacultades(),
        usuariosService.listarProgramas(),
        usuariosService.listarAsignaturas()
      ]);
      setFacultades(facRes.data.results || facRes.data);
      setProgramas(progRes.data.results || progRes.data);
      setAsignaturas(asigRes.data.results || asigRes.data);
    } catch (error) {
      console.error('Error cargando entidades académicas:', error);
    }
  };

  const cargarUsuarios = () => {
    setLoading(true);
    usuariosService.listarUsuarios()
      .then(res => setItems(res.data.results || res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const abrirEditar = (usr) => {
    if (usr?.rol === 'super_admin' && user?.rol !== 'super_admin') {
      setMessage({ type: 'error', text: 'No tienes permiso para editar super administradores' });
      return;
    }
    if (usr?.rol === 'admin' && user?.rol !== 'super_admin') {
      setMessage({ type: 'error', text: 'No tienes permiso para editar administradores' });
      return;
    }
    setEditingUser(usr);
    setEditForm({ 
      first_name: usr.first_name, 
      last_name: usr.last_name, 
      email: usr.email,
      rol: usr.rol,
      estado: usr.estado || (usr.is_active ? 'activo' : 'inactivo'),
      facultad: usr.facultad || '',
      programa: usr.programa || '',
      asignaturas_ids: usr.asignaturas_ids || []
    });
    setOpen(true);
  };

  const cerrarEditar = () => {
    setOpen(false);
    setEditingUser(null);
    setEditForm({});
  };

  const abrirVer = (usuario) => {
    setViewingUser(usuario);
    setViewOpen(true);
  };

  const cerrarVer = () => {
    setViewOpen(false);
    setViewingUser(null);
  };

  const guardarEdicion = async () => {
    try {
      await usuariosService.actualizarUsuario(editingUser.id, editForm);
      setMessage({ type: 'success', text: 'Usuario actualizado' });
      cargarUsuarios();
      cerrarEditar();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Error al actualizar' });
    }
  };

  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm?.trim()) return items;
    const termino = searchTerm.toLowerCase();
    return items.filter(usr => 
      usr.username.toLowerCase().includes(termino) ||
      usr.first_name?.toLowerCase().includes(termino) ||
      usr.last_name?.toLowerCase().includes(termino) ||
      usr.email?.toLowerCase().includes(termino) ||
      usr.rol?.toLowerCase().includes(termino) ||
      usr.estado?.toLowerCase().includes(termino)
    );
  }, [items, searchTerm]);

  const eliminarUsuario = (id, username) => {
    if (window.confirm(`¿Eliminar usuario ${username}?`)) {
      usuariosService.eliminarUsuario(id)
        .then(() => {
          setMessage({ type: 'success', text: 'Usuario eliminado' });
          cargarUsuarios();
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        })
        .catch(() => setMessage({ type: 'error', text: 'Error al eliminar' }));
    }
  };

  const columns = [
    { field: 'username', headerName: 'Usuario', width: 120 },
    { field: 'first_name', headerName: 'Nombre', width: 120 },
    { field: 'last_name', headerName: 'Apellido', width: 120 },
    { field: 'numero_documento', headerName: 'Documento', width: 130 },
    { field: 'email', headerName: 'Correo', width: 200 },
    { field: 'rol', headerName: 'Rol', width: 120 },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      width: 100,
      valueGetter: (value, row) => row?.estado ?? (row?.is_active ? 'activo' : 'inactivo')
    },
    {
      field: 'fecha_creacion',
      headerName: 'Fecha Registro',
      width: 150,
      valueGetter: (value, row) => {
        if (!row?.fecha_creacion) return '-';
        return new Date(row.fecha_creacion).toLocaleDateString('es-ES');
      }
    },
    {
      field: 'asignacion',
      headerName: 'Asignación Académica',
      width: 250,
      sortable: false,
      renderCell: (params) => {
        const row = params.row;
        
        if (row.rol === 'estudiante') {
          return <Typography variant="body2">{row.programa_nombre || '-'}</Typography>;
        }
        
        if (row.rol === 'profesor') {
          const asignaturasDelProfesor = asignaturas.filter(a => row.asignaturas_ids?.includes(a.id));
          return asignaturasDelProfesor.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {asignaturasDelProfesor.map(a => (
                <Chip key={a.id} label={a.codigo} size="small" variant="outlined" />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">Sin asignar</Typography>
          );
        }
        
        if (row.rol === 'admin') {
          return <Typography variant="body2">{row.facultad_nombre || '-'}</Typography>;
        }
        
        return <Typography variant="body2">-</Typography>;
      }
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const puedeEditar = user?.rol === 'super_admin' || 
                           (user?.rol === 'admin' && params.row.rol !== 'admin' && params.row.rol !== 'super_admin');
        const puedeEliminar = user?.rol === 'super_admin' || 
                             (user?.rol === 'admin' && params.row.rol !== 'admin' && params.row.rol !== 'super_admin');
        
        return (
          <>
            <IconButton size="small" color="info" onClick={() => abrirVer(params.row)} title="Ver perfil">
              <VisibilityIcon />
            </IconButton>
            {puedeEditar && (
              <IconButton size="small" color="primary" onClick={() => abrirEditar(params.row)} title="Editar">
                <EditIcon />
              </IconButton>
            )}
            {puedeEliminar && (
              <IconButton size="small" color="error" onClick={() => eliminarUsuario(params.row.id, params.row.username)} title="Eliminar">
                <DeleteIcon />
              </IconButton>
            )}
          </>
        );
      },
    },
  ];

  if (!tienePermisos) {
    return (
      <Box p={3}>
        <Alert severity="warning">No tienes permisos para acceder a esta sección. Solo administradores.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={3}>Usuarios</Typography>
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={usuariosFiltrados}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={cerrarEditar}>
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Nombre"
            fullWidth
            value={editForm.first_name || ''}
            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Apellido"
            fullWidth
            value={editForm.last_name || ''}
            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Correo"
            fullWidth
            value={editForm.email || ''}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rol</InputLabel>
            <Select
              label="Rol"
              value={editForm.rol || ''}
              onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
            >
              <MenuItem value="estudiante">Estudiante</MenuItem>
              <MenuItem value="profesor">Profesor</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="super_admin">Super Administrador</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={editForm.estado || ''}
              onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>
          {editForm.rol === 'admin' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Facultad</InputLabel>
              <Select
                label="Facultad"
                value={editForm.facultad || ''}
                onChange={(e) => setEditForm({ ...editForm, facultad: e.target.value })}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {facultades.map(fac => (
                  <MenuItem key={fac.id} value={fac.id}>{fac.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {editForm.rol === 'estudiante' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Programa</InputLabel>
              <Select
                label="Programa"
                value={editForm.programa || ''}
                onChange={(e) => setEditForm({ ...editForm, programa: e.target.value })}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {programas.map(prog => (
                  <MenuItem key={prog.id} value={prog.id}>{prog.codigo} - {prog.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {editForm.rol === 'profesor' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Asignaturas</InputLabel>
              <Select
                label="Asignaturas"
                multiple
                value={editForm.asignaturas_ids || []}
                onChange={(e) => setEditForm({ ...editForm, asignaturas_ids: e.target.value })}
                input={<OutlinedInput label="Asignaturas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const asig = asignaturas.find(a => a.id === value);
                      return <Chip key={value} label={asig?.codigo || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {asignaturas.map(asig => (
                  <MenuItem key={asig.id} value={asig.id}>{asig.codigo} - {asig.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarEditar}>Cancelar</Button>
          <Button onClick={guardarEdicion} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={cerrarVer} maxWidth="sm" fullWidth>
        <DialogTitle>Perfil de Usuario</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {viewingUser && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Usuario</Typography>
                <Typography variant="body1" fontWeight="bold">{viewingUser.username}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Correo</Typography>
                <Typography variant="body1">{viewingUser.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Nombre</Typography>
                <Typography variant="body1">{viewingUser.first_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Apellido</Typography>
                <Typography variant="body1">{viewingUser.last_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Rol</Typography>
                <Typography variant="body1" fontWeight="bold">{viewingUser.rol}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Estado</Typography>
                <Typography variant="body1">{viewingUser.estado ?? (viewingUser.is_active ? 'activo' : 'inactivo')}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Fecha de creación</Typography>
                <Typography variant="body1">{viewingUser.fecha_creacion ?? viewingUser.date_joined}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Último acceso</Typography>
                <Typography variant="body1">{viewingUser.last_login || 'Nunca'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarVer}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
