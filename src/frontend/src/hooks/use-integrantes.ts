/**
 * Hooks React Query para o módulo de integrantes.
 *
 * Encapsula listagem com `useQuery` e criação com `useMutation`,
 * incluindo invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getIntegrantes, createIntegrante } from "@/services/integrantes";
import type { CreateIntegranteForm } from "@/schemas/integrante";

/**
 * Hook para buscar a lista de integrantes.
 *
 * @returns Resultado do useQuery com a lista de integrantes.
 */
export function useIntegrantes() {
  return useQuery({
    queryKey: ["integrantes"],
    queryFn: getIntegrantes,
  });
}

/**
 * Hook para criar um novo integrante via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de integrante.
 */
export function useCreateIntegrante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateIntegranteForm) => createIntegrante(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrantes"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
