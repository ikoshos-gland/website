import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // In production, call the backend through the Static Web App's own
      // same-origin `/api` route (SWA linked backend). An empty base makes
      // fetch() hit `/api/...` on the SWA domain, which SWA proxies to the
      // linked Function App — so the Function App can be locked to SWA-only
      // traffic. Local dev still targets the local func host.
      'import.meta.env.VITE_RAG_API_URL': JSON.stringify(
        env.VITE_RAG_API_URL || (mode === 'production' ? '' : 'http://localhost:7071')
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-3d': ['@splinetool/react-spline', '@splinetool/runtime'],
          }
        }
      }
    }
  };
});
