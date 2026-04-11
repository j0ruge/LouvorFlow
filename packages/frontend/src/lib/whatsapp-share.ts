/**
 * Módulo de formatação e compartilhamento de escalas via WhatsApp.
 *
 * Exporta funções puras para gerar a mensagem formatada com markdown do WhatsApp,
 * construir a URL de compartilhamento e copiar a escala para a área de transferência.
 */

import type { EventoShow } from "@/schemas/evento";

/**
 * Formata a data de um evento no padrão brasileiro DD/MM/AAAA HH:mm.
 *
 * @param isoDate - String de data no formato ISO 8601.
 * @returns Data formatada no padrão pt-BR com hora e minuto.
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * Gera uma mensagem formatada com markdown do WhatsApp a partir de um evento (escala).
 *
 * A mensagem segue o layout canônico definido no PRD:
 * - Header com tipo de evento em negrito e data em itálico
 * - Seção de músicas numeradas com tom e link de versão (quando disponíveis)
 * - Seção de integrantes ordenados alfabeticamente com suas funções
 *
 * @param evento - Objeto completo do evento (escala) conforme retornado pela API.
 * @returns String formatada pronta para envio via WhatsApp.
 */
export function formatEscalaWhatsApp(evento: EventoShow): string {
  const tipoNome = evento.tipoEvento?.nome ?? "Evento";
  const dataFormatada = formatDate(evento.data);
  const header = `*${tipoNome}* — _${dataFormatada}_`;

  const musicasHeader = `🎵 *Músicas* (${evento.musicas.length})`;
  const musicasSorted = [...evento.musicas].sort((a, b) => a.ordem - b.ordem);
  const musicasLines = musicasSorted.map((musica, index) => {
    const tom = musica.tonalidade ? ` (${musica.tonalidade.tom})` : "";
    const nomeLine = `${index + 1}. ${musica.nome}${tom}`;

    const link =
      musica.versao_selecionada?.link_versao ?? null;

    if (link) {
      return `${nomeLine}\n   ${link}`;
    }

    return nomeLine;
  });

  const integrantesHeader = `👥 *Integrantes* (${evento.integrantes.length})`;
  const integrantesSorted = [...evento.integrantes].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
  );
  const integrantesLines = integrantesSorted.map((integrante) => {
    if (integrante.funcoes.length === 0) {
      return integrante.nome;
    }
    const funcoes = integrante.funcoes.map((f) => f.nome).join(", ");
    return `${integrante.nome} — ${funcoes}`;
  });

  const sections = [header, ""];

  sections.push(musicasHeader);
  if (musicasLines.length > 0) {
    sections.push("");
    sections.push(musicasLines.join("\n"));
  }

  sections.push("");
  sections.push(integrantesHeader);
  if (integrantesLines.length > 0) {
    sections.push("");
    sections.push(integrantesLines.join("\n"));
  }

  return sections.join("\n");
}

/**
 * Constrói a URL de compartilhamento via WhatsApp (wa.me) com a mensagem codificada.
 *
 * @param message - Texto da mensagem a ser compartilhada.
 * @returns URL completa do wa.me com o parâmetro `text` codificado.
 */
export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Copia a escala formatada para a área de transferência do navegador.
 *
 * Gera a mensagem com `formatEscalaWhatsApp` e utiliza a Clipboard API
 * para copiar o texto. Rejeições são propagadas para que o chamador
 * possa exibir feedback de erro ao usuário.
 *
 * @param evento - Objeto completo do evento (escala) conforme retornado pela API.
 * @returns Promise que resolve quando a cópia for concluída.
 */
export async function copyEscalaToClipboard(
  evento: EventoShow,
): Promise<void> {
  await navigator.clipboard.writeText(formatEscalaWhatsApp(evento));
}
