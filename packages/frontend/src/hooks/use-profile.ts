/**
 * Hooks React Query para o módulo de perfil do usuário.
 *
 * Encapsula a busca do perfil com `useQuery` e a atualização
 * com `useMutation`, incluindo invalidação de cache, atualização
 * do contexto de autenticação e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/services/auth";
import { useAuth } from "@/hooks/use-auth";
import type { UpdateProfileForm } from "@/schemas/auth";

/**
 * Hook para buscar os dados do perfil do usuário autenticado.
 *
 * @returns Resultado do useQuery com os dados do perfil.
 */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}

/**
 * Hook para atualizar o perfil do usuário autenticado via mutation.
 *
 * Invalida a query de perfil, atualiza o contexto de autenticação
 * e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para atualização de perfil.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (dados: UpdateProfileForm) => updateProfile(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUser(data);
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
