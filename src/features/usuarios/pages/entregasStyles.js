import { alpha } from '@mui/material/styles';

export const entregasStyles = {
  root: {
    background: (theme) => alpha(theme.palette.common.black, 0.25),
    borderRadius: 16,
    border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.10)}`,
    boxShadow: 'none',
    padding: 24,
    marginBottom: 32,
  },
  acordeon: {
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: 'none',
    background: (theme) => alpha(theme.palette.common.black, 0.25),
    border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.10)}`,
    '&:before': {
      display: 'none',
    },
  },
  tableHead: {
    background: (theme) => alpha(theme.palette.common.white, 0.06),
  },
  tableRow: {
    '&:hover': {
      background: (theme) => alpha(theme.palette.primary.main, 0.10),
    },
  },
  chipEntregado: {
    background: (theme) => alpha(theme.palette.success.main, 0.18),
    color: (theme) => theme.palette.success.main,
    fontWeight: 600,
  },
  chipPendiente: {
    background: (theme) => alpha(theme.palette.warning.main, 0.18),
    color: (theme) => theme.palette.warning.main,
    fontWeight: 600,
  },
  acciones: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  estudiante: {
    fontWeight: 500,
    color: (theme) => theme.palette.primary.main,
  },
};
