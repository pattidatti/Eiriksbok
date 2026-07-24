import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { visualizer } from 'rollup-plugin-visualizer';

// Pakke -> vendor-chunk. Matches på eksakt pakkenavn (ikke prefiks), slik at
// f.eks. 'react' ikke sluker 'react-chartjs-2'.
const CHUNK_BY_PACKAGE: Record<string, string> = {
  react: 'vendor',
  'react-dom': 'vendor',
  'react-router': 'vendor',
  'react-router-dom': 'vendor',
  'framer-motion': 'vendor',
  scheduler: 'vendor',
  // Små, app-brede biblioteker. Uten eksplisitt plassering hoister Rollup dem
  // inn i en vilkårlig delt chunk - zustand havnet i 'three' og dro hele
  // Three.js inn i kritisk sti.
  // Kun pakker som allerede er eager (brukes fra Layout/App). canvas-confetti
  // og react-tooltip er bevisst utelatt: de brukes kun av lazy-lastede
  // komponenter, og skal bli liggende i sine egne chunks.
  zustand: 'vendor',
  clsx: 'vendor',
  'fuse.js': 'vendor',
  'lucide-react': 'ui',
  '@heroicons/react': 'ui',
  three: 'three',
  '@react-three/fiber': 'three',
  '@react-three/drei': 'three',
  '@dimforge/rapier3d-compat': 'rapier',
  firebase: 'firebase',
  'chart.js': 'charts',
  'react-chartjs-2': 'charts',
  'd3-geo': 'd3',
  'd3-scale': 'd3',
  'topojson-client': 'd3',
  '@dnd-kit/core': 'dnd',
  '@dnd-kit/sortable': 'dnd',
  '@dnd-kit/utilities': 'dnd',
  '@tanstack/react-query': 'query',
};

/** Trekker ut pakkenavnet ('@scope/navn' eller 'navn') fra en modul-id. */
function packageOf(id: string): string | null {
  const marker = 'node_modules/';
  const i = id.lastIndexOf(marker);
  if (i === -1) return null;
  const parts = id.slice(i + marker.length).split('/');
  return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    react(),
    visualizer({
      open: false, // Don't auto-open, we'll check the file manually
      gzipSize: true,
      brotliSize: true,
      filename: 'stats.html'
    })
  ],
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
  esbuild: {
    // Strip støyende logging fra prod-bundle (kun build); warn/error beholdes
    pure: command === 'build' ? ['console.log', 'console.count', 'console.debug'] : [],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Funksjonsform, ikke objektform. Med objektform havnet Vites
        // __vitePreload-hjelper inni 'three'-chunken, som dermed ble statisk
        // importert av entry og modulepreload-et på HVER sidevisning (~300 KB
        // gzip Three.js også på rene tekstartikler). Her tvinges hjelperen
        // eksplisitt inn i 'vendor'.
        manualChunks(id) {
          // Syntetiske, delte hjelpemoduler. Disse tilhører ingen pakke, så
          // Rollup plasserer dem vilkårlig - begge havnet i 'three' og gjorde
          // hele Three.js til en statisk avhengighet av entry.
          if (
            id.includes('vite/preload-helper') ||
            id.includes('vite/modulepreload-polyfill') ||
            id.includes('commonjsHelpers')
          ) {
            return 'vendor';
          }

          const pkg = packageOf(id);
          if (!pkg) return;

          // Firebase sine interne @firebase/*-pakker skal følge 'firebase'.
          if (pkg.startsWith('@firebase/')) return 'firebase';

          return CHUNK_BY_PACKAGE[pkg];
        },
      },
    },
  },
}));
