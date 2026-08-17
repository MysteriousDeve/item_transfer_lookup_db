import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { createTheme, CSSVariablesResolver, MantineProvider } from '@mantine/core';
import { mantineTheme } from './theme/theme'
import { ApiCacheProvider } from './context/ApiCacheContext.js';

const cssVarResolver: CSSVariablesResolver = () => ({
    variables: {
      //  variables that do not depend on color scheme
    },
    light: {
      // variables for light color scheme only
    },
    dark: {
      // variables for dark color scheme only
    },
  });

createRoot(document.getElementById('root') as HTMLElement).render(
  <MantineProvider theme={mantineTheme} defaultColorScheme="dark" cssVariablesResolver={cssVarResolver}>
    <ApiCacheProvider>
      <App />
    </ApiCacheProvider>
  </MantineProvider>
);
