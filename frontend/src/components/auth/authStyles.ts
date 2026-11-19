// Shared visual styles for the Login and Signup pages (simple orange theme).

export const ACCENT = '#FF6A2B';

const orangeGradient = 'linear-gradient(135deg, #FFB347 0%, #FF7A2F 50%, #FF4E50 100%)';

export const pageSx = {
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: { xs: 2, md: 4 },
  overflow: 'hidden',
  background: orangeGradient,
  // Soft static decorative circles
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    pointerEvents: 'none',
  },
  '&::before': { width: 520, height: 520, top: -180, left: -160 },
  '&::after': { width: 420, height: 420, bottom: -160, right: -120 },
} as const;

export const glassCardSx = {
  position: 'relative',
  overflow: 'hidden',
  bgcolor: 'transparent',
} as const;

export const formPanelSx = {
  position: 'relative',
  p: { xs: 3, sm: 5, md: 0 },
  display: 'flex',
  flexDirection: 'column',
} as const;

export const logoBadgeSx = {
  width: 56,
  height: 56,
  mx: 'auto',
  mb: 2,
  borderRadius: 3,
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  bgcolor: 'rgba(255,255,255,0.22)',
  border: '1px solid rgba(255,255,255,0.45)',
  boxShadow: '0 10px 24px -10px rgba(120,30,0,0.5)',
} as const;

export const gradientTextSx = {
  color: '#FFF1C9',
} as const;

export const labelSx = {
  mb: 1,
  fontWeight: 600,
  color: '#fff',
} as const;

export const iconSx = { color: '#A39A95' } as const;

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    bgcolor: '#fff',
    transition: 'box-shadow .2s',
    boxShadow: '0 6px 18px -10px rgba(120,30,0,0.45)',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.9)' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(255,255,255,0.35)' },
    '&.Mui-focused fieldset': { borderColor: '#fff', borderWidth: 1.5 },
    '&.Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root': { color: ACCENT },
  },
} as const;

export const checkboxSx = {
  color: 'rgba(255,255,255,0.85)',
  '&.Mui-checked': { color: '#fff' },
} as const;

export const primaryButtonSx = {
  py: 1.5,
  borderRadius: 3,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: 16,
  color: ACCENT,
  bgcolor: '#fff',
  boxShadow: '0 12px 28px -10px rgba(120,30,0,0.55)',
  transition: 'transform .2s ease, box-shadow .2s ease',
  '&:hover': {
    bgcolor: '#FFF4EC',
    transform: 'translateY(-1px)',
    boxShadow: '0 16px 32px -10px rgba(120,30,0,0.65)',
  },
  '&.Mui-disabled': { color: ACCENT, bgcolor: 'rgba(255,255,255,0.75)' },
} as const;

export const linkSx = {
  color: '#fff',
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  '&:hover': { color: '#FFF1C9' },
} as const;

export const alertSx = {
  mb: 2,
  borderRadius: 3,
} as const;

export const dividerLeftSx = {
  flex: 1,
  height: '1px',
  bgcolor: 'rgba(255,255,255,0.45)',
} as const;

export const dividerRightSx = dividerLeftSx;
