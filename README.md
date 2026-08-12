# Jardim

Jogo de jardinagem pessoal — cuidar de plantas reais com mecânica de espera
tipo Travian/Ikariam (semente → germinação → transplantes de vaso em vaso →
colheita/venda), onde a qualidade dos cuidados (sol, água, tamanho do vaso)
influencia o resultado. PWA instalável, corre inteiramente no browser.

## Stack

- Vite + React + TypeScript
- `vite-plugin-pwa` (manifest + service worker)
- Dexie.js (IndexedDB) como base de dados local — sem servidor/backend
- Vitest para os testes do motor de jogo

## Comandos

```
npm install
npm run dev       # servidor de desenvolvimento local
npm test          # corre a suite de testes (motor de crescimento/cuidados)
npm run build     # type-check + build de produção
npm run lint      # oxlint
```

## Estrutura

```
src/
  db/
    schema.ts       -- tabelas Dexie (Especie, PlantaPossuida, Jogador, ItemLoja)
    seedSpecies.ts   -- catálogo inicial de espécies
    init.ts          -- semeia a BD na primeira abertura
  game/
    growth.ts        -- motor de progressão (funções puras)
    care.ts           -- efeitos de água/sol/vaso na saúde
  components/
    GardenView.tsx, PlantCard.tsx
```

## Estado atual

Fase 1 (fundação) concluída: motor de crescimento testado, catálogo com 8
espécies (2 por categoria: fruta, flor, arbusto, vaso). Por fazer: pragas e
tratamento, loja de sementes/remédios e economia, UI de transplante de vaso
em vaso, notificações.
