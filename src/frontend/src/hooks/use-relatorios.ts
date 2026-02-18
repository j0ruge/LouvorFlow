/**
 * Hook React Query para o módulo de relatórios.
 *
 * Encapsula a busca do resumo de relatórios com cache automático
 * e gerenciamento de estados de loading/error.
 */

import { useQuery } from "@tanstack/react-query";
import { getRelatorioResumo } from "@/services/relatorios";

/**
 * Hook para buscar o resumo completo de relatórios.
 *
 * @returns Resultado do React Query com dados, loading e error states.
 */
export function useRelatorioResumo() {
  return useQuery({
    queryKey: ["relatorios", "resumo"],
    queryFn: getRelatorioResumo,
  });
}
