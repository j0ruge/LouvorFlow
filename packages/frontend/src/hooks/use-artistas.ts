/**
 * Hooks React Query para o módulo de artistas.
 *
 * Encapsula listagem com `useQuery` e operações CRUD com `useMutation`,
 * incluindo invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getArtistas,
  createArtista,
  updateArtista,
  deleteArtista,
} from "@/services/artistas";
import type { CreateArtistaForm, UpdateArtistaForm } from "@/schemas/artista";

/**
 * Hook para buscar a lista de artistas.
 *
 * @returns Resultado do useQuery com a lista de artistas.
 */
export function useArtistas() {
  return useQuery({
    queryKey: ["artistas"],
    queryFn: getArtistas,
  });
}

/**
 * Hook para criar um novo artista via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de artista.
 */
export function useCreateArtista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateArtistaForm) => createArtista(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["artistas"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar um artista existente via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para atualização de artista.
 */
export function useUpdateArtista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateArtistaForm }) =>
      updateArtista(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["artistas"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir um artista via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para exclusão de artista.
 */
export function useDeleteArtista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteArtista(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["artistas"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
