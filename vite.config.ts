import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {seoPlugin} from './vite.seo';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), seoPlugin()],
    build: {
      sourcemap: true,
      rollupOptions: {
        // Two real HTML documents: the editor and the static, crawlable About page
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          about: resolve(import.meta.dirname, 'acerca-de/index.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
