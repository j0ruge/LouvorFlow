/**
 * Regras puras de seleção de versão de música numa escala.
 *
 * Vivem fora de `MusicaVersaoPicker.tsx` porque exportar uma função não-componente
 * de um arquivo de componente desliga o Fast Refresh do módulo inteiro
 * (`react-refresh/only-export-components`). Isolá-las aqui também deixa as regras
 * testáveis sem montar o componente.
 */

import type { VersaoMusica } from "@/schemas/evento";

/**
 * Determina o ID da versão padrão a ser selecionada automaticamente.
 *
 * Regras:
 * - Se há 0 versões: retorna null.
 * - Se há seleção atual que ainda existe na lista: retorna o id da seleção atual.
 * - Se há seleção atual stale (não existe mais nas versões): retorna null.
 * - Se não há seleção e há exatamente 1 versão: retorna o id dessa versão (auto-select).
 * - Se não há seleção e há múltiplas versões: retorna null (não adivinha).
 *
 * @param versoes - Lista de versões disponíveis para a música.
 * @param current - Versão atualmente selecionada, ou null.
 * @returns ID da versão a selecionar, ou null.
 */
export function selectDefaultVersaoId(
  versoes: VersaoMusica[],
  current: VersaoMusica | null,
): string | null {
  if (versoes.length === 0) return null;

  if (current !== null) {
    const stillExists = versoes.some((v) => v.id === current.id);
    return stillExists ? current.id : null;
  }

  if (versoes.length === 1) return versoes[0].id;

  return null;
}

/**
 * Calcula o label do badge considerando o estado da seleção.
 *
 * @param versaoSelecionada - Versão selecionada (pode estar stale).
 * @param versoesDisponiveis - Lista atualizada de versões.
 * @returns Label a exibir no badge.
 */
export function computeBadgeLabel(
  versaoSelecionada: VersaoMusica | null,
  versoesDisponiveis: VersaoMusica[],
): string {
  if (versaoSelecionada === null) return "Sem versão";

  const stillExists = versoesDisponiveis.some((v) => v.id === versaoSelecionada.id);
  if (!stillExists) return "Sem versão";

  return versaoSelecionada.artista_nome ?? "Sem artista";
}
