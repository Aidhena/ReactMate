import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: projectRoot,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL('./web-dist', import.meta.url)),
    emptyOutDir: true,
  },
});
