import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22c55e',
    },
    background: {
      default: '#06070a',
      paper: '#0b0d12',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h5: {
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
