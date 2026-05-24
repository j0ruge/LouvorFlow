/**
 * Formatador de share da lista CifraClub para WhatsApp.
 * Mensagem curta com header, URL única e microcopy.
 */

/**
 * Formata a mensagem de share da lista CifraClub para WhatsApp.
 * @param evento - Dados do evento (tipo, data, URL da lista)
 * @returns Texto formatado para compartilhamento
 */
export function formatCifraclubListShare(evento: {
  tipo_evento: string
  data: string
  cifraclub_list_url: string
}): string {
  const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const lines: string[] = []

  lines.push(`*${evento.tipo_evento}* — _${dataFormatada}_`)
  lines.push('')
  lines.push(`🎸 *Lista no CifraClub*: ${evento.cifraclub_list_url}`)
  lines.push('')
  lines.push('_Toque para abrir no app do CifraClub._')

  return lines.join('\n')
}
