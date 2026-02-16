/**
 * Hooks React Query para o módulo de eventos (escalas).
 *
 * Encapsula listagem, detalhe, criação e associações (músicas/integrantes)
 * com invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEventos,
  getEvento,
  createEvento,
  addMusicaToEvento,
  removeMusicaFromEvento,
  addIntegranteToEvento,
  removeIntegranteFromEvento,
} from "@/services/eventos";
import type { CreateEventoForm } from "@/schemas/evento";

/**
 * Hook para buscar a lista de eventos.
 *
 * @returns Resultado do useQuery com a lista de eventos.
 */
export function useEventos() {
  return useQuery({
    queryKey: ["eventos"],
    queryFn: getEventos,
  });
}

/**
 * Hook para buscar o detalhe completo de um evento.
 *
 * @param id - UUID do evento.
 * @returns Resultado do useQuery com o detalhe do evento.
 */
export function useEvento(id: string) {
  return useQuery({
    queryKey: ["eventos", id],
    queryFn: () => getEvento(id),
    enabled: !!id,
  });
}

/**
 * Hook para criar um novo evento via mutation.
 *
 * Invalida a query de listagem e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de evento.
 */
export function useCreateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateEventoForm) => createEvento(dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para associar uma música a um evento.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para associação de música.
 */
export function useAddMusicaToEvento(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (musicaId: string) => addMusicaToEvento(eventoId, musicaId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para remover a associação de uma música de um evento.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para remoção de associação de música.
 */
export function useRemoveMusicaFromEvento(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (musicaId: string) =>
      removeMusicaFromEvento(eventoId, musicaId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para associar um integrante a um evento.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para associação de integrante.
 */
export function useAddIntegranteToEvento(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (integranteId: string) =>
      addIntegranteToEvento(eventoId, integranteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para remover a associação de um integrante de um evento.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para remoção de associação de integrante.
 */
export function useRemoveIntegranteFromEvento(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (integranteId: string) =>
      removeIntegranteFromEvento(eventoId, integranteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
