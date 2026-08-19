# Between Leaves

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
    seedSpecies.ts   -- catálogo inicial de espécies (10, ver "Estado atual")
    seedShop.ts      -- loja inicial (1 semente/espécie + 1 remédio/praga)
    actions.ts       -- toda a lógica de escrita (plantar/regar/transplantar/
                        vender/tratar) + processarTodasAsPlantas (catch-up)
    init.ts          -- semeia a BD na primeira abertura
  game/               -- lógica pura, testada em *.test.ts (Vitest)
    growth.ts         -- motor de progressão de fase (processarAoAbrir)
    care.ts            -- efeitos de água/sol/vaso na saúde
    pragas.ts          -- deteção/tratamento de pragas (ligadas a erro de cuidado)
    temporizadores.ts  -- "quanto falta para X" (rega, próxima fase)
    notificacoes.ts    -- deteta problemas para Notification API
    layout.ts          -- posições das plantas no jardim 3D
    imagemPlanta.ts     -- escolhe a foto certa (fase/sede/praga) no cartão 2D
  three/              -- cena 3D isométrica (React Three Fiber + drei)
    Scene.tsx          -- luzes, câmara, chão, avatar, plantas
    IsoCamera.tsx       -- câmara ortográfica fixa que segue o avatar
    Avatar.tsx, movement.ts, VirtualJoystick.tsx -- avatar + input (teclado/toque)
    Plant3D.tsx         -- vaso + planta reais (Kenney) + contorno + nome + estado
    Ground.tsx          -- chão com relva PBR real (ambientCG)
    potMaterial.ts      -- material de barro partilhado (ambientCG)
    materialFix.ts      -- corrige metalness dos modelos Kenney (ficavam escuros)
    ProximityWatcher.tsx -- seleciona a planta mais próxima do avatar
  components/
    GardenView.tsx     -- ecrã principal (Canvas 3D + HUD + sheets)
    PlantActionSheet.tsx / ShopSheet.tsx -- bottom sheets sobre o Canvas
    PlantStage.tsx      -- cartão 2D de detalhe/ações da planta selecionada
```

## Estado atual

Fases 1-3 concluídas: motor de crescimento testado, catálogo com 10 espécies,
pragas ligadas a erro de cuidado (tratamento manual grátis 60% ou remédio
pago garantido), loja de sementes/remédios, notificações do browser, e o
jardim passou de carrossel 2D a uma **cena 3D isométrica** com avatar
navegável (React Three Fiber + drei), plantas com modelo `.glb` real por
espécie (Kenney "Nature Kit", CC0) e vaso com textura PBR real (ambientCG),
câmara fixa que segue o avatar. `game/*.ts` continua a ser toda a lógica
pura testada; `three/*.tsx` é só apresentação.

Em curso: aproximar o visual do FarmVille (paleta saturada, proporções
"chunky", contornos, luz plana, UI com ledges 3D, animações bouncy) mantendo
o conceito de cuidar de plantas reais em vasos intacto -- ver
`.claude/agents/tom.md` para a missão completa. Sessão 2026-08-19: ledges 3D
estendidos a toda a UI (não só botões de ação), contornos (`<Outlines>` do
drei) e luz mais plana na cena 3D, saturação subida nos tons de destaque da
paleta, e 2 bugs reais de layout corrigidos (elementos dentro dos bottom
sheets a serem espremidos pelo flexbox em ecrãs pequenos, em vez de o sheet
fazer scroll como devia).

### Decisão desta sessão: WIP de "parcelas"/grelha descartado

Ao começar a sessão de 2026-08-19 havia trabalho não commitado (de uma
sessão anterior) a meio de substituir o mecanismo de vaso por "parcelas" de
terra numa grelha fixa (`viveiro`/`campo`, `game/grelha.ts`) -- tipo terreno
de fazenda com fileiras. Foi **descartado** (não apagado -- ver stash), por
dois motivos:

1. Contradiz o conceito fixo do jogo tal como está escrito no brief do Tom
   e no próprio código: "vasos com textura PBR real", "transplantada de
   vaso em vaso" -- e a missão FarmVille é explícita em **não** copiar a
   mecânica de terreno/colheita em grelha do FarmVille por cima disto.
2. Estava incompleto e partido: `tsc -b` dava ~20 erros (só `schema.ts`,
   `seedSpecies.ts`, `care.ts`, `pragas.ts`, `growth.ts` tinham sido
   tocados; `db/actions.ts`, todos os componentes e a maioria dos testes
   ainda esperavam vaso), e `npm test` já falhava 1 teste por
   dessincronização de assinatura (`processarAoAbrir` ganhou um parâmetro
   `parcela` sem os testes serem atualizados).

O trabalho não foi perdido: `git stash list` tem
`"WIP grelha/parcela descartado..."` e há uma cópia em patch fora do repo
(`grelha.ts`/`grelha.test.ts` + diff completo). Se a ideia de dar mais
espaço/zonas ao jardim voltar a fazer sentido, talvez sem eliminar os
vasos (ex: zonas do jardim com plantas em vaso à mesma, só organizadas por
área), vale a pena reler antes de recomeçar do zero.

### Questões em aberto para o Paulo (e a Sara, onde marcado)

1. **[Sara]** Subi ligeiramente a saturação dos tons de destaque da paleta
   (`--lima`, `--laranja`, `--agua`, `--teal`, `--ouro` em `src/index.css`)
   como parte da missão FarmVille -- os fundos "-suave" e a base
   creme/verde ficaram tal e qual. Confirmar se os novos tons ainda batem
   certo com a arte dela, ou se prefere os originais.
2. Os ícones da PWA (192/512, `vite.config.ts`) continuam o placeholder do
   `vite-plugin-pwa` -- falta exportar PNG a partir do ícone que a Sara
   mandou por chat (ficou registado no código, já não é novo mas continua
   por fazer).
3. Ver acima: a ideia de "parcelas"/grelha foi descartada por contradizer o
   conceito de vasos -- se a intenção original era outra coisa (ex: só dar
   mais espaço visual ao jardim, sem tirar os vasos), diz para eu perceber
   melhor antes de decidir sozinho da próxima vez.
4. **Não consegui verificar visualmente** (screenshot) as alterações na
   cena 3D desta sessão (contornos, luzes, tons de vaso/relva) -- o browser
   automatizado desta sessão autónoma não composita frames sem um humano
   a ver (confirmado: `requestAnimationFrame` nunca dispara numa aba em
   segundo plano/oculta, o que também impede o Canvas R3F de sequer
   inicializar o loop de render). Toda a verificação foi por leitura de
   código + `tsc`/testes/build limpos + as técnicas usadas são aditivas e
   de baixo risco (ver commit "Cena 3D: contornos..."), mas por favor dá
   uma olhada real a isto em primeiro lugar amanhã -- é a única parte do
   trabalho de hoje que não pude confirmar com os meus próprios olhos.
