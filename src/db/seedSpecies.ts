import type { Especie } from './schema'

/**
 * Dados iniciais de 4 especies reais (uma amostra das 4 categorias:
 * fruta, arbusto, vaso -- falta ainda flor). Valores de luz/agua/humidade
 * baseados em necessidades reais de cada planta; as duracoes de fase
 * estao COMPRIMIDAS para horas de jogo (nao sao o tempo real que uma
 * planta demora), so a duracao RELATIVA entre especies tenta refletir
 * a realidade (ex: suculenta e alfazema crescem mais devagar e toleram
 * muito mais tempo sem rega do que morangueiro/tomateiro).
 */
export const ESPECIES_INICIAIS: Especie[] = [
  {
    id: 'morangueiro',
    nome: 'Morangueiro',
    categoria: 'fruta',
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
    luzIdeal: 'sol_parcial',
    regarCadaHoras: 96,
    humidadeIdealMin: 20,
    humidadeIdealMax: 30,
    duracaoFasesHoras: { germinacao: 12, rebento: 24, jovem: 36, adulta: 72 },
    tamanhoVasoMinimoPorFase: { germinacao: 6, rebento: 8, jovem: 10, adulta: 12 },
    valorVendaBase: 20,
  },
]
