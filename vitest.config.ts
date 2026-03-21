/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        global: {
          statements: 35,
          branches: 50,
          functions: 45,
          lines: 35,
        },
      },
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'android/',
        'api/',
        'public/',
        'src/tests/',
        'src/**/*.d.ts',
      ],
    },
  },
});
