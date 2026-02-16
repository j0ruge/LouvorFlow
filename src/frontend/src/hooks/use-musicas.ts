/**
 * Hooks React Query para o módulo de músicas.
 *
 * Encapsula listagem paginada com `useQuery` e criação com `useMutation`,
 * incluindo invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMusicas, createMusica } from "@/services/musicas";
import type { CreateMusicaForm } from "@/schemas/musica";

/**
 * Hook para buscar músicas com paginação.
 *
 * @param page - Número da página atual.
 * @param limit - Quantidade de itens por página.
 * @returns Resultado do useQuery com a resposta paginada de músicas.
 */
export function useMusicas(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["musicas", page, limit],
    queryFn: () => getMusicas(page, limit),
  });
}

/**
 * Hook para criar uma nova música via mutation.
 *
 * Invalida todas as queries de músicas e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de música.
 */
export function useCreateMusica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateMusicaForm) => createMusica(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musicas"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
