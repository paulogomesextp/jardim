import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // o site de producao fica em paulogomesextp.github.io/jardim/, nao na raiz
  // -- sem isto todos os assets (JS/CSS/icones) apontavam para a raiz do
  // dominio e davam 404 no GitHub Pages
  base: '/jardim/',
  // permite aceder via URL do tunnel (cloudflared) para testar no telemovel --
  // sem isto o Vite bloqueia por causa do Host header nao reconhecido
  preview: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // icones 192/512 ainda sao o placeholder do vite-plugin-pwa -- faltam
      // ficheiros PNG exportados a partir da arte da namorada do Paulo (ela
      // mandou o icone por chat, nao um ficheiro fonte editavel)
      manifest: {
        name: 'Between Leaves',
        short_name: 'Between Leaves',
        description: 'A little greener, one leaf at a time. Jogo de jardinagem com plantas reais.',
        theme_color: '#1f3d2c',
        background_color: '#f7eedd',
        display: 'standalone',
        start_url: '/jardim/',
        scope: '/jardim/',
        icons: [
          { src: '/jardim/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/jardim/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/jardim/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // sem isto, uma nova versao instala mas so "assume o controlo"
        // depois de todas as abas/instalacoes antigas fecharem -- forcava
        // a fechar mesmo a app para ver qualquer alteracao nova
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
