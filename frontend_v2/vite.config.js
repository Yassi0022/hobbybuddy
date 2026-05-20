import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: { transformer: 'postcss' },
  base: '/',
  build: {
    outDir: path.resolve(__dirname, '../hobbybuddy-platform/src/main/resources/static'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/quiz': 'http://localhost:8080',
    },
  },
});
