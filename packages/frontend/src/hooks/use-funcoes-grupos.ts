/**
 * Hooks React Query dos grupos de funções.
 *
 * A query `["funcoes-grupos"]` alimenta tanto a aba de configuração quanto
 * a montagem da mensagem de compartilhamento da escala.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFuncoesGrupos,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  reorderGrupos,
  setGrupoFuncoes,
} from "@/services/funcoes-grupos";
import type {
  GrupoFuncoes,
  CreateGrupoForm,
  UpdateGrupoForm,
} from "@/schemas/funcoes-grupos";

/**
 * Hook para buscar os grupos de funções na ordem de exibição.
 *
 * @returns Resultado do useQuery com a lista de grupos.
 */
export function useFuncoesGrupos() {
  return useQuery({
    queryKey: ["funcoes-grupos"],
    queryFn: getFuncoesGrupos,
  });
}

/**
 * Hook para criar um grupo via mutation.
 *
 * @returns Resultado do useMutation para criação de grupo.
 */
export function useCreateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CreateGrupoForm) => createGrupo(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes-grupos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para renomear um grupo via mutation.
 *
 * @returns Resultado do useMutation para atualização de grupo.
 */
export function useUpdateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateGrupoForm }) =>
      updateGrupo(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes-grupos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir um grupo via mutation.
 *
 * Invalida `["funcoes-grupos"]` e também `["funcoes"]` — a exclusão desvincula
 * as funções que pertenciam ao grupo, então a lista de funções fica desatualizada.
 *
 * @returns Resultado do useMutation para exclusão de grupo.
 */
export function useDeleteGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrupo(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["funcoes"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para definir as funções de um grupo via mutation.
 *
 * @returns Resultado do useMutation para atribuição de funções.
 */
export function useSetGrupoFuncoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, funcoesIds }: { id: string; funcoesIds: string[] }) =>
      setGrupoFuncoes(id, funcoesIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes-grupos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para reordenar os grupos com optimistic UI.
 *
 * Atualiza o cache imediatamente após o drop, salva em background e
 * reverte com toast de erro em caso de falha.
 *
 * @returns Resultado do useMutation para reordenação de grupos.
 */
export function useReorderGrupos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gruposIds: string[]) => reorderGrupos(gruposIds),
    onMutate: async (gruposIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["funcoes-grupos"] });

      const previousData = queryClient.getQueryData<GrupoFuncoes[]>(["funcoes-grupos"]);

      if (previousData) {
        const reordered = gruposIds
          .map((id, index) => {
            const grupo = previousData.find(g => g.id === id);
            return grupo ? { ...grupo, ordem: index + 1 } : null;
          })
          .filter(Boolean) as GrupoFuncoes[];

        queryClient.setQueryData<GrupoFuncoes[]>(["funcoes-grupos"], reordered);
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["funcoes-grupos"], context.previousData);
      }
      toast.error("Erro ao reordenar grupos. A ordem anterior foi restaurada.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["funcoes-grupos"] });
    },
  });
}
