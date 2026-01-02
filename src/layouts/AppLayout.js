import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, TextField } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import { useSearch } from '../shared/context/SearchContext';

const DRAWER_WIDTH = 250;

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();

  const esPaginaConBuscador = ['/usuarios', '/academico/asignaturas', '/academico/carreras', '/academico/facultades'].includes(location.pathname);

  // Función helper para verificar si el usuario tiene alguno de los roles
  const tieneAlgunRol = (rolesRequeridos) => {
    if (!user) return false;
    // Verificar array de roles (múltiples roles)
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(r => rolesRequeridos.includes(r));
    }
    // Fallback al campo rol legacy (por compatibilidad)
    return rolesRequeridos.includes(user.rol);
  };

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Mi Perfil', icon: <PersonIcon />, path: '/perfil' },
  ];

  // Solo mostrar Usuarios si es admin o super_admin
  if (tieneAlgunRol(['admin', 'super_admin'])) {
    menuItems.push({ label: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' });
  }

  // Asignaturas para admin, super_admin y coordinador
  if (tieneAlgunRol(['admin', 'super_admin', 'coordinador'])) {
    menuItems.push({ label: 'Asignaturas', icon: <BookIcon />, path: '/academico/asignaturas' });
  }

  // Facultades solo para admin y super_admin
  if (tieneAlgunRol(['admin', 'super_admin'])) {
    menuItems.push({ label: 'Facultades', icon: <BusinessIcon />, path: '/academico/facultades' });
  }

  // Carreras para admin, super_admin y coordinador
  if (tieneAlgunRol(['admin', 'super_admin', 'coordinador'])) {
    menuItems.push({ label: 'Carreras', icon: <SchoolIcon />, path: '/academico/carreras' });
  }

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    const valor = e.target.value;
    setSearchTerm(valor);
  };

  return (
    <Box display="flex">
      <AppBar position="fixed" sx={{ zIndex: 1301 }}>
        <Toolbar sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ flexGrow: 0 }}>
            Colegio Django
          </Typography>
          
          {/* Barra de búsqueda - en Usuarios y Asignaturas */}
          {esPaginaConBuscador && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1, 
              maxWidth: 400,
              mx: 'auto',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 1,
              pl: 1.5
            }}>
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />
              <TextField
                placeholder={
                  location.pathname === '/usuarios' ? 'Buscar usuario...' :
                  location.pathname === '/academico/asignaturas' ? 'Buscar asignatura...' :
                  location.pathname === '/academico/carreras' ? 'Buscar carrera...' :
                  location.pathname === '/academico/facultades' ? 'Buscar facultad...' : 'Buscar...'
                }
                variant="standard"
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& input': { 
                    color: 'white',
                    fontSize: 14,
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.7)',
                      opacity: 1,
                    }
                  },
                }}
              />
            </Box>
          )}
          
          <Typography variant="body2" sx={{ mr: 2, whiteSpace: 'nowrap' }}>
            {user?.first_name} {user?.last_name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem component="button" key={item.path} onClick={() => navigate(item.path)} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem component="button" onClick={onLogout} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Salir" />
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
        {children}
      </Box>
    </Box>
  );
}