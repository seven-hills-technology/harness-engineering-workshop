/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Read at config-load time (Node). Typed loosely so the web workspace doesn't
// need a hard dependency on @types/node just for this one flag.
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 9010,
    // In the Docker fallback, poll the filesystem so HMR sees edits across a
    // Windows bind mount (where inotify events don't reach the container).
    watch: env.VITE_USE_POLLING ? { usePolling: true } : undefined,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
