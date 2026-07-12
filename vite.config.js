import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base './' matters later when we wrap this in Electron and load index.html
// from the filesystem instead of a dev server.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
});
