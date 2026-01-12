import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usuariosService } from '../services/usuariosService';
import { Paper, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Grid, Chip, Tabs, Tab, Container, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '../../../hooks/AuthContext';
import { useSearch } from '../../../shared/context/SearchContext';
import { getDisplayName } from '../../../shared/utils/roleDisplayNames';
import { ROLE_HIERARCHY } from '../../../hooks/useRoleHierarchy';

/**
 * UsuariosPage - Gestión de Usuarios y Roles (HU-05)
 * 
 * VALIDACIONES DE JERARQUÍA:
 * - Los administradores solo pueden editar usuarios de igual o menor jerarquía
 * - No se permite auto-promocionarse a un rol superior
 * - Solo super_admin puede asignar roles super_admin o admin
 * 
 * JERARQUÍA DE ROLES:
 * super_admin (5) > admin (4) > coordinador (3) > profesor (2) > estudiante (1)
 * 
 * SEGURIDAD:
 * - Las validaciones se aplican tanto en frontend como en backend
 * - Se requiere confirmación para cambios de rol significativos
 */

// Obtiene el rol principal basado en jerarquía
const getRolPrincipal = (roles) => {
  if (!roles || roles.length === 0) return null;
  return roles.reduce((mayor, actual) => {
    const pesoActual = ROLE_HIERARCHY[actual] || 0;
    const pesoMayor = ROLE_HIERARCHY[mayor] || 0;
    return pesoActual > pesoMayor ? actual : mayor;
  });
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // Pestaña activa: 0=Sin Rol, 1=Estudiantes, 2=Profesores, 3=Coordinadores, 4=Decanos/Rectores
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para entidades académicas
  const [facultades, setFacultades] = useState([]);
  const [carreras, setCarreras] = useState([]);

  // Función helper para verificar roles
  const tieneAlgunRol = useCallback((rolesRequeridos) => {
    if (!user) return false;
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(r => rolesRequeridos.includes(r));
    }
    return rolesRequeridos.includes(user.rol);
  }, [user]);

  // Validar permisos: solo admin y super_admin
  const tienePermisos = tieneAlgunRol(['admin', 'super_admin']);

  useEffect(() => {
    if (tienePermisos) {
      cargarUsuarios();
      cargarEntidadesAcademicas();
    }
  }, [tienePermisos]);
  
  const cargarEntidadesAcademicas = async () => {
    try {
      const [facRes, carRes] = await Promise.all([
        usuariosService.listarFacultades(),
        usuariosService.listarCarreras()
      ]);
      setFacultades(facRes.data.results || facRes.data);
      setCarreras(carRes.data.results || carRes.data);
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

  const abrirEditar = useCallback((usr) => {
    if (usr?.rol === 'super_admin' && user?.rol !== 'super_admin') {
      setMessage({ type: 'error', text: 'No tienes permiso para editar rectores' });
      return;
    }
    if (usr?.rol === 'admin' && user?.rol !== 'super_admin') {
      setMessage({ type: 'error', text: 'No tienes permiso para editar decanos' });
      return;
    }
    
    // Buscar facultad del coordinador (relación inversa)
    const facultadCoordinador = facultades.find(f => f.coordinador === usr.id);
    
    setEditingUser(usr);
    setEditForm({ 
      first_name: usr.first_name, 
      last_name: usr.last_name, 
      email: usr.email,
      rol: usr.rol,
      roles: usr.roles || [],
      estado: usr.estado || (usr.is_active ? 'activo' : 'inactivo'),
      facultad: usr.facultad || '',
      carrera: usr.carrera || '',
      facultad_coordinador_nombre: facultadCoordinador?.nombre || null
    });
    setOpen(true);
  }, [user, facultades]);

  const cerrarEditar = () => {
    setOpen(false);
    setEditingUser(null);
    setEditForm({});
  };

  const abrirVer = useCallback((usuario) => {
    setViewingUser(usuario);
    setViewOpen(true);
  }, []);

  const cerrarVer = () => {
    setViewOpen(false);
    setViewingUser(null);
  };

  const guardarEdicion = async () => {
    /**
     * Validación de jerarquía antes de guardar cambios de rol
     * 
     * REGLA: Solo super_admin puede asignar roles superiores
     * - Si usuario intenta ascender a otro rol a una posición superior,
     *   se verifica que el usuario actual sea super_admin
     * - Si no es super_admin, se rechaza el cambio
     * - Los cambios a roles iguales o inferiores siempre están permitidos
     */
    try {
      // VALIDACIÓN: Verificar jerarquía para cambios de rol
      const rolActualPrincipal = getRolPrincipal(editingUser.roles || [editingUser.rol]);
      const nuevoRolPrincipal = getRolPrincipal(editForm.roles || [editForm.rol]);
      
      // Si intenta cambiar rol a uno superior
      if ((ROLE_HIERARCHY[nuevoRolPrincipal] || 0) > (ROLE_HIERARCHY[rolActualPrincipal] || 0)) {
        // Solo super_admin puede asignar roles superiores
        if (user?.rol !== 'super_admin' && !user?.roles?.includes('super_admin')) {
          setMessage({ type: 'error', text: 'No puedes asignar roles superiores al tuyo' });
          return;
        }
      }
      
      // Preparar datos: incluir rol legacy como el rol principal
      const datosAGuardar = {
        ...editForm,
        rol: getRolPrincipal(editForm.roles || [editForm.rol]) // Asignar rol principal como rol legacy
      };
      
      await usuariosService.actualizarUsuario(editingUser.id, datosAGuardar);
      setMessage({ type: 'success', text: 'Usuario actualizado' });
      cargarUsuarios();
      cerrarEditar();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Error al actualizar' });
    }
  };

  const usuariosFiltrados = useMemo(() => {
    let filtrados = items;
    
    // Filtrar por pestaña activa
    switch(tabValue) {
      case 0: // Sin Rol Asignado
        filtrados = items.filter(usr => !usr.roles || usr.roles.length === 0);
        break;
      case 1: // Estudiantes
        filtrados = items.filter(usr => {
          const rolPrincipal = getRolPrincipal(usr.roles);
          return rolPrincipal === 'estudiante';
        });
        break;
      case 2: // Profesores
        filtrados = items.filter(usr => {
          const rolPrincipal = getRolPrincipal(usr.roles);
          return rolPrincipal === 'profesor';
        });
        break;
      case 3: // Coordinadores
        filtrados = items.filter(usr => {
          const rolPrincipal = getRolPrincipal(usr.roles);
          return rolPrincipal === 'coordinador';
        });
        break;
      case 4: // Decanos/Rectores
        filtrados = items.filter(usr => {
          const rolPrincipal = getRolPrincipal(usr.roles);
          return rolPrincipal === 'admin' || rolPrincipal === 'super_admin';
        });
        break;
      default:
        filtrados = items;
    }
    
    // Aplicar filtro de búsqueda
    if (searchTerm?.trim()) {
      const termino = searchTerm.toLowerCase();
      filtrados = filtrados.filter(usr => 
        usr.username.toLowerCase().includes(termino) ||
        usr.first_name?.toLowerCase().includes(termino) ||
        usr.last_name?.toLowerCase().includes(termino) ||
        usr.email?.toLowerCase().includes(termino) ||
        usr.rol?.toLowerCase().includes(termino) ||
        usr.estado?.toLowerCase().includes(termino)
      );
    }
    
    return filtrados;
  }, [items, searchTerm, tabValue]);

  const eliminarUsuario = useCallback((id, username) => {
    if (window.confirm(`¿Eliminar usuario ${username}?`)) {
      usuariosService.eliminarUsuario(id)
        .then(() => {
          setMessage({ type: 'success', text: 'Usuario eliminado' });
          cargarUsuarios();
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        })
        .catch(() => setMessage({ type: 'error', text: 'Error al eliminar' }));
    }
  }, []);

  const columns = useMemo(() => {
    const baseColumns = [
      { field: 'username', headerName: 'Usuario', width: 120 },
      { field: 'first_name', headerName: 'Nombre', width: 120 },
      { field: 'last_name', headerName: 'Apellido', width: 120 },
      { field: 'numero_documento', headerName: 'Documento', width: 130 },
      { field: 'email', headerName: 'Correo', width: 200 },
    ];
    
    // Columna de Rol con badges para roles adicionales
    const rolColumn = { 
      field: 'rol', 
      headerName: 'Rol', 
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        if (!row?.roles || row.roles.length === 0) {
          return <Typography variant="body2" color="textSecondary">Sin rol</Typography>;
        }
        
        const rolPrincipal = getRolPrincipal(row.roles);
        const rolesSecundarios = row.roles.filter(r => r !== rolPrincipal);
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip 
              label={getDisplayName(rolPrincipal)} 
              color="primary" 
              size="small" 
            />
            {rolesSecundarios.map(rol => (
              <Chip 
                key={rol}
                label={getDisplayName(rol)} 
                variant="outlined" 
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        );
      }
    };
    
    const commonColumns = [
      rolColumn,
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
    ];
    
    // Columnas específicas según pestaña
    let specificColumns = [];
    
    if (tabValue === 1) { // Estudiantes
      specificColumns = [
        {
          field: 'facultad_nombre',
          headerName: 'Facultad',
          width: 180,
          valueGetter: (value, row) => {
            const facultad = facultades.find(f => f.id === row.facultad);
            return facultad?.nombre || '-';
          }
        },
        {
          field: 'carrera_nombre',
          headerName: 'Carrera',
          width: 200,
          valueGetter: (value, row) => {
            const carrera = carreras.find(c => c.id === row.carrera);
            return carrera?.nombre || '-';
          }
        },
      ];
    } else if (tabValue === 2) { // Profesores
      specificColumns = [
        {
          field: 'facultad_nombre',
          headerName: 'Facultad',
          width: 180,
          valueGetter: (value, row) => {
            const facultad = facultades.find(f => f.id === row.facultad);
            return facultad?.nombre || '-';
          }
        },
      ];
    } else if (tabValue === 3) { // Coordinadores
      specificColumns = [
        {
          field: 'facultad_nombre',
          headerName: 'Facultad',
          width: 180,
          valueGetter: (value, row) => {
            const facultad = facultades.find(f => f.id === row.facultad || f.coordinador === row.id);
            return facultad?.nombre || '-';
          }
        },
      ];
    } else if (tabValue === 4) { // Decanos/Rectores
      specificColumns = [
        {
          field: 'facultad_nombre',
          headerName: 'Facultad',
          width: 180,
          valueGetter: (value, row) => {
            const facultad = facultades.find(f => f.id === row.facultad);
            return facultad?.nombre || '-';
          }
        },
      ];
    }
    
    const actionColumns = [
      {
        field: 'acciones',
        headerName: 'Acciones',
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const puedeEditar = tieneAlgunRol(['super_admin']) || 
                             (tieneAlgunRol(['admin']) && params.row.rol !== 'admin' && params.row.rol !== 'super_admin');
          const puedeEliminar = tieneAlgunRol(['super_admin']) || 
                               (tieneAlgunRol(['admin']) && params.row.rol !== 'admin' && params.row.rol !== 'super_admin');
          
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
    
    return [...baseColumns, ...commonColumns, ...specificColumns, ...actionColumns];
  }, [tabValue, facultades, carreras, tieneAlgunRol, abrirEditar, abrirVer, eliminarUsuario]);

  if (!tienePermisos) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">No tienes permisos para acceder a esta sección. Solo decanos.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>Usuarios</Typography>
          {message.text && <Alert severity={message.type}>{message.text}</Alert>}
        </Box>

        <Paper variant="outlined" sx={{ p: 1 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="Filtrar usuarios por rol">
            <Tab label="Sin Rol Asignado" />
            <Tab label="Estudiantes" />
            <Tab label="Profesores" />
            <Tab label="Coordinadores" />
            <Tab label="Decanos/Rectores" />
          </Tabs>
        </Paper>

        <Paper variant="outlined" sx={{ height: 600, width: '100%' }}>
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
      </Stack>

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
          {/* Campo número de documento solo editable por roles elevados */}
          {tieneAlgunRol(['super_admin', 'admin', 'coordinador']) && (
            <TextField
              label="Número de documento"
              fullWidth
              value={editForm.numero_documento || ''}
              onChange={(e) => setEditForm({ ...editForm, numero_documento: e.target.value })}
              sx={{ mb: 2 }}
              helperText={!editForm.numero_documento ? 'Documento de identidad. Asignar si falta.' : 'Documento de identidad'}
            />
          )}
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Roles asignados</Typography>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {editForm.roles?.map(rol => (
              <Chip
                key={rol}
                label={rol.charAt(0).toUpperCase() + rol.slice(1)}
                onDelete={() => setEditForm({ 
                  ...editForm, 
                  roles: editForm.roles.filter(r => r !== rol) 
                })}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Agregar rol</InputLabel>
            <Select
              label="Agregar rol"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value && !editForm.roles?.includes(e.target.value)) {
                  setEditForm({ 
                    ...editForm, 
                    roles: [...(editForm.roles || []), e.target.value]
                  });
                }
                e.target.value = '';
              }}
            >
              <MenuItem value="">-- Seleccionar rol --</MenuItem>
              <MenuItem value="profesor">Profesor</MenuItem>
              <MenuItem value="coordinador">Coordinador</MenuItem>
              <MenuItem value="estudiante">Estudiante</MenuItem>
              <MenuItem value="admin">Decano</MenuItem>
              <MenuItem value="super_admin">Rector</MenuItem>
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
          
          {/* Campo de Facultad para Estudiante */}
          {editForm.roles?.includes('estudiante') && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Facultad</InputLabel>
              <Select
                label="Facultad"
                value={editForm.facultad || ''}
                onChange={(e) => {
                  setEditForm({ 
                    ...editForm, 
                    facultad: e.target.value,
                    carrera: '' // Limpiar carrera cuando cambia facultad
                  });
                }}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {facultades.map(fac => (
                  <MenuItem key={fac.id} value={fac.id}>{fac.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Campo de Carrera para Estudiante (filtrado por facultad) */}
          {editForm.roles?.includes('estudiante') && editForm.facultad && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Carrera</InputLabel>
              <Select
                label="Carrera"
                value={editForm.carrera || ''}
                onChange={(e) => setEditForm({ ...editForm, carrera: e.target.value })}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {carreras
                  .filter(car => car.facultad === editForm.facultad)
                  .map(car => (
                    <MenuItem key={car.id} value={car.id}>
                      {car.codigo} - {car.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
          
          {/* Campo de Facultad para Coordinador/Profesor */}
          {(editForm.roles?.includes('coordinador') || editForm.roles?.includes('profesor')) && 
           !editForm.roles?.includes('estudiante') && (
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
          
          {/* Campo de Facultad para Admin/Decano */}
          {editForm.roles?.includes('admin') && 
           !editForm.roles?.includes('estudiante') && 
           !editForm.roles?.includes('coordinador') && 
           !editForm.roles?.includes('profesor') && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Facultad (Decano)</InputLabel>
              <Select
                label="Facultad (Decano)"
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
          
          {/* Información de Facultad para Coordinador (solo lectura) */}
          {editForm.roles?.includes('coordinador') && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Facultad asignada como Coordinador
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {editForm.facultad_coordinador_nombre || 'No asignado a ninguna facultad'}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                La asignación de coordinador se gestiona desde la página de Facultades
              </Typography>
            </Box>
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
    </Container>
  );
}
