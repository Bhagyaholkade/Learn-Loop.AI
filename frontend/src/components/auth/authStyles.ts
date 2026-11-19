import type { SxProps, Theme } from '@mui/material';

// Shared styles for the auth pages (glass card on a purple gradient).

export const pageSx: SxProps<Theme> = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  py: { xs: 4, md: 6 },
  px: { xs: 2, md: 4 },
  background:
    'linear-gradient(145deg, #4A38D9 0%, #5B49ED 45%, #8A72F5 100%)',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.45,
    pointerEvents: 'none',
  },
  '&::before': {
    width: 420,
    height: 420,
    top: -120,
    left: -120,
    background: '#B59CFF',
  },
  '&::after': {
    width: 380,
    height: 380,
    bottom: -140,
    right: -100,
    background: '#FFC98A',
  },
};

export const glassCardSx: SxProps<Theme> = {
  borderRadius: 4,
  bgcolor: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow: '0 24px 60px rgba(25, 12, 90, 0.35)',
  color: '#fff',
};

export const formPanelSx: SxProps<Theme> = {
  p: { xs: 3, sm: 4.5 },
  display: 'flex',
  flexDirection: 'column',
};

export const logoBadgeSx = {
  width: 56,
  height: 56,
  mx: 'auto',
  mb: 2,
  borderRadius: 3,
  placeItems: 'center',
  color: '#fff',
  bgcolor: 'rgba(255,255,255,0.18)',
  border: '1px solid rgba(255,255,255,0.3)',
};

export const gradientTextSx: SxProps<Theme> = {
  background: 'linear-gradient(90deg, #FFE7A8 0%, #FFC98A 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

export const labelSx: SxProps<Theme> = {
  mb: 1,
  fontWeight: 700,
  color: '#fff',
};

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fff',
  },
  '& .MuiOutlinedInput-root.Mui-disabled': {
    bgcolor: 'rgba(255,255,255,0.75)',
  },
};

export const iconSx: SxProps<Theme> = {
  color: '#8585A1',
};

export const alertSx = {
  mb: 2,
  borderRadius: 2.5,
};

export const checkboxSx: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.85)',
  '&.Mui-checked': { color: '#FFE7A8' },
};

export const primaryButtonSx = {
  py: 1.4,
  borderRadius: 2.5,
  fontWeight: 800,
  textTransform: 'none',
  fontSize: 16,
  color: '#3A2BB8',
  bgcolor: '#fff',
  boxShadow: '0 10px 24px rgba(20, 10, 80, 0.25)',
  '&:hover': { bgcolor: '#F1EEFF' },
  '&.Mui-disabled': {
    color: 'rgba(58,43,184,0.55)',
    bgcolor: 'rgba(255,255,255,0.6)',
  },
};

export const linkSx: SxProps<Theme> = {
  color: '#FFE7A8',
  fontWeight: 700,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
};
