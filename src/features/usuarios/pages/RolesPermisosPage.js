/**
 * RolesPermisosPage
 * 
 * PROPÓSITO: Gestión centralizada de permisos por rol (HU-05)
 * 
 * ACCESO: Solo super_admin
 * 
 * FUNCIONALIDADES:
 * 1. Seleccionar rol y ver permisos asignados
 * 2. Agregar/remover permisos del rol
 * 3. Guardar cambios con validación
 * 
 * JERARQUÍA DE ROLES (de mayor a menor privilegio):
 * - super_admin (5): Todos los permisos del sistema
 * - admin (4): Gestión de académico, usuarios, reportes
 * - coordinador (3): Gestión limitada de académico
 * - profesor (2): Ver asignaturas y estudiantes asignados
 * - estudiante (1): Ver notas y asignaturas inscritas
 * 
 * PERMISOS DISPONIBLES:
 * - academico: crear/actualizar/eliminar asignaturas, carreras, facultades
 * - usuarios: crear/actualizar/eliminar usuarios, gestionar roles
 * - reportes: generar reportes académicos
 * - notificaciones: enviar notificaciones, recibir notificaciones mensuales
 * 
 * VALIDACIONES:
 * - Solo super_admin accede a esta página
 * - Los cambios se aplican a TODOS los usuarios con ese rol
 * - Confirmación antes de guardar cambios críticos
 * 
 * INTEGRACIÓN BACKEND:
 * - endpoint: /api/roles/{id}/permisos/ (PUT)
 * - servicio: rolesService.actualizarPermisosRol()
 */

import React, { useEffect, useState } from 'react';
import { rolesService } from '../services/rolesService';
import { 
  Paper, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../../../hooks/AuthContext';

export default function RolesPermisosPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openConfirm, setOpenConfirm] = useState(false);
  const [permisosOriginales, setPermisosOriginales] = useState([]);

  // Verificar que sea super_admin
  const esSuperAdmin = user?.roles?.includes('super_admin') || user?.rol === 'super_admin';

  useEffect(() => {
    if (esSuperAdmin) {
      cargarDatos();
    }
  }, [esSuperAdmin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [rolesRes, permisosRes] = await Promise.all([
        rolesService.listarRoles(),
        rolesService.listarPermisos()
      ]);
      setRoles(rolesRes.data.results || rolesRes.data);
      setPermisos(permisosRes.data.results || permisosRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleRolChange = (event) => {
    const rolId = event.target.value;
    setRolSeleccionado(rolId);
    
    // Cargar permisos del rol seleccionado
    const rol = roles.find(r => r.id === rolId);
    if (rol) {
      const permisosIds = rol.permisos.map(p => p.id);
      setPermisosSeleccionados(permisosIds);
      setPermisosOriginales(permisosIds); // Guardar originales para comparar
    }
  };

  const handlePermisoToggle = (permisoId) => {
    setPermisosSeleccionados(prev => {
      if (prev.includes(permisoId)) {
        return prev.filter(id => id !== permisoId);
      } else {
        return [...prev, permisoId];
      }
    });
  };

  const handleGuardar = () => {
    // Mostrar diálogo de confirmación si hay cambios
    const cambios = permisosSeleccionados.length !== permisosOriginales.length ||
      permisosSeleccionados.some(p => !permisosOriginales.includes(p)) ||
      permisosOriginales.some(p => !permisosSeleccionados.includes(p));
    
    if (cambios) {
      setOpenConfirm(true);
    } else {
      setMessage({ type: 'info', text: 'No hay cambios para guardar' });
    }
  };

  const confirmarGuardar = async () => {
    setOpenConfirm(false);
    try {
      await rolesService.actualizarPermisosRol(rolSeleccionado, permisosSeleccionados);
      setMessage({ type: 'success', text: 'Permisos actualizados correctamente' });
      setPermisosOriginales(permisosSeleccionados); // Actualizar originales
      cargarDatos(); // Recargar datos
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error actualizando permisos:', error);
      setMessage({ type: 'error', text: 'Error al actualizar permisos' });
    }
  };

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = [];
    }
    acc[permiso.modulo].push(permiso);
    return acc;
  }, {});

  const modulosDisplay = {
    academico: '📚 Académico',
    usuarios: '👥 Usuarios',
    reportes: '📊 Reportes',
    notificaciones: '🔔 Notificaciones'
  };

  if (!esSuperAdmin) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Solo los super administradores pueden acceder a esta página.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Gestión de Roles y Permisos
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Seleccionar Rol</InputLabel>
          <Select
            value={rolSeleccionado}
            onChange={handleRolChange}
            label="Seleccionar Rol"
          >
            {roles.map((rol) => (
              <MenuItem key={rol.id} value={rol.id}>
                {rol.tipo_display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {rolSeleccionado && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Permisos Asignados ({permisosSeleccionados.length} de {permisos.length})
            </Typography>

            {Object.entries(permisosPorModulo).map(([modulo, permisosModulo]) => (
              <Card key={modulo} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {modulosDisplay[modulo] || modulo}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <FormGroup>
                    {permisosModulo.map((permiso) => (
                      <FormControlLabel
                        key={permiso.id}
                        control={
                          <Checkbox
                            checked={permisosSeleccionados.includes(permiso.id)}
                            onChange={() => handlePermisoToggle(permiso.id)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">{permiso.nombre}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {permiso.descripcion}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </CardContent>
              </Card>
            ))}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setRolSeleccionado('');
                  setPermisosSeleccionados([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGuardar}
              >
                Guardar Cambios
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Diálogo de confirmación */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirmar cambio de permisos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            ¿Está seguro de que desea actualizar los permisos de este rol?
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'orange' }}>
            ⚠️ Este cambio afectará a TODOS los usuarios asignados a este rol.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmarGuardar} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
