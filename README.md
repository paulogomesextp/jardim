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

### Manhã 2026-08-19: revertidos os contornos/luz/tons da cena 3D

O Paulo reportou tela em branco no telemóvel (só o header aparecia, nada
do jardim/avatar). Investiguei ao vivo (real Chrome ligado via
claude-in-chrome, não só o browser autónomo) e confirmei, de forma
repetida, que o `<canvas>` da cena nunca saía do tamanho por omissão do
HTML (300x150, sem `style` de largura/altura aplicado) -- ou seja, o R3F
nunca completa um resize+render real, o que bate certo com "ecrã em
branco" (o canvas fica microscópico/nunca ganha conteúdo visível).
**Não consegui isolar com 100% de certeza se a causa é o commit "Cena 3D:
contornos, luz mais plana e cores mais saturadas" (o próprio Tom já tinha
avisado que não o verificou ao vivo) ou o mesmo problema de ambiente
"aba sem foco" que já persegue este projeto** -- o sintoma reproduziu-se
mesmo em testes que deviam estar com foco real, mas o Chrome automatizado
também nunca ficou de forma fiável em primeiro plano genuíno durante os
testes, e um pedido de acesso ao ecrã real para confirmar visualmente foi
negado (não havia ninguém a aprovar o diálogo).

Decisão: **revertido o commit `25ea647`** (`git revert`, commit `8e2df10`),
já com push e deploy confirmado. Isto devolve a cena 3D à última
configuração de luz/materiais **já validada ao vivo em sessões
anteriores** (12-08), removendo a única variável não verificada, sem
perder nada do resto da sessão de ontem (UI chunky, os 2 fixes de
flex-shrink, o bounce da loja). Os contornos/luz mais plana/tons mais
saturados ficam por refazer, desta vez com verificação visual real (no
telemóvel do Paulo ou com alguém a olhar para o browser automatizado) em
vez de só revisão de código.

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
4. ~~Não consegui verificar visualmente as alterações na cena 3D~~ --
   confirmado que era um problema real (ecrã em branco no telemóvel do
   Paulo), commit revertido na manhã de 19-08 (ver secção acima). Por
   favor confirma que o link ao vivo já mostra o jardim/avatar
   normalmente outra vez. Contornos/luz plana/tons saturados ficam por
   refazer com verificação visual real da próxima vez.
