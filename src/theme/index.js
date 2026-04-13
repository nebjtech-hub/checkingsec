import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main:  '#1B4F72',
      light: '#2980B9',
      dark:  '#154360',
    },
    secondary: {
      main: '#148F77',
    },
    background: {
      default: '#F0F4F8',
      paper:   '#FFFFFF',
    },
    error:   { main: '#C0392B' },
    warning: { main: '#D68910' },
    success: { main: '#1E8449' },
    text: {
      primary:   '#1C2833',
      secondary: '#5D6D7E',
    },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"DM Serif Display", serif' },
    h2: { fontFamily: '"DM Serif Display", serif' },
    h3: { fontFamily: '"DM Serif Display", serif' },
    h4: { fontFamily: '"DM Serif Display", serif', fontWeight: 400 },
    h5: { fontFamily: '"DM Serif Display", serif', fontWeight: 400 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '10px 24px' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1B4F72 0%, #2980B9 100%)',
          boxShadow: '0 4px 15px rgba(27,79,114,0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(27,79,114,0.4)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': { borderColor: '#2980B9' },
            '&.Mui-focused fieldset': { borderColor: '#1B4F72', borderWidth: 2 },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
})

export default theme
