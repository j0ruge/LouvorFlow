/**
 * Hooks React Query para o módulo de convites.
 *
 * Encapsula geração, listagem e revogação com `useMutation`/`useQuery`,
 * e validação e aceitação para a tela pública de convite.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInvite,
  getInvites,
  revokeInvite,
  validateInvite,
  acceptInvite,
} from "@/services/convites";
import type { AcceptInviteData } from "@/services/convites";

/**
 * Hook para gerar um novo convite via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para geração de convite.
 */
export function useCreateConvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para listar os convites do tenant do líder.
 *
 * @returns Resultado do useQuery com a lista de convites.
 */
export function useConvites() {
  return useQuery({
    queryKey: ["convites"],
    queryFn: getInvites,
  });
}

/**
 * Hook para revogar um convite ativo via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para revogação.
 */
export function useRevokeConvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeInvite(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["convites"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para validar um token de convite (rota pública).
 *
 * @param token - UUID do token de convite.
 * @returns Resultado do useQuery com dados de validação.
 */
export function useValidateInvite(token: string) {
  return useQuery({
    queryKey: ["convite-validate", token],
    queryFn: () => validateInvite(token),
    enabled: !!token,
    retry: false,
  });
}

/**
 * Hook para aceitar um convite via mutation (rota pública).
 *
 * @returns Resultado do useMutation para aceitação.
 */
export function useAcceptInvite() {
  return useMutation({
    mutationFn: ({ token, body }: { token: string; body: AcceptInviteData }) =>
      acceptInvite(token, body),
  });
}
