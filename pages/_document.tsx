import { Html, Head, Main, NextScript } from 'next/document'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Main />
        </ThemeProvider>
        <NextScript />
      </body>
    </Html>
  )
}
