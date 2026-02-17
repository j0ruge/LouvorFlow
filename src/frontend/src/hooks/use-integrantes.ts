/**
 * Hooks React Query para o módulo de integrantes.
 *
 * Encapsula listagem e busca individual com `useQuery`,
 * e criação/atualização com `useMutation`,
 * incluindo invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getIntegrantes,
  getIntegrante,
  createIntegrante,
  updateIntegrante,
  deleteIntegrante,
} from "@/services/integrantes";
import type { CreateIntegranteForm, UpdateIntegranteForm } from "@/schemas/integrante";

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
 * Hook para buscar um integrante específico pelo id.
 *
 * @param id - UUID do integrante ou `null` para desabilitar a query.
 * @returns Resultado do useQuery com os dados do integrante.
 */
export function useIntegrante(id: string | null) {
  return useQuery({
    queryKey: ["integrantes", id],
    queryFn: () => getIntegrante(id!),
    enabled: !!id,
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

/**
 * Hook para atualizar um integrante existente via mutation.
 *
 * Invalida as queries de listagem e do integrante específico,
 * e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para atualização de integrante.
 */
export function useUpdateIntegrante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateIntegranteForm }) =>
      updateIntegrante(id, dados),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["integrantes"] });
      queryClient.invalidateQueries({ queryKey: ["integrantes", id] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir um integrante via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para exclusão de integrante.
 */
export function useDeleteIntegrante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteIntegrante(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrantes"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
