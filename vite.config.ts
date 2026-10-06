import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        muster: resolve(import.meta.dirname, 'muster/index.html'),
        verpackung: resolve(import.meta.dirname, 'verpackung/index.html'),
      },
    },
  },
});
