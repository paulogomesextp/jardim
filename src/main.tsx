import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

/**
 * Regista o service worker manualmente (em vez do script auto-injetado,
 * ver `vite.config.ts::injectRegister: false`) para poder forçar um
 * reload automático assim que uma versão nova estiver pronta --
 * `skipWaiting`+`clientsClaim` (workbox, vite.config.ts) já fazem o novo
 * SW assumir controlo sozinho em segundo plano, mas sem isto a ABA que já
 * estava aberta continuava a correr o JavaScript antigo até o utilizador
 * a fechar/reabrir manualmente -- era exatamente o sintoma "aparece a
 * versão antiga mesmo com refresh" reportado (2026-08-19). Testado ao
 * vivo: deploy de uma versão nova + reload da aba já aberta troca de
 * versão sozinho, sem ação manual.
 */
const INTERVALO_VERIFICACAO_ATUALIZACAO_MS = 30 * 60_000 // 30 min -- o GitHub Pages serve sw.js com Cache-Control: max-age=600, por isso nao chega esperar so pelo check automatico do browser (pode so acontecer 1x/24h)

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload()
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return
    // forca o browser a verificar sw.js periodicamente em vez de confiar so no
    // cache HTTP de 10 min do GitHub Pages -- sem isto, uma PWA instalada que
    // fica "aberta" no telemovel durante horas podia nunca chegar a ver uma
    // versao nova (o browser so verifica sozinho de vez em quando)
    setInterval(() => registration.update(), INTERVALO_VERIFICACAO_ATUALIZACAO_MS)
  },
  onRegisterError(erro) {
    console.error('Falha ao registar o service worker:', erro)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
