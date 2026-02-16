/**
 * Hooks React Query para dados de suporte (lookup lists).
 *
 * Encapsula as chamadas de serviço para tonalidades, funções e tipos
 * de eventos com caching automático via React Query.
 */

import { useQuery } from "@tanstack/react-query";
import { getTonalidades, getFuncoes, getTiposEventos } from "@/services/support";

/**
 * Hook para buscar a lista de tonalidades.
 *
 * @returns Resultado do useQuery com a lista de tonalidades.
 */
export function useTonalidades() {
  return useQuery({
    queryKey: ["tonalidades"],
    queryFn: getTonalidades,
  });
}

/**
 * Hook para buscar a lista de funções.
 *
 * @returns Resultado do useQuery com a lista de funções.
 */
export function useFuncoes() {
  return useQuery({
    queryKey: ["funcoes"],
    queryFn: getFuncoes,
  });
}

/**
 * Hook para buscar a lista de tipos de eventos.
 *
 * @returns Resultado do useQuery com a lista de tipos de eventos.
 */
export function useTiposEventos() {
  return useQuery({
    queryKey: ["tipos-eventos"],
    queryFn: getTiposEventos,
  });
}
