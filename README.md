# Between Leaves

Jogo de jardinagem pessoal — cuidar de plantas reais com mecânica de espera
tipo Travian/Ikariam (semente → germinação → transplantes de vaso em vaso →
colheita/venda), onde a qualidade dos cuidados (sol, água, tamanho do vaso)
influencia o resultado. Visual isométrico ao estilo FarmVille (ver secção
abaixo). PWA instalável, corre inteiramente no browser.

## Stack

- Vite + React + TypeScript
- `vite-plugin-pwa` (manifest + service worker)
- Dexie.js (IndexedDB) como base de dados local — sem servidor/backend
- Vitest para os testes do motor de jogo
- Jardim isométrico 100% DOM/CSS (**sem WebGL/Three.js** desde 2026-08-19 --
  ver "Reformulação FarmVille" abaixo)

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
    layout.ts          -- grelha FIXA de parcelas do jardim (gerarSlots),
                          pura, sem saber nada de 3D/2D, so devolve slots
    nivel.ts            -- "Nível do Jardim" (XP, ver "Reformulação FarmVille")
    imagemPlanta.ts     -- escolhe a foto real certa (fase/sede/praga) no
                          cartão de detalhe (PlantStage) -- só aí, não no jardim
    vasoVisual.ts        -- catalogo de tipos/cores de vaso (ver "Colocacao em fileiras")
  garden/             -- jardim isométrico 2D, 100% DOM/CSS (substitui `three/`)
    iso.ts             -- projeção isométrica pura (mundo x,z <-> pixels de ecrã)
    movement.ts         -- input (teclado/joystick) partilhado + conversão para
                          direção de mundo, fora de React (lido em rAF); tambem
                          o pub/sub de animacao do avatar (dispararAcaoAvatar)
    GardenScene.tsx      -- orquestra chão, avatar, vasos/parcelas, câmara
                          (segue o avatar), tap-to-move, anel de proximidade
                          (so visual, ver "Clicar para abrir")
    Avatar.tsx           -- "boneco" DOM/CSS (chapéu de palha, ganga, regador/
                          faiscas/moeda por acao) + loop de movimento em rAF puro
    PlantSprite.tsx      -- vaso + planta DOM/CSS, muda por fase/especie/tipo/cor
    EmptySlotSprite.tsx  -- parcela livre sem vaso (so terra, convida a colocar)
    PlantSpeechMenu.tsx  -- balao de fala com acoes rapidas do vaso selecionado
    VirtualJoystick.tsx  -- o controlo tátil que o Paulo pediu para manter
    estadoVisual.ts, especieVisual.ts -- cor/emblema de estado, forma+acento por especie
    garden.css           -- todo o CSS da cena (chão, avatar, vasos, parcelas, balão, céu)
  components/
    GardenView.tsx     -- ecrã principal (GardenScene + HUD + toolbar + sheets)
    PlantActionSheet.tsx / ShopSheet.tsx -- bottom sheets sobre a cena
    PotPickerSheet.tsx / SeedPickerSheet.tsx -- colocar vaso / plantar do inventario
    PlantStage.tsx      -- cartão 2D de detalhe/ações da planta selecionada
```

## Reformulação FarmVille (2026-08-19, mandato total do Paulo)

> "Quero que mude por completo o jogo e os gráficos, para ser o mais
> aproximado do FarmVille, pense por si e como ficaria melhor. Pode mudar
> conceitos e tudo o que achar melhor, assim que como está não está
> apelativo."

Isto substituiu o mandato anterior ("só polish visual, não mexer na
essência") por liberdade total de design/conceito, mantendo só uma coisa
fixa: **o joystick virtual de movimento do avatar**, que o Paulo elogiou
explicitamente. Ver `.claude/agents/tom.md` para o mandato completo e o
incidente que motivou a decisão de arquitetura abaixo.

### Decisão de arquitetura: 2D isométrico DOM/CSS em vez de R3F/WebGL

A sessão anterior (madrugada de 19-08) teve um bug real em produção: uma
alteração à cena 3D (contornos + luz) ficou com ecrã em branco no telemóvel
do Paulo. Investigação confirmou a causa: o `<canvas>` do React Three Fiber
ficava preso no tamanho por omissão do HTML (300×150) sempre que a aba não
tinha foco genuíno, nunca completando um resize+render real -- e pior, essa
mesma falta de foco genuíno tornou **impossível confirmar de forma autónoma**
que a cena renderizava bem antes de dar a alteração como concluída (nem o
browser automatizado desta sessão, nem o Chrome real do Paulo via extensão,
mantinham foco de forma fiável sem um humano a olhar).

Pesquisei referências reais do FarmVille original antes de decidir (ver
fontes no fim desta secção) -- achado chave: **o FarmVille nunca foi 3D**.
Era um jogo 2D isométrico de sprites (Flash), câmara fixa, HUD com moldura
de madeira, toolbar de ferramentas ao centro-baixo, barra de XP/nível no
topo. Ou seja, ir para 2D/CSS não é uma cedência técnica -- é **mais fiel**
ao estilo real que a missão pede para replicar, e resolve o problema de
verificação pela raiz: um `<div>` posicionado por `transform` tem sempre
dimensões reais, legíveis de forma síncrona via `getBoundingClientRect()`/
`getComputedStyle()`, **independentemente de a aba estar em primeiro plano
genuíno ou de o browser estar a compor frames** -- ao contrário de um
`<canvas>` WebGL, que só existe visualmente depois de um resize+render que
pode nunca acontecer sem foco real.

Por isso, `three/*.tsx` (Canvas R3F, câmara ortográfica, modelos `.glb` da
Kenney, texturas PBR da ambientCG) foi **removido por completo** nesta
sessão -- não arquivado, removido (fica no histórico do git/GitHub se algum
dia fizer falta). `three`, `@react-three/fiber` e `@react-three/drei` saíram
do `package.json`; os assets `.glb`/texturas JPG saíram de `public/`. O novo
`garden/` (ver "Estrutura") reimplementa exatamente a mesma UX -- avatar
navegável por teclado/joystick, tap-to-move, câmara que segue o avatar,
seleção por proximidade -- só que com matemática isométrica pura
(`iso.ts`: `mundoParaEcra`/`ecraParaMundo`, projeção 2:1 clássica) e
`requestAnimationFrame` simples em vez de `useFrame`/WebGL. `game/layout.ts`
(posições x,z das plantas) não mudou nada -- já era puro e nunca soube nada
de 3D, por isso serviu tal e qual para o novo motor 2D.

**Assets**: sem modelos/texturas 3D para reaproveitar (e sem gerar arte por
IA, ver restrições em `tom.md`), o avatar e as plantas do jardim passaram a
ser **desenhados em DOM/CSS puro** (divs com `border-radius`/`clip-path`/
gradientes -- chapéu de palha e ganga para o avatar, vaso de barro +
folhagem que muda por fase de crescimento para as plantas), evitando
qualquer dependência de licença nova. As fotos reais do Wikimedia Commons
usadas no cartão de detalhe (`PlantStage.tsx`, fora do jardim) não mudaram.

**Fontes da pesquisa FarmVille** (a pesquisa web devolveu pouco detalhe
visual profundo -- Wikipedia/TV Tropes quase não descrevem estilo; os dados
mais concretos vieram de duas páginas de gameplay/wiki):
- gamepressure.com, "FarmVille: Game screen" -- confirma layout: barra de
  topo com moedas/Farm Cash/nível+XP; grelha isométrica central; toolbar
  inferior com Multi Tool/Move/Plow/Recycle; painel lateral para
  mercado/gifts/amigos/notificações.
- farmville.fandom.com, "FarmVille Gamebar" -- confirma XP/nível e
  temporizador de colheita como elementos centrais da UI.
- Conhecimento geral (paleta muito saturada, proporções "chunky", moldura de
  madeira/couro na UI, ícones glossy com bevel) complementou onde a pesquisa
  não deu detalhe suficiente -- assumido conscientemente, não inventado às
  cegas.

### O que mudou visualmente

- **Jardim**: céu com gradiente + sol + nuvens à deriva, chão isométrico em
  losango com textura de relva (crosshatch CSS no ângulo real 26.57° do
  tile 2:1) emoldurado a madeira escura, plantas com vaso de barro +
  folhagem que cresce visivelmente por fase (semente → rebento → jovem →
  adulta com "fruto"/"flor" na cor de destaque da categoria + emblema ✨ de
  "pronta"), avatar com chapéu de palha e ganga, bob/perna a "andar" quando
  em movimento.
- **HUD**: barra de topo com textura de madeira (era um painel creme liso),
  pastilha de moeda estilo moeda cravada, **badge de Nível do Jardim novo**
  (ver abaixo), botões de avisos viraram ícones redondos. Toolbar nova
  ancorada ao centro-inferior (estilo FarmVille: ferramenta principal
  sempre visível ali) com o botão da Loja -- antes era um chip pequeno no
  canto superior direito.
- **Botões**: sistema "candy button" (gradiente com brilho no topo + rebordo
  sólido escuro + sombra funda que "afunda" ao tocar), mais chunky que o
  "ledge" só-sombra da sessão anterior.
- **Joystick**: mantido pixel a pixel na lógica e no tamanho (base 92px,
  manípulo 44px) como o Paulo pediu -- só o "skin" mudou para um pad de
  madeira/couro com manípulo verde-lima, em vez de translúcido cinza-esverdeado.

### Conceito novo: Nível do Jardim (XP)

O FarmVille original girava em torno de XP/nível (barra no topo, sempre
visível). Em vez de inventar um sistema de pontos à parte, reaproveitei
`Jogador.moeda` como padrão: `Jogador.totalColhidas` (campo novo, schema
Dexie `v2` com upgrade automático para quem já tinha jogo instalado) conta
vendas bem sucedidas ao longo de toda a vida do jogador; `game/nivel.ts`
(puro, testado) deriva nível = `1 + floor(total/5)`, com uma barra de
progresso `total%5 / 5` mostrada como XP no badge do topo. Não muda nenhuma
mecânica existente -- é só leitura de um contador novo, incrementado no
mesmo sítio que já mexia em `moeda` (`venderPlanta`, `db/actions.ts`).

### Como isto foi verificado (e o limite real dessa verificação)

Confirmado ao vivo, via `resize_window` mobile (375×812) + inspeção de
`getBoundingClientRect()`/`getComputedStyle()`/`read_page` no browser
automatizado desta sessão:
- A árvore DOM renderiza por completo (header, badge de nível, 51 vasos,
  avatar, joystick, toolbar) com **zero erros de consola**, mesmo com
  `document.hidden === true` (a aba nunca teve foco genuíno nesta sessão --
  exatamente a condição que partiu a cena 3D antes). Isto é a prova real de
  que a decisão de arquitetura resolveu o problema: o DOM não depende de
  compositing para existir/ter dimensões corretas, ao contrário do canvas R3F.
- Posições/tamanhos reais conferidos: chão, avatar (40×64px) e vasos têm
  `transform`/`getBoundingClientRect()` com valores plausíveis e não-nulos;
  cores resolvidas (`getComputedStyle`) batem com a paleta esperada.
- Fluxo de interação completo testado via clique/dispatch de eventos reais
  (não só leitura passiva): selecionar planta → abre o sheet certo com os
  dados certos → **Vender** → moeda sobe, toast aparece, `totalColhidas`
  incrementa (schema v2 migrou sem erros).
- A matemática de projeção (`mundoParaEcra`/`ecraParaMundo`, inversas exatas)
  e a conversão de input do joystick para direção de mundo
  (`inputParaMundo`) têm testes Vitest dedicados -- e um desses testes
  **apanhou um bug real**: a primeira versão de `inputParaMundo` (uma
  rotação de 45° mal derivada) fazia o avatar andar na diagonal errada.
  Sem o teste, isto só seria visível vendo a animação mover-se ao vivo --
  exatamente o tipo de verificação que ficou bloqueada.

**O que não foi possível confirmar ao vivo, e porquê**: com
`document.hidden === true` durante toda a sessão,
`requestAnimationFrame` fica **totalmente suspenso** (0 callbacks em 3+
segundos, confirmado por teste direto) -- ou seja, não vi a câmara a seguir
o avatar nem a animação de andar a mexer-se de verdade, só posso garantir
que a lógica/matemática está correta (testada) e que o mecanismo de aplicar
`style.transform` funciona (confirmado nas posições estáticas). Isto **não
é o mesmo bug de antes**: aqui a cena já está completa e correta assim que
a aba ganha foco real (é o comportamento normal/esperado de qualquer rAF
web -- pausa quando escondido, retoma quando visível), não fica
permanentemente quebrada como o canvas R3F ficava. Ainda assim, **por
favor confirma no telemóvel** que o avatar anda na direção certa quando
empurras o joystick/WASD e que a câmara o segue suavemente -- é o único
pedaço que só um ecrã real com foco genuíno consegue confirmar de vez.

## Colocação em fileiras + balão de fala (2026-08-19, sessão Tom à tarde)

Pedido do Paulo, lista com 8 itens: vasos diferentes por planta (tipo/cor,
maiores/mais pequenos), arte da planta diferenciada por espécie, mapa em
ecrã inteiro no telemóvel com paredes invisíveis, clicar para abrir em vez
de auto-abrir por proximidade, balão de fala com ações rápidas em vez do
painel cheio de ecrã, animação do avatar ao regar (regador a sério), e
comprar planta nova já não a insere sozinha num sítio aleatório -- tem de
se colocar o vaso numa parcela livre primeiro.

**Resolve a decisão antiga logo acima** ("WIP de parcelas/grelha
descartado"): desta vez o pedido é explícito e os vasos **não foram
eliminados** -- a grelha (`game/layout.ts::gerarSlots`) é só onde os vasos
*podem* ser colocados, o vaso com a sua textura/cor continua a ser o objeto
central, exatamente a ressalva "talvez sem eliminar os vasos" que já
estava anotada ali.

- **Schema v3** (`db/schema.ts`): `VasoPossuido` (vaso físico numa parcela
  fixa, `plantaId` null = vazio) e `SementeInventario` (sementes
  compradas/ganhas mas ainda por plantar). Migração automática coloca
  quem já tinha plantas em vasos de barro/terracota, slots sequenciais --
  sem perder progresso.
- **Fluxo novo**: comprar/ganhar semente → entra no inventário (badge 🌱
  verde no HUD, só aparece se houver algo por plantar) → colocar um vaso
  numa parcela livre (`PotPickerSheet.tsx`, escolhe tipo + cor, tipo tem
  custo) → plantar uma semente do inventário nesse vaso vazio
  (`SeedPickerSheet.tsx`). Vender uma planta liberta o vaso (fica vazio no
  mesmo sítio, não desaparece do jardim).
- **`game/layout.ts` reescrito**: `gerarSlots()` é agora uma grelha fixa
  8 colunas × N linhas (cresce sozinha se já houver mais vasos que a
  grelha mínima cobre, para uma gravação antiga nunca perder acesso a um
  vaso), em vez do antigo empacotamento dinâmico por fase de crescimento
  (`calcularLocalizacoes`, removido). `limitesJardim` deriva sempre desta
  grelha fixa, nunca da quantidade de plantas possuídas.
- **Vasos**: 4 tipos com silhuetas CSS diferentes (barro clássico,
  cerâmica com aba, plástico liso, cesto de vime tecido) × 6 cores
  (`game/vasoVisual.ts`), aplicada via `--vaso-cor` (custom property,
  `color-mix()` para luz/sombra do gradiente). Trocar de vaso é uma opção
  extra no "Transplantar" de sempre (`PlantStage.tsx`) -- decisão consciente
  de não inventar um mecanismo de "mover planta para outro vaso vazio";
  o transplante continua a redimensionar/re-estilizar o vaso onde a planta
  já está.
  **"Vasos mais pequenos"**: `INCREMENTOS_VASO_CM` inclui valores negativos
  (-10/-5, além de +5/+10/+15) -- encolher custa moeda como crescer
  (`Math.abs`), nunca desce abaixo de `TAMANHO_VASO_MINIMO_CM` (5cm), e um
  vaso encolhido demais para a fase atual é penalizado pela saúde como
  sempre (`game/care.ts::taxaVaso`) -- é uma escolha real do jogador
  (ex: estética, ou para caber num espaço/composição), não só cosmética.
- **Arte por espécie, não só por categoria** (`garden/especieVisual.ts`):
  4 formas de folhagem (padrão, agulha -- alecrim/alfazema, suculenta --
  cacto/suculenta, espiga -- girassol) × 5 formas de fruto/flor (baga,
  flor-estrela, flor-trombeta, flor-grande com 5 pétalas + centro, nenhum),
  mapeadas por `speciesId` com fallback por categoria para espécies
  futuras. Continua 100% DOM/CSS, sem asset novo.
- **Clicar para abrir**: a deteção de proximidade (`GardenScene.tsx`)
  deixou de chamar `onSelecionarPlanta` sozinha -- só atualiza um estado
  `pertoIndex` que desenha um anel a pulsar (convite visual), nunca abre
  nada. Só o clique num vaso/parcela abre algo, de qualquer distância no
  ecrã (não ficou fisicamente amarrado à proximidade do avatar -- numa UI
  por toque isso seria mais frustrante do que útil).
- **Balão de fala** (`garden/PlantSpeechMenu.tsx`): ancorado ao mundo iso
  (mesma projeção do vaso, acompanha a câmara sem lógica extra), ações
  rápidas Regar/Sol (cicla os 4 níveis)/Tratar (só com praga)/Vender/
  Detalhes. "Detalhes" abre o `PlantActionSheet` de sempre para
  transplante, remédios e temporizadores -- não foi eliminado, só deixou
  de ser a única forma de interagir.
- **Animação do avatar** (`garden/movement.ts::dispararAcaoAvatar`,
  pub/sub simples fora do React): Regar levanta o braço com um regador a
  pingar 3 gotas; Tratar mostra faíscas ✨ orbitando; Vender/Plantar uma
  moeda/semente a subir por cima da cabeça. Dura ~900ms, não interrompe o
  andar. Cada vaso novo também tem um "pop" de entrada (`vaso-colocar-pop`
  em `garden.css`) ao ser colocado.
- **Mapa em ecrã inteiro**: `.app-shell-jardim` agora `position:fixed;
  inset:0` com `100dvh`/`100dvw` (+ fallback `100vh`/`100vw`), `html`/
  `body`/`#root` a 100% de altura em `index.css` -- antes disto um
  ancestral sem altura definida podia deixar o mapa cortado no telemóvel.
  O chão (`.chao`) é sempre dimensionado pela grelha mínima (64+ parcelas),
  nunca mais um losango pequeno a sobrar céu à volta com poucos vasos
  colocados. As "paredes invisíveis" já existiam (`Avatar.tsx` já
  fazia clamp aos `limites`) -- o que faltava era os limites em si serem
  sempre grandes o suficiente para encher o ecrã.

**Como foi verificado** (sessão sem foco de aba, mesma limitação de sempre
para 3D/rAF -- aqui não se aplica, é tudo DOM síncrono): `resize_window`
mobile (375×812) + eventos de clique reais despachados via `javascript_tool`
(não só leitura passiva) confirmaram, ao vivo: `.jardim-shell` preenche
exatamente 375×812; balão não aparece sem clicar; fluxo completo parcela
vazia → escolher tipo/cor → vaso vazio → escolher semente do inventário →
planta germinando, com o inventário/moeda a descontar certo em cada passo;
classe `avatar--acao-regar` liga e desliga a tempo (~900ms); as 4 formas de
folhagem e as 5 de fruto/flor têm todas pelo menos uma planta a usá-las
entre as 100+ já existentes na gravação de testes. **Não verificado**: o
visual real (só DOM/computed-style, sem screenshot possível em aba sem
foco) e a posição exata do balão de fala relativa ao vaso em ecrãs muito
estreitos -- vale a pena confirmar num telemóvel real que o balão não sai
cortado nas margens.

## Estado atual

Fases 1-3 do motor de jogo continuam concluídas e inalteradas nesta sessão:
crescimento testado, catálogo com 10 espécies, pragas ligadas a erro de
cuidado, loja de sementes/remédios, notificações do browser. O que mudou foi
inteiramente a camada de apresentação -- ver "Reformulação FarmVille" acima.
`game/*.ts` continua a ser toda a lógica pura testada (63 testes Vitest,
`npm test` verde); `garden/*.tsx` é só apresentação, tal como `three/*.tsx`
era antes.

### Decisão de uma sessão anterior: WIP de "parcelas"/grelha descartado

Havia trabalho não commitado a meio de substituir o vaso por "parcelas" de
terra numa grelha fixa -- **descartado** (não apagado, ver `git stash list`)
por contradizer o conceito de vasos e estar incompleto/partido. Continua
válido: se a ideia de dar mais espaço/zonas ao jardim voltar a fazer
sentido, talvez sem eliminar os vasos, vale a pena reler antes de recomeçar.

### Questões em aberto para o Paulo (e a Sara, onde marcado)

1. **Confirma no telemóvel** (ver "Como isto foi verificado" acima): o
   joystick move o avatar na direção certa e a câmara segue suavemente? É a
   única coisa desta reformulação que não consegui ver mexer-se ao vivo.
2. **[Sara]** O avatar, o vaso e a folhagem são desenhados em CSS puro
   (chapéu de palha, ganga, vaso de barro, folhas/flores por fase) -- sem
   arte pré-existente para seguir, porque não há sprites 2D dela no
   repositório ainda. Se tiveres arte/paleta real (mesmo referências soltas
   do FarmVille que gostes), tem prioridade sobre estas formas geométricas.
3. Os ícones da PWA (192/512, `vite.config.ts`) continuam o placeholder do
   `vite-plugin-pwa` -- falta exportar PNG a partir do ícone que a Sara
   mandou por chat.
4. O "Nível do Jardim" (XP a cada 5 colheitas) foi uma decisão minha para
   aproximar do FarmVille sem inventar um sistema de pontos à parte --
   confirma se faz sentido como mecânica ou se preferes outra base (ex:
   nº de espécies diferentes cultivadas, em vez de colheitas totais).
5. **[Sessão 2026-08-19 tarde]** Preço dos vasos (10-22🪙, arbitrário, ver
   `game/vasoVisual.ts`) e o preço/passo de encolher vaso (`-10cm`/`-5cm`,
   mesmo custo por cm que crescer) -- valores todos arbitrários, a rever.
6. **[Sessão 2026-08-19 tarde]** Confirma no telemóvel real que o balão de
   fala não fica cortado nas margens do ecrã em vasos perto da borda da
   grelha, e que o "pop" de entrada dos 100+ vasos ao carregar a app não
   fica visualmente poluído/lento num telemóvel mais fraco -- nenhum dos
   dois foi possível confirmar sem screenshot real (ver "Como foi
   verificado" acima).
