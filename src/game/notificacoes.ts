import type { PlantaComEspecie } from '../db/actions'
import { NOMES_PRAGA } from './pragas'
import { formatarHoras, proximaRegaInfo } from './temporizadores'

export interface ProblemaPlanta {
  chave: string // unico por planta+tipo -- usado para nao repetir a mesma notificacao
  titulo: string
  corpo: string
}

/**
 * Deteta problemas que valem uma notificacao: rega atrasada e pragas
 * ativas. So versao "app aberta" -- nao usa Push API/service worker,
 * por isso so funciona enquanto o browser estiver a correr (ver
 * GardenView para o agendamento periodico e o pedido de permissao).
 */
export function detetarProblemas(plantas: PlantaComEspecie[], agora: number): ProblemaPlanta[] {
  const problemas: ProblemaPlanta[] = []

  for (const { planta, especieNome, especie } of plantas) {
    if (!especie || planta.estado === 'morta') continue

    const rega = proximaRegaInfo(planta, especie, agora)
    if (rega.atrasado) {
      problemas.push({
        chave: `${planta.id}-rega`,
        titulo: `💧 ${especieNome} precisa de água`,
        corpo: `Rega atrasada há ${formatarHoras(rega.horas)}`,
      })
    }

    if (planta.estado === 'praga' && planta.pragaAtual) {
      problemas.push({
        chave: `${planta.id}-praga`,
        titulo: `🐛 ${especieNome} tem uma praga`,
        corpo: NOMES_PRAGA[planta.pragaAtual],
      })
    }
  }

  return problemas
}
