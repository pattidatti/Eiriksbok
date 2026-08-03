import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Alle fonter selvhostes via Fontsource. Tidligere lå Inter/Outfit bak en
// render-blokkerende <link> til fonts.googleapis.com i index.html: to ekstra
// DNS+TLS-oppslag før første maling, som på skolenett ofte var det tregeste
// enkeltelementet på siden. Nå leveres woff2-ene fra samme origin som appen.
// `latin`-subsettet dekker norsk (æ, ø, å ligger i Latin-1).
// Én @font-face-regel per vekt koster ingenting i seg selv - nettleseren laster
// kun ned filen for en vekt som faktisk brukes av tekst på siden.
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/outfit/latin-300.css';
import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/outfit/latin-900.css';
// OpenDyslexic selvhostes via Fontsource. Nettleseren laster først ned woff2-en
// når dysleksimodus faktisk er på og tekst matcher @font-face, så dette koster
// ingenting for elever som ikke bruker modusen.
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import './index.css';
import App from './App.tsx';
import { fetchRegistry, fetchManifest } from './utils/contentLoader';

// Boot-prefetch: varm opp modulcachen i contentLoader mens appen laster,
// slik at første navigasjon ikke venter på manifest + content-index (~550 KB).
fetchRegistry().catch(() => {});
fetchManifest().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Content is static for the session
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Critical Error: Root element not found.</div>';
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>,
    );
  } catch (e) {
    console.error("Failed to render app:", e);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">
      <h1>Critical Startup Error</h1>
      <pre>${e instanceof Error ? e.message : String(e)}</pre>
      <pre>${e instanceof Error ? e.stack : ''}</pre>
    </div>`;
  }
}
