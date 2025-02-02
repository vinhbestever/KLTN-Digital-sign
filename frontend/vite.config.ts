import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'pdfjs-dist': path.resolve(
        __dirname,
        './node_modules/@react-pdf-viewer/pdfjs-dist-signature'
      ),
    },
  },
});
