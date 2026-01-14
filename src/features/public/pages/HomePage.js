import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '../../../hooks/AuthContext';

export default function HomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const primaryCtaLabel = user ? 'Ir al dashboard' : 'Iniciar sesión';
  const primaryCtaHref = user ? '/dashboard' : '/login';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: alpha(theme.palette.common.black, 0.75),
        py: { xs: 2.5, md: 3 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, md: 2 },
        }}
      >
        {/* Arriba (todo lo demás) */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ maxWidth: 720, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                color: 'common.white',
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              Sistema Académico
            </Typography>
            <Typography sx={{ color: alpha(theme.palette.common.white, 0.9), mt: 1 }}>
              Accede a tus asignaturas, tareas, entregas y calificaciones desde un solo lugar.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(primaryCtaHref)}
                sx={{
                  px: 4,
                  py: 1.25,
                  color: 'common.white',
                  borderColor: alpha(theme.palette.common.white, 0.28),
                  backgroundColor: alpha(theme.palette.common.white, 0.08),
                  '&:hover': {
                    borderColor: alpha(theme.palette.common.white, 0.4),
                    backgroundColor: alpha(theme.palette.common.white, 0.14),
                  },
                }}
              >
                {primaryCtaLabel}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Centro: escudo (sin nada encima) */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            component="img"
            src="/logo_Dashboard.png"
            alt="Escudo"
            sx={{
              width: '100%',
              maxWidth: { xs: 420, sm: 520, md: 620 },
              maxHeight: { xs: 280, sm: 340, md: 400 },
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>

        {/* Abajo: info (debajo del escudo) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%' }}>
          <Paper variant="outlined" sx={{ flex: 1, p: 2, backgroundColor: alpha(theme.palette.common.black, 0.35) }}>
            <Typography variant="h6" sx={{ color: 'common.white', mb: 0.5 }}>
              Estudiantes
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85) }}>
              Consulta tareas, entregas y calificaciones de tus asignaturas.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ flex: 1, p: 2, backgroundColor: alpha(theme.palette.common.black, 0.35) }}>
            <Typography variant="h6" sx={{ color: 'common.white', mb: 0.5 }}>
              Docentes
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85) }}>
              Publica tareas, revisa entregas y registra calificaciones.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ flex: 1, p: 2, backgroundColor: alpha(theme.palette.common.black, 0.35) }}>
            <Typography variant="h6" sx={{ color: 'common.white', mb: 0.5 }}>
              Administración
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85) }}>
              Gestiona usuarios, roles y la información académica.
            </Typography>
          </Paper>
        </Stack>

        <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.75), textAlign: 'center', pb: 1 }}>
          © {new Date().getFullYear()} Colegio
        </Typography>
      </Container>
    </Box>
  );
}
