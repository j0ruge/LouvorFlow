/**
 * Hooks React Query para o módulo de igrejas (tenants).
 *
 * Encapsula listagem, criação, atualização e desativação de igrejas,
 * bem como o gerenciamento de usuários vinculados a cada tenant,
 * com invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listIgrejas,
  getIgreja,
  createIgreja,
  updateIgreja,
  deactivateIgreja,
  listIgrejaUsers,
  addUserToIgreja,
  removeUserFromIgreja,
} from "@/services/igrejas";
import type { UpdateIgrejaForm } from "@/schemas/auth";

/**
 * Hook para buscar a lista de todas as igrejas cadastradas.
 *
 * @returns Resultado do useQuery com a lista de igrejas.
 */
export function useIgrejas() {
  return useQuery({
    queryKey: ["admin", "igrejas"],
    queryFn: listIgrejas,
  });
}

/**
 * Hook para buscar os dados de uma igreja específica.
 *
 * A query é desabilitada automaticamente quando `id` é falsy.
 *
 * @param id - UUID da igreja ou string vazia/undefined para desabilitar.
 * @returns Resultado do useQuery com os dados da igreja.
 */
export function useIgreja(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "igrejas", id],
    queryFn: () => getIgreja(id!),
    enabled: !!id,
  });
}

/**
 * Hook para criar uma nova igreja via mutation.
 *
 * Invalida a query de listagem de igrejas e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de igreja.
 */
export function useCreateIgreja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) => createIgreja(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas"] });
      toast.success("Igreja criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar os dados de uma igreja via mutation.
 *
 * Invalida as queries de listagem e detalhe da igreja,
 * e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para atualização de igreja.
 */
export function useUpdateIgreja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIgrejaForm }) =>
      updateIgreja(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas", id] });
      toast.success("Igreja atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para desativar uma igreja via mutation.
 *
 * Invalida a query de listagem de igrejas e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para desativação de igreja.
 */
export function useDeactivateIgreja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateIgreja(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas"] });
      toast.success("Igreja desativada");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para buscar a lista de usuários vinculados a uma igreja.
 *
 * A query é desabilitada automaticamente quando `id` é falsy.
 *
 * @param id - UUID da igreja ou string vazia/undefined para desabilitar.
 * @returns Resultado do useQuery com a lista de usuários da igreja.
 */
export function useIgrejaUsers(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "igrejas", id, "users"],
    queryFn: () => listIgrejaUsers(id!),
    enabled: !!id,
  });
}

/**
 * Hook para vincular um usuário a uma igreja via mutation.
 *
 * Invalida a query de usuários da igreja e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para vinculação de usuário.
 */
export function useAddUserToIgreja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ igrejaId, userId }: { igrejaId: string; userId: string }) =>
      addUserToIgreja(igrejaId, userId),
    onSuccess: (_result, { igrejaId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas", igrejaId, "users"] });
      /** Invalida também a lista de igrejas para atualizar a contagem de membros. */
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas"], exact: true });
      toast.success("Usuário vinculado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para desvincular um usuário de uma igreja via mutation.
 *
 * Invalida a query de usuários da igreja e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para desvinculação de usuário.
 */
export function useRemoveUserFromIgreja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ igrejaId, userId }: { igrejaId: string; userId: string }) =>
      removeUserFromIgreja(igrejaId, userId),
    onSuccess: (_result, { igrejaId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas", igrejaId, "users"] });
      /** Invalida também a lista de igrejas para atualizar a contagem de membros. */
      queryClient.invalidateQueries({ queryKey: ["admin", "igrejas"], exact: true });
      toast.success("Usuário desvinculado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
