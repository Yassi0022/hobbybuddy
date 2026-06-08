import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const buildTimestamp = Date.now();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-build-version',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `<meta name="hb-build" content="${buildTimestamp}"/></head>`
        );
      },
      closeBundle() {
        const versionPath = path.resolve(__dirname, 'dist/version.json');
        fs.writeFileSync(versionPath, JSON.stringify({ build: buildTimestamp }));
      },
    },
  ],
  css: { transformer: 'postcss' },
  base: '/',
  build: {
    outDir: 'dist',
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
