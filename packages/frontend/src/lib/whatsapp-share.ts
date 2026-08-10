/**
 * Módulo de formatação e compartilhamento de escalas via WhatsApp.
 *
 * Exporta funções puras para gerar a mensagem formatada com markdown do WhatsApp,
 * construir a URL de compartilhamento e copiar a escala para a área de transferência.
 */

import type { EventoShow } from "@/schemas/evento";
import type { GrupoFuncoes } from "@/schemas/funcoes-grupos";

/** Uma linha da seção de integrantes, antes de ser renderizada como texto. */
type LinhaIntegrante = {
  funcaoNome: string;
  integranteNome: string;
};

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
 * Compara dois nomes alfabeticamente em português, ignorando caixa e acentos.
 *
 * @param a - Primeiro nome.
 * @param b - Segundo nome.
 * @returns Valor negativo, zero ou positivo conforme a ordem alfabética.
 */
function compararNomes(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

/**
 * Monta os blocos da seção de integrantes, um por grupo de funções.
 *
 * Cada integrante rende uma linha por função que exerce, portanto quem
 * acumula papéis (ex.: ministração e vocal) aparece em cada bloco
 * correspondente. Dentro do bloco, as linhas são ordenadas pelo nome do
 * integrante — o nome da função serve apenas de desempate, para que a
 * saída seja determinística.
 *
 * Blocos vazios são omitidos. Funções sem grupo formam um bloco após o
 * último grupo, e integrantes sem nenhuma função encerram a seção
 * listados apenas pelo nome.
 *
 * @param evento - Escala com seus integrantes e respectivas funções.
 * @param grupos - Grupos configurados pela igreja, em qualquer ordem.
 * @returns Lista de blocos, cada um já como um array de linhas de texto.
 */
function buildIntegrantesBlocos(evento: EventoShow, grupos: GrupoFuncoes[]): string[][] {
  const gruposOrdenados = [...grupos].sort((a, b) => a.ordem - b.ordem);

  const blocoPorFuncao = new Map<string, number>();
  gruposOrdenados.forEach((grupo, index) => {
    grupo.funcoes.forEach((funcao) => blocoPorFuncao.set(funcao.id, index));
  });

  const indiceSemGrupo = gruposOrdenados.length;
  const buckets: LinhaIntegrante[][] = Array.from(
    { length: gruposOrdenados.length + 1 },
    () => [],
  );
  const semFuncao: string[] = [];

  for (const integrante of evento.integrantes) {
    if (integrante.funcoes.length === 0) {
      semFuncao.push(integrante.nome);
      continue;
    }

    for (const funcao of integrante.funcoes) {
      const indice = blocoPorFuncao.get(funcao.id) ?? indiceSemGrupo;
      buckets[indice].push({
        funcaoNome: funcao.nome,
        integranteNome: integrante.nome,
      });
    }
  }

  const blocos: string[][] = [];

  for (const bucket of buckets) {
    if (bucket.length === 0) continue;

    bucket.sort((a, b) =>
      compararNomes(a.integranteNome, b.integranteNome)
      || compararNomes(a.funcaoNome, b.funcaoNome),
    );
    blocos.push(bucket.map((linha) => `${linha.funcaoNome} — ${linha.integranteNome}`));
  }

  if (semFuncao.length > 0) {
    blocos.push([...semFuncao].sort(compararNomes));
  }

  return blocos;
}

/**
 * Gera uma mensagem formatada com markdown do WhatsApp a partir de um evento (escala).
 *
 * A mensagem segue o layout canônico definido no PRD:
 * - Header com tipo de evento em negrito e data em itálico
 * - Seção de músicas numeradas com tom e link de versão (quando disponíveis)
 * - Seção de integrantes em blocos `Função — Nome`, um bloco por grupo de
 *   funções, separados por uma linha em branco
 *
 * O contador do cabeçalho conta pessoas, não linhas: quem exerce mais de uma
 * função aparece em vários blocos, mas é contado uma única vez.
 *
 * @param evento - Objeto completo do evento (escala) conforme retornado pela API.
 * @param grupos - Grupos de funções configurados pela igreja. Sem eles, todas
 * as funções caem num único bloco final (a mensagem continua legível).
 * @returns String formatada pronta para envio via WhatsApp.
 */
export function formatEscalaWhatsApp(
  evento: EventoShow,
  grupos: GrupoFuncoes[] = [],
): string {
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
  const integrantesBlocos = buildIntegrantesBlocos(evento, grupos);

  const sections = [header, ""];

  sections.push(musicasHeader);
  if (musicasLines.length > 0) {
    sections.push("");
    sections.push(musicasLines.join("\n"));
  }

  sections.push("");
  sections.push(integrantesHeader);
  for (const bloco of integrantesBlocos) {
    sections.push("");
    sections.push(bloco.join("\n"));
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
 * @param grupos - Grupos de funções usados para agrupar os integrantes.
 * @returns Promise que resolve quando a cópia for concluída.
 */
export async function copyEscalaToClipboard(
  evento: EventoShow,
  grupos: GrupoFuncoes[] = [],
): Promise<void> {
  await navigator.clipboard.writeText(formatEscalaWhatsApp(evento, grupos));
}
