/**
 * Hooks React Query para o módulo de músicas.
 *
 * Encapsula listagem paginada, busca individual, CRUD completo,
 * e gerenciamento de versões, categorias e funções com invalidação
 * de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMusicas,
  getMusica,
  createMusica,
  updateMusica,
  deleteMusica,
  addVersao,
  updateVersao,
  removeVersao,
  addCategoriaMusica,
  removeCategoriaMusica,
  addFuncaoMusica,
  removeFuncaoMusica,
} from "@/services/musicas";
import type { CreateMusicaForm, UpdateMusicaForm, CreateVersaoForm, UpdateVersaoForm } from "@/schemas/musica";

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
 * Hook para buscar uma música específica pelo id.
 *
 * @param id - UUID da música ou `null` para desabilitar a query.
 * @returns Resultado do useQuery com os dados da música.
 */
export function useMusica(id: string | null) {
  return useQuery({
    queryKey: ["musica", id],
    queryFn: () => getMusica(id!),
    enabled: !!id,
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

/**
 * Hook para atualizar uma música existente via mutation.
 *
 * Invalida as queries de listagem e do detalhe da música.
 *
 * @returns Resultado do useMutation para atualização de música.
 */
export function useUpdateMusica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateMusicaForm }) =>
      updateMusica(id, dados),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["musicas"] });
      queryClient.invalidateQueries({ queryKey: ["musica", id] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir uma música via mutation.
 *
 * Invalida a query de listagem e remove a query do detalhe.
 *
 * @returns Resultado do useMutation para exclusão de música.
 */
export function useDeleteMusica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMusica(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["musicas"] });
      queryClient.removeQueries({ queryKey: ["musica", id] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/* ========== Versões ========== */

/**
 * Hook para adicionar uma versão a uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para adição de versão.
 */
export function useAddVersao(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateVersaoForm) => addVersao(musicaId, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar uma versão de uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para atualização de versão.
 */
export function useUpdateVersao(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ versaoId, dados }: { versaoId: string; dados: UpdateVersaoForm }) =>
      updateVersao(musicaId, versaoId, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para remover uma versão de uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para remoção de versão.
 */
export function useRemoveVersao(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versaoId: string) => removeVersao(musicaId, versaoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/* ========== Categorias ========== */

/**
 * Hook para adicionar uma categoria a uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para adição de categoria.
 */
export function useAddCategoriaMusica(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoriaId: string) => addCategoriaMusica(musicaId, categoriaId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para remover uma categoria de uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para remoção de categoria.
 */
export function useRemoveCategoriaMusica(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoriaId: string) => removeCategoriaMusica(musicaId, categoriaId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/* ========== Funções ========== */

/**
 * Hook para adicionar uma função requerida a uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para adição de função.
 */
export function useAddFuncaoMusica(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (funcaoId: string) => addFuncaoMusica(musicaId, funcaoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para remover uma função requerida de uma música via mutation.
 *
 * @param musicaId - UUID da música para invalidação de cache.
 * @returns Resultado do useMutation para remoção de função.
 */
export function useRemoveFuncaoMusica(musicaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (funcaoId: string) => removeFuncaoMusica(musicaId, funcaoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musica", musicaId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
