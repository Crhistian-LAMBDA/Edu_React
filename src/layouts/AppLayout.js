import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, TextField } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import { useSearch } from '../shared/context/SearchContext';

const DRAWER_WIDTH = 250;

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();

  const esPaginaUsuarios = location.pathname === '/usuarios';

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Mi Perfil', icon: <PersonIcon />, path: '/perfil' },
  ];

  // Solo mostrar Usuarios si es admin o super_admin
  if (user?.rol === 'admin' || user?.rol === 'super_admin') {
    menuItems.push({ label: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' });
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
          
          {/* Barra de búsqueda - solo en página de usuarios */}
          {esPaginaUsuarios && (
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
                placeholder="Buscar usuario..."
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
            <ListItem button key={item.path} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem button onClick={onLogout}>
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