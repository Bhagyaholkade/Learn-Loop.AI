import { createTheme, type ThemeOptions } from '@mui/material';

// ==========================================
// LearnLoop AI — shared orange theme
// ==========================================

export const BRAND = {
  orange: '#F26A21',
  orangeDark: '#D9561A',
  orangeLight: '#FFF1E8',
  orangeSoft: '#FFE3D1',
  charcoal: '#2A211C',
  border: '#ECE8E4',
  bg: '#F7F6F4',
  surfaceAlt: '#FAF8F6',
  gradient: 'linear-gradient(135deg, #FFB347 0%, #FF7A2F 50%, #FF4E50 100%)',
};

export const appThemeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: BRAND.orange,
      dark: BRAND.orangeDark,
      light: BRAND.orangeLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: BRAND.charcoal,
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#2B201B',
      secondary: '#7A6E68',
    },
    background: {
      default: BRAND.bg,
      paper: '#FFFFFF',
    },
    divider: BRAND.border,
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: BRAND.bg },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: '10px', paddingInline: 18 },
        containedPrimary: {
          boxShadow: '0 6px 16px -8px rgba(242,106,33,0.7)',
          '&:hover': {
            backgroundColor: BRAND.orangeDark,
            boxShadow: '0 8px 20px -8px rgba(242,106,33,0.8)',
          },
        },
        outlined: {
          borderColor: '#E4DAD2',
          backgroundColor: '#FFFFFF',
          '&:hover': { backgroundColor: BRAND.orangeLight },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: '10px' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          borderColor: BRAND.border,
          boxShadow:
            '0 1px 2px rgba(30,20,10,0.04), 0 8px 24px -16px rgba(30,20,10,0.18)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E4DAD2' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#F7B48A' },
          '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(242,106,33,0.12)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: '8px' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#5C504A',
          backgroundColor: BRAND.surfaceAlt,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, backgroundColor: BRAND.orangeSoft },
        bar: { borderRadius: 999 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: '16px' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '12px' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
};

const appTheme = createTheme(appThemeOptions);

export default appTheme;
