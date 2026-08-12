import type { Especie } from './schema'

/**
 * Catalogo inicial: 8 especies reais, 2 por categoria (fruta, flor,
 * arbusto, vaso). Valores de luz/agua/humidade baseados em necessidades
 * reais de cada planta; as duracoes de fase estao COMPRIMIDAS para horas
 * de jogo (nao sao o tempo real que uma planta demora), so a duracao
 * RELATIVA entre especies tenta refletir a realidade (ex: cacto e alecrim
 * crescem mais devagar e toleram muito mais tempo sem rega que petunia/
 * tomateiro).
 *
 * imagemUrl aponta para fotos reais no Wikimedia Commons (via API da
 * Wikipedia) -- dependencia de uma CDN externa, sem controlo se o
 * ficheiro for movido/apagado la; funciona bem para um projeto pessoal,
 * mas nao e o que se usaria num produto a serio (nesse caso seriam
 * imagens proprias hospedadas no repositorio).
 */
export const ESPECIES_INICIAIS: Especie[] = [
  {
    id: 'morangueiro',
    nome: 'Morangueiro',
    categoria: 'fruta',
    imagemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg/330px-Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 48,
    humidadeIdealMin: 60,
    humidadeIdealMax: 70,
    duracaoFasesHoras: { germinacao: 8, rebento: 16, jovem: 24, adulta: 48 },
    tamanhoVasoMinimoPorFase: { germinacao: 8, rebento: 10, jovem: 15, adulta: 20 },
    valorVendaBase: 45,
  },
  {
    id: 'tomate_cereja',
    nome: 'Tomate-cereja',
    categoria: 'fruta',
    imagemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Tomates_cerises_Luc_Viatour.jpg/330px-Tomates_cerises_Luc_Viatour.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 24,
    humidadeIdealMin: 50,
    humidadeIdealMax: 60,
    duracaoFasesHoras: { germinacao: 6, rebento: 14, jovem: 20, adulta: 40 },
    tamanhoVasoMinimoPorFase: { germinacao: 8, rebento: 12, jovem: 18, adulta: 25 },
    valorVendaBase: 35,
  },
  {
    id: 'alfazema',
    nome: 'Alfazema',
    categoria: 'arbusto',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Single_lavender_flower02.jpg/330px-Single_lavender_flower02.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 72,
    humidadeIdealMin: 30,
    humidadeIdealMax: 40,
    duracaoFasesHoras: { germinacao: 10, rebento: 20, jovem: 30, adulta: 60 },
    tamanhoVasoMinimoPorFase: { germinacao: 8, rebento: 10, jovem: 14, adulta: 18 },
    valorVendaBase: 25,
  },
  {
    id: 'suculenta',
    nome: 'Suculenta (Echeveria)',
    categoria: 'vaso',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Echeveria_elegans_-_1.jpg/330px-Echeveria_elegans_-_1.jpg',
    luzIdeal: 'sol_parcial',
    regarCadaHoras: 96,
    humidadeIdealMin: 20,
    humidadeIdealMax: 30,
    duracaoFasesHoras: { germinacao: 12, rebento: 24, jovem: 36, adulta: 72 },
    tamanhoVasoMinimoPorFase: { germinacao: 6, rebento: 8, jovem: 10, adulta: 12 },
    valorVendaBase: 20,
  },
  {
    id: 'petunia',
    nome: 'Petúnia',
    categoria: 'flor',
    imagemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Pet%C3%BAnia_%28do_tupi_petyma%2C_%27tabaco%27%29.jpg/330px-Pet%C3%BAnia_%28do_tupi_petyma%2C_%27tabaco%27%29.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 36,
    humidadeIdealMin: 55,
    humidadeIdealMax: 65,
    duracaoFasesHoras: { germinacao: 6, rebento: 12, jovem: 18, adulta: 36 },
    tamanhoVasoMinimoPorFase: { germinacao: 6, rebento: 8, jovem: 12, adulta: 16 },
    valorVendaBase: 15,
  },
  {
    id: 'calendula',
    nome: 'Calêndula',
    categoria: 'flor',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Calendula_January_2008-1_filtered.jpg/330px-Calendula_January_2008-1_filtered.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 48,
    humidadeIdealMin: 45,
    humidadeIdealMax: 55,
    duracaoFasesHoras: { germinacao: 7, rebento: 14, jovem: 20, adulta: 38 },
    tamanhoVasoMinimoPorFase: { germinacao: 6, rebento: 8, jovem: 12, adulta: 15 },
    valorVendaBase: 15,
  },
  {
    id: 'alecrim',
    nome: 'Alecrim',
    categoria: 'arbusto',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Rosemary_in_bloom.JPG/330px-Rosemary_in_bloom.JPG',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 120,
    humidadeIdealMin: 20,
    humidadeIdealMax: 30,
    duracaoFasesHoras: { germinacao: 12, rebento: 24, jovem: 36, adulta: 72 },
    tamanhoVasoMinimoPorFase: { germinacao: 8, rebento: 10, jovem: 15, adulta: 20 },
    valorVendaBase: 30,
  },
  {
    id: 'cacto',
    nome: 'Cacto (Mammillaria)',
    categoria: 'vaso',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Mammillaria_tayloriorum.jpg/330px-Mammillaria_tayloriorum.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 168,
    humidadeIdealMin: 10,
    humidadeIdealMax: 20,
    duracaoFasesHoras: { germinacao: 16, rebento: 30, jovem: 45, adulta: 90 },
    tamanhoVasoMinimoPorFase: { germinacao: 5, rebento: 7, jovem: 9, adulta: 11 },
    valorVendaBase: 22,
  },
]
