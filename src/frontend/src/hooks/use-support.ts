/**
 * Hooks React Query para dados de suporte (lookup lists) e CRUD de entidades auxiliares.
 *
 * Encapsula as chamadas de serviço para tonalidades, funções, tipos
 * de eventos e tags com caching automático via React Query, além de
 * mutations CRUD com invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTonalidades,
  getFuncoes,
  getTiposEventos,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  createFuncao,
  updateFuncao,
  deleteFuncao,
  createTonalidade,
  updateTonalidade,
  deleteTonalidade,
  createTipoEvento,
  updateTipoEvento,
  deleteTipoEvento,
} from "@/services/support";
import type {
  CreateTagForm,
  UpdateTagForm,
  CreateFuncaoForm,
  UpdateFuncaoForm,
  CreateTonalidade,
  UpdateTonalidade,
  CreateTipoEvento,
  UpdateTipoEvento,
} from "@/schemas/shared";

/* ========== Queries ========== */

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

/**
 * Hook para buscar a lista de tags.
 *
 * @returns Resultado do useQuery com a lista de tags.
 */
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });
}

/* ========== Tags Mutations ========== */

/**
 * Hook para criar uma nova tag via mutation.
 *
 * @returns Resultado do useMutation para criação de tag.
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CreateTagForm) => createTag(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar uma tag existente via mutation.
 *
 * @returns Resultado do useMutation para atualização de tag.
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateTagForm }) =>
      updateTag(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir uma tag via mutation.
 *
 * @returns Resultado do useMutation para exclusão de tag.
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/* ========== Funções Mutations ========== */

/**
 * Hook para criar uma nova função via mutation.
 *
 * @returns Resultado do useMutation para criação de função.
 */
export function useCreateFuncao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CreateFuncaoForm) => createFuncao(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar uma função existente via mutation.
 *
 * @returns Resultado do useMutation para atualização de função.
 */
export function useUpdateFuncao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateFuncaoForm }) =>
      updateFuncao(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir uma função via mutation.
 *
 * @returns Resultado do useMutation para exclusão de função.
 */
export function useDeleteFuncao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFuncao(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcoes"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/* ========== Tonalidades Mutations ========== */

/**
 * Hook para criar uma nova tonalidade via mutation.
 *
 * @returns Resultado do useMutation para criação de tonalidade.
 */
export function useCreateTonalidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CreateTonalidade) => createTonalidade(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tonalidades"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar uma tonalidade existente via mutation.
 *
 * @returns Resultado do useMutation para atualização de tonalidade.
 */
export function useUpdateTonalidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateTonalidade }) =>
      updateTonalidade(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tonalidades"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir uma tonalidade via mutation.
 *
 * @returns Resultado do useMutation para exclusão de tonalidade.
 */
export function useDeleteTonalidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTonalidade(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tonalidades"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/* ========== Tipos de Evento Mutations ========== */

/**
 * Hook para criar um novo tipo de evento via mutation.
 *
 * @returns Resultado do useMutation para criação de tipo de evento.
 */
export function useCreateTipoEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CreateTipoEvento) => createTipoEvento(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tipos-eventos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar um tipo de evento existente via mutation.
 *
 * @returns Resultado do useMutation para atualização de tipo de evento.
 */
export function useUpdateTipoEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateTipoEvento }) =>
      updateTipoEvento(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tipos-eventos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir um tipo de evento via mutation.
 *
 * @returns Resultado do useMutation para exclusão de tipo de evento.
 */
export function useDeleteTipoEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTipoEvento(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tipos-eventos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
