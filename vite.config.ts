import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version?: string };

const appVersion = packageJson.version ?? '1.0.0';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Work around occasional esbuild sourcemap parsing failures under Node 24.
    // Keeping lucide-react out of prebundle avoids dev server crash.
    exclude: ['lucide-react'],
  },
  server: {
    port: 5177,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
          'vendor-zod': ['zod'],
          'vendor-crypto': ['crypto-js'],
        },
      },
    },
  },
});
