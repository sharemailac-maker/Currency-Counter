import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Build Hardening & Anti-Reverse Engineering:
    // 1. Strict sourcemap disabling to prevent source inspection
    // 2. Automated stripping of console.log, console.debug, and debugger statements
    // 3. Compact chunk output and removal of comments
    esbuild: {
      drop: ['debugger' as const],
      pure: ['console.log', 'console.debug', 'console.info'],
      legalComments: 'none' as const,
    },
    build: {
      sourcemap: false,
      minify: 'esbuild' as const,
      cssMinify: true,
      target: 'es2020',
      rollupOptions: {
        output: {
          compact: true,
          // Generic hashed chunk names to hinder structural reverse engineering
          chunkFileNames: 'assets/c-[hash].js',
          entryFileNames: 'assets/e-[hash].js',
          assetFileNames: 'assets/a-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules/three')) {
              return 'vendor-three';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
