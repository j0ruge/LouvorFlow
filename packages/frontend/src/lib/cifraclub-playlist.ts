/**
 * Formatador de playlist CifraClub para texto plano (clipboard/WhatsApp).
 * Gera mensagem formatada com header, lista numerada e microcopy.
 */

/** Item da playlist CifraClub. */
export interface PlaylistItem {
  ordem: number;
  nome: string;
  /** Tonalidade escolhida pela líder (ex.: "Em", "C#m") — exibida como está. */
  tom: string | null;
  artista_nome: string;
  cifraclub_url: string | null;
}

/** Estatísticas de cobertura da playlist (contrato do backend). */
export interface PlaylistStats {
  total: number;
  com_link: number;
  /**
   * Quantidade de músicas sem cifra cadastrada. Faz parte do contrato de stats
   * retornado pelo backend; o formatador deriva a cobertura de `com_link`/`total`,
   * portanto este campo é mantido por fidelidade ao contrato (não é renderizado).
   */
  sem_link: number;
}

/** Dados do evento para formatação. */
export interface EventoInfo {
  data: string;
  descricao: string;
  tipo_evento: string;
}

/**
 * Formata a playlist CifraClub em texto plano para WhatsApp/clipboard.
 * @param evento - Dados do evento (tipo, data, descrição)
 * @param playlist - Itens da playlist ordenados
 * @param stats - Estatísticas de cobertura
 * @returns Texto formatado para compartilhamento
 */
export function formatCifraclubPlaylist(
  evento: EventoInfo,
  playlist: PlaylistItem[],
  stats: PlaylistStats,
): string {
  const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const lines: string[] = [];

  lines.push(`*🎸 Cifras — ${evento.tipo_evento}*`);
  lines.push(`_${dataFormatada} · ${stats.com_link} de ${stats.total} músicas com cifra_`);
  lines.push('');

  for (const item of playlist) {
    const tomPart = item.tom ? ` (${item.tom})` : '';
    const artistaPart = item.artista_nome ? ` — ${item.artista_nome}` : '';

    if (item.cifraclub_url) {
      lines.push(`${item.ordem}. ${item.nome}${tomPart}${artistaPart}`);
      lines.push(`   ${item.cifraclub_url}`);
    } else {
      lines.push(`${item.ordem}. ${item.nome}${tomPart}`);
      lines.push(`   _(sem cifra cadastrada)_`);
    }
  }

  lines.push('');
  lines.push('📱 _Toque em cada link para abrir a cifra no app do CifraClub._');

  return lines.join('\n');
}
