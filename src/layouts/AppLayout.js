import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItemIcon, ListItemText, Divider, Box, TextField, ListItemButton, Container, IconButton, Menu, MenuItem, Tooltip, Avatar, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import BookIcon from '@mui/icons-material/Book';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/AuthContext';
import { useSearch } from '../shared/context/SearchContext';

const DRAWER_WIDTH = 250;
const DRAWER_WIDTH_COLLAPSED = 72;

export default function AppLayout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();

  const isDashboard = location.pathname === '/dashboard';
  const usePermanentDrawer = isDesktop && !isDashboard;

  const speechRecognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const userMenuOpen = Boolean(userMenuAnchorEl);

  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const notificationsOpen = Boolean(notificationsAnchorEl);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  const [logoOk, setLogoOk] = useState(true);

  const logoSrc = '/logo.png';

  const fileInputRef = useRef(null);
  const [avatarSrc, setAvatarSrc] = useState('');

  // Función helper para verificar si el usuario tiene alguno de los roles
  const tieneAlgunRol = useCallback((rolesRequeridos) => {
    if (!user) return false;
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(r => rolesRequeridos.includes(r));
    }
    return rolesRequeridos.includes(user.rol);
  }, [user]);

  const menuItems = [
    { label: 'Inicio', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Mi Perfil', icon: <PersonIcon />, path: '/perfil' },
  ];
  if (tieneAlgunRol(['admin', 'super_admin'])) {
    menuItems.push({ label: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' });
  }

  // Roles y Permisos solo para super_admin
  if (tieneAlgunRol(['super_admin'])) {
    menuItems.push({ label: 'Roles y Permisos', icon: <SecurityIcon />, path: '/roles-permisos' });
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

  // Periodos Académicos para super_admin, admin y coordinador
  if (tieneAlgunRol(['super_admin', 'admin', 'coordinador'])) {
    menuItems.push({ label: 'Periodos Académicos', icon: <CalendarMonthIcon />, path: '/admin/periodos' });
  }


  // Tareas para profesor, docente, coordinador, admin y super_admin
  if (tieneAlgunRol(['profesor', 'docente', 'coordinador', 'admin', 'super_admin'])) {
    menuItems.push({ label: 'Gestión de Tareas', icon: <AssignmentIcon />, path: '/mis-tareas' });
    // Entregas de Estudiantes para profesor, admin, coordinador y super_admin
    menuItems.push({ label: 'Entregas de Estudiantes', icon: <AssignmentIcon />, path: '/profesor/entregas' });
  }

  // Matrícula y Mis Asignaturas solo para estudiantes
  if (tieneAlgunRol(['estudiante'])) {
    menuItems.push({ label: 'Matricular Asignaturas', icon: <BookIcon />, path: '/matricula' });
    menuItems.push({ label: 'Mis Asignaturas', icon: <SchoolIcon />, path: '/mis-asignaturas' });
    menuItems.push({ label: 'Mis Tareas', icon: <AssignmentIcon />, path: '/mis-tareas' });
    menuItems.push({ label: 'Mis Calificaciones', icon: <AssignmentIcon />, path: '/mis-calificaciones' });
  }

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileDrawer = () => setMobileDrawerOpen((prev) => !prev);
  const toggleDrawerCollapsed = () => setDrawerCollapsed((prev) => !prev);

  const onToggleMenu = () => {
    if (usePermanentDrawer) {
      toggleDrawerCollapsed();
    } else {
      toggleMobileDrawer();
    }
  };

  useEffect(() => {
    // El buscador es por-vista: se limpia al cambiar de ruta
    setSearchTerm('');
  }, [location.pathname, setSearchTerm]);

  useEffect(() => {
    // Importante para desarrollo: si antes falló el logo y React preserva estado,
    // forzamos un nuevo intento de carga.
    setLogoOk(true);
  }, [logoSrc]);

  useEffect(() => {
    // Dictado de voz para llenar el buscador (Web Speech API)
    // Nota: Disponible en algunos navegadores (Chrome/Edge) y requiere HTTPS o localhost.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcript = results
        .map((r) => (r?.[0]?.transcript || '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();

      if (transcript) {
        setSearchTerm(transcript);
      }

      const last = event.results?.[event.results.length - 1];
      if (last?.isFinal) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;

    return () => {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    };
  }, [setSearchTerm]);

  const onVoiceSearch = () => {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.stop();
      } finally {
        setIsListening(false);
      }
      return;
    }

    try {
      setSearchTerm('');
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSearchChange = (e) => {
    const valor = e.target.value;
    setSearchTerm(valor);
  };

  const searchPlaceholder = useMemo(() => {
    const path = location.pathname;
    if (path === '/usuarios') return 'Buscar usuario...';
    if (path === '/academico/asignaturas') return 'Buscar asignatura...';
    if (path === '/academico/carreras') return 'Buscar carrera...';
    if (path === '/academico/facultades') return 'Buscar facultad...';
    if (path === '/academico/tareas') return 'Buscar tarea...';
    if (path === '/academico/entregas') return 'Buscar tarea...';
    if (path === '/admin/periodos') return 'Buscar período...';
    if (path === '/matricula') return 'Buscar asignatura...';
    if (path === '/mis-asignaturas') return 'Buscar asignatura...';
    if (path === '/roles-permisos') return 'Buscar permiso...';
    return 'Buscar...';
  }, [location.pathname]);

  const openUserMenu = (e) => setUserMenuAnchorEl(e.currentTarget);
  const closeUserMenu = () => setUserMenuAnchorEl(null);

  const openNotificationsMenu = (e) => setNotificationsAnchorEl(e.currentTarget);
  const closeNotificationsMenu = () => setNotificationsAnchorEl(null);

  const initials = useMemo(() => {
    const first = (user?.first_name || '').trim();
    const last = (user?.last_name || '').trim();
    const a = first ? first[0] : '';
    const b = last ? last[0] : '';
    return (a + b).toUpperCase() || 'U';
  }, [user?.first_name, user?.last_name]);

  const avatarStorageKey = useMemo(() => {
    const id = user?.id || 'me';
    return `colegio_avatar_${id}`;
  }, [user?.id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(avatarStorageKey);
      setAvatarSrc(stored || '');
    } catch {
      setAvatarSrc('');
    }
  }, [avatarStorageKey]);

  const onPickAvatar = () => {
    fileInputRef.current?.click();
  };

  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) return;

    // Guardamos en localStorage como dataURL (simple y sin tocar backend por ahora)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      try {
        localStorage.setItem(avatarStorageKey, dataUrl);
      } catch {
        // ignore
      }
      setAvatarSrc(dataUrl);
    };
    reader.readAsDataURL(file);

    // Permitir re-subir el mismo archivo
    e.target.value = '';
  };

  const onRemoveAvatar = () => {
    try {
      localStorage.removeItem(avatarStorageKey);
    } catch {
      // ignore
    }
    setAvatarSrc('');
  };

  const drawerWidth = usePermanentDrawer ? (drawerCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH) : DRAWER_WIDTH;

  return (
    <Box display="flex">
      <AppBar position="fixed" sx={{ zIndex: 1301 }} elevation={1}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
          <Toolbar disableGutters sx={{ display: 'flex', gap: 2, alignItems: 'center', minHeight: 64 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 0 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={onToggleMenu}
                aria-label={usePermanentDrawer ? 'Plegar/Desplegar menú' : 'Abrir menú'}
              >
                <MenuIcon />
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => navigate('/dashboard')}
              >
                {logoOk ? (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt="Colegio"
                    onError={() => setLogoOk(false)}
                    sx={{
                      height: { xs: 40, sm: 46, md: 52 },
                      maxWidth: { xs: 150, sm: 180, md: 220 },
                      width: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <>
                    <SchoolIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
                    <Typography variant="h6" sx={{ whiteSpace: 'nowrap' }}>
                      Colegio
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {/* Buscador global (por-vista) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexGrow: 1,
                maxWidth: 680,
                mx: 'auto',
                backgroundColor: (t) => alpha(t.palette.common.black, 0.25),
                border: (t) => `1px solid ${alpha(t.palette.common.white, 0.18)}`,
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <TextField
                placeholder={searchPlaceholder}
                variant="standard"
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                      <SearchIcon sx={{ color: 'rgba(255,255,255,0.75)' }} />
                    </Box>
                  ),
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }}>
                      {searchTerm ? (
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
                          sx={{ color: 'rgba(255,255,255,0.85)' }}
                          aria-label="Limpiar búsqueda"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Box>
                  ),
                }}
                sx={{
                  '& input': {
                    color: 'white',
                    fontSize: 14,
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.8)',
                      opacity: 1,
                    },
                  },
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', height: 48 }}>
                <Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.16) }} />
                <Tooltip title="Buscar">
                  <IconButton
                    color="inherit"
                    aria-label="Buscar"
                    onClick={() => {
                      // El filtrado es en vivo; este botón es intencionalmente no-op
                      // para mantener comportamiento consistente.
                    }}
                    sx={{ px: 2, borderRadius: 0 }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Tooltip title="Búsqueda por voz">
              <IconButton
                color="inherit"
                aria-label="Búsqueda por voz"
                onClick={onVoiceSearch}
                sx={{
                  backgroundColor: (t) => alpha(t.palette.common.black, 0.25),
                  border: (t) => `1px solid ${alpha(t.palette.common.white, 0.12)}`,
                  '&:hover': { backgroundColor: (t) => alpha(t.palette.common.black, 0.35) },
                }}
              >
                <MicIcon sx={{ color: isListening ? 'rgba(255,255,255,1)' : 'inherit' }} />
              </IconButton>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Notificaciones">
                <IconButton color="inherit" onClick={openNotificationsMenu} aria-label="Notificaciones">
                  <NotificationsNoneIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={notificationsAnchorEl}
                open={notificationsOpen}
                onClose={closeNotificationsMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={() => {
                    closeNotificationsMenu();
                    const email = (user?.email || '').trim();
                    if (!email) return;
                    window.location.href = `mailto:${email}`;
                  }}
                  disabled={!user?.email}
                >
                  Abrir correo ({user?.email || 'sin correo'})
                </MenuItem>
              </Menu>
            </Box>

            <Tooltip title="Cuenta">
              <IconButton onClick={openUserMenu} sx={{ ml: 1 }}>
                <Avatar
                  src={avatarSrc || undefined}
                  imgProps={{ referrerPolicy: 'no-referrer' }}
                  sx={{ width: 32, height: 32, bgcolor: (theme) => alpha(theme.palette.common.white, 0.2), color: 'white' }}
                >
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenuAnchorEl}
              open={userMenuOpen}
              onClose={closeUserMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  closeUserMenu();
                  navigate('/perfil');
                }}
              >
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Mi Perfil</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeUserMenu();
                  onPickAvatar();
                }}
              >
                <ListItemText>Cambiar foto</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeUserMenu();
                  onRemoveAvatar();
                }}
                disabled={!avatarSrc}
              >
                <ListItemText>Quitar foto</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeUserMenu();
                  onLogout();
                }}
              >
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Salir</ListItemText>
              </MenuItem>
            </Menu>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onAvatarFileChange}
              style={{ display: 'none' }}
            />
          </Toolbar>
        </Container>
      </AppBar>
      {/* Drawer permanente en desktop, temporal en móvil */}
      {usePermanentDrawer ? (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRightColor: 'divider',
            },
          }}
        >
          <Toolbar />
          <List>
            {menuItems.map((item) => {
              const button = (
                <ListItemButton
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    justifyContent: drawerCollapsed ? 'center' : 'flex-start',
                    '&.Mui-selected': {
                      backgroundColor: (theme) => theme.palette.action.selected,
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: (theme) => theme.palette.action.selected,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: drawerCollapsed ? 'auto' : 56, justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!drawerCollapsed && <ListItemText primary={item.label} />}
                </ListItemButton>
              );

              if (!drawerCollapsed) return button;
              return (
                <Tooltip key={item.path} title={item.label} placement="right">
                  {button}
                </Tooltip>
              );
            })}
          </List>
          <Divider />
          <List>
            <ListItemButton
              onClick={onLogout}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
                justifyContent: drawerCollapsed ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon sx={{ minWidth: drawerCollapsed ? 'auto' : 56, justifyContent: 'center' }}><LogoutIcon /></ListItemIcon>
              {!drawerCollapsed && <ListItemText primary="Salir" />}
            </ListItemButton>
          </List>
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={toggleMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <List>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <List>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                onLogout();
              }}
              sx={{ mx: 1, my: 0.5, borderRadius: 2 }}
            >
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Salir" />
            </ListItemButton>
          </List>
        </Drawer>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, marginTop: '64px' }}>
        {children}
      </Box>
    </Box>
  );
}