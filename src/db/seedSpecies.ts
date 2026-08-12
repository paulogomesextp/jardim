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
 * imagemUrl (fase adulta/final) e imagemJovemUrl (fase jovem, antes de
 * fruto/flor) apontam para fotos reais no Wikimedia Commons -- dependencia
 * de uma CDN externa, sem controlo se o ficheiro for movido/apagado la;
 * funciona bem para um projeto pessoal, mas nao e o que se usaria num
 * produto a serio (nesse caso seriam imagens proprias hospedadas no
 * repositorio). As fotos de "jovem" sao verificadas por titulo/descricao
 * no Wikimedia, nao inspecionadas pixel a pixel -- para alecrim nao se
 * encontrou uma foto de planta jovem fiavel, por isso usa a mesma foto
 * generica de "rebento" (ver IMAGENS_FASE_GENERICA em game/imagemPlanta.ts).
 */
export const ESPECIES_INICIAIS: Especie[] = [
  {
    id: 'morangueiro',
    nome: 'Morangueiro',
    categoria: 'fruta',
    imagemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg/330px-Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg',
    imagemJovemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Leaf_of_Strawberry_plant.jpg/400px-Leaf_of_Strawberry_plant.jpg',
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
    imagemJovemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Person_plants_a_young_tomato_seedling_in_soil_on_a_sunny_day_in_a_garden_setting.jpg/400px-Person_plants_a_young_tomato_seedling_in_soil_on_a_sunny_day_in_a_garden_setting.jpg',
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
    imagemJovemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Lavandula_angustifolia_prg_1.jpg/400px-Lavandula_angustifolia_prg_1.jpg',
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
    imagemJovemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Rosa_de_alabastro_%28Echeveria_elegans%29%2C_jard%C3%ADn_del_molino%2C_Sierra_de_San_Felipe%2C_Set%C3%BAbal%2C_Portugal%2C_2012-05-11%2C_DD_01.JPG/400px-Rosa_de_alabastro_%28Echeveria_elegans%29%2C_jard%C3%ADn_del_molino%2C_Sierra_de_San_Felipe%2C_Set%C3%BAbal%2C_Portugal%2C_2012-05-11%2C_DD_01.JPG',
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
    imagemJovemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Petunia_ogrodowa_%28Petunia_%C3%97_atkinsiana%29%2C_Pozna%C5%84_-_kwiecie%C5%84_2015_%287%29.jpg/400px-Petunia_ogrodowa_%28Petunia_%C3%97_atkinsiana%29%2C_Pozna%C5%84_-_kwiecie%C5%84_2015_%287%29.jpg',
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
    imagemJovemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Calendula_officinalis_0zz.jpg/400px-Calendula_officinalis_0zz.jpg',
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
    // sem foto fiavel de "alecrim jovem" encontrada no Wikimedia -- usa o
    // generico de rebento (ver IMAGENS_FASE_GENERICA) tambem na fase jovem
    imagemJovemUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Plant_Nursery_Seedling%21_%2855027505770%29.jpg/400px-Plant_Nursery_Seedling%21_%2855027505770%29.jpg',
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
    imagemJovemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Thimble_cactus.jpg/400px-Thimble_cactus.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 168,
    humidadeIdealMin: 10,
    humidadeIdealMax: 20,
    duracaoFasesHoras: { germinacao: 16, rebento: 30, jovem: 45, adulta: 90 },
    tamanhoVasoMinimoPorFase: { germinacao: 5, rebento: 7, jovem: 9, adulta: 11 },
    valorVendaBase: 22,
  },
  // as "+2 espécies a definir" do conceito original -- escolhidas sem confirmar
  // com o Paulo (ele autorizou avançar sozinho), a rever se ele preferir outras
  {
    id: 'manjericao',
    nome: 'Manjericão',
    categoria: 'arbusto',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Ocimum_basilicum_8zz.jpg/330px-Ocimum_basilicum_8zz.jpg',
    imagemJovemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Young_basil_plant.JPG/400px-Young_basil_plant.JPG',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 30,
    humidadeIdealMin: 55,
    humidadeIdealMax: 65,
    duracaoFasesHoras: { germinacao: 5, rebento: 10, jovem: 16, adulta: 32 },
    tamanhoVasoMinimoPorFase: { germinacao: 6, rebento: 8, jovem: 12, adulta: 16 },
    valorVendaBase: 18,
  },
  {
    id: 'girassol',
    nome: 'Girassol',
    categoria: 'flor',
    imagemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/330px-Sunflower_sky_backdrop.jpg',
    imagemJovemUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/ISS-38_Young_sunflower_plant.jpg/400px-ISS-38_Young_sunflower_plant.jpg',
    luzIdeal: 'sol_pleno',
    regarCadaHoras: 36,
    humidadeIdealMin: 50,
    humidadeIdealMax: 60,
    duracaoFasesHoras: { germinacao: 8, rebento: 18, jovem: 28, adulta: 56 },
    tamanhoVasoMinimoPorFase: { germinacao: 8, rebento: 14, jovem: 22, adulta: 30 },
    valorVendaBase: 28,
  },
]
