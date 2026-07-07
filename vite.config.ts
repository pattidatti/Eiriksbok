import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { visualizer } from 'rollup-plugin-visualizer';

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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          ui: ['lucide-react', '@heroicons/react'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          rapier: ['@dimforge/rapier3d-compat'],
          firebase: ['firebase/app', 'firebase/database', 'firebase/auth'],
          charts: ['chart.js', 'react-chartjs-2'],
          d3: ['d3-geo', 'd3-scale', 'topojson-client'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
}));
