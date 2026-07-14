import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './src/manifest.json',
      additionalInputs: [
        'src/content/index.ts',
      ],
      webExtConfig: {
        target: 'chrome-mv3',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Chunk ONNX model separately for caching
        manualChunks: (id) => {
          if (id.includes('@xenova/transformers')) return 'transformers';
          if (id.includes('onnxruntime')) return 'onnx';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  worker: {
    format: 'es',
  },
});
