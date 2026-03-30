import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'app',
  base: '/Gim-stronk/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Op Strength',
        short_name: 'OpStr',
        description: 'ML-Powered Adaptive Training System',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/Gim-stronk/',
        scope: '/Gim-stronk/',
        icons: [
          { src: '/Gim-stronk/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/Gim-stronk/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
