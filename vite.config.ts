import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // permite aceder via URL do tunnel (cloudflared) para testar no telemovel --
  // sem isto o Vite bloqueia por causa do Host header nao reconhecido
  preview: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // placeholder ate termos arte a serio (fica para a namorada do Paulo)
      manifest: {
        name: 'Jardim',
        short_name: 'Jardim',
        description: 'Jogo de jardinagem com plantas reais',
        theme_color: '#166534',
        background_color: '#f0fdf4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
