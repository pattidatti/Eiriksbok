import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
