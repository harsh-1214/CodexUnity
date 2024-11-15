import { defineConfig } from "vite";
import path from "path"
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // scope : 'http://localhost:5173',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'd-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                // maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      // manifest: {
      //   name: 'My App',
      //   short_name: 'App',
      //   start_url: '/',
      //   display: 'standalone',
      //   background_color: '#ffffff',
      //   theme_color: '#3e4e5e',
      //   icons: [
      //     {
      //       src: 'favicon.svg',
      //       sizes: '512x512',
      //       type: 'image/svg+xml'
      //     },
      //   ],
      // },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Optimizations for monaco editor
  optimizeDeps : {
    include: ['monaco-editor'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor']
        }
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    origin: "http://0.0.0.0:5173",
  },
});
