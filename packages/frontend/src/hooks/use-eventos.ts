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
  updateEvento,
  duplicarEvento,
  deleteEvento,
  addMusicaToEvento,
  removeMusicaFromEvento,
  reorderMusicas,
  setMusicaVersao,
  setMusicaTonalidade,
  addIntegranteToEvento,
  removeIntegranteFromEvento,
  getCifraclubPlaylist,
} from "@/services/eventos";
import type { CreateEventoForm, UpdateEventoForm, EventoShow } from "@/schemas/evento";

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
 * Hook para buscar a playlist CifraClub de um evento.
 *
 * O parâmetro `enabled` permite carregamento preguiçoso: o consumidor deve passar
 * `false` enquanto o diálogo está fechado para evitar uma requisição em toda
 * visualização do detalhe do evento (a busca só dispara quando o diálogo abre).
 *
 * @param eventoId - UUID do evento.
 * @param enabled - Se a query deve ser executada (padrão: true).
 * @returns Resultado do useQuery com a playlist CifraClub.
 */
export function useCifraclubPlaylist(eventoId: string, enabled = true) {
  return useQuery({
    queryKey: ["eventos", eventoId, "cifraclub-playlist"],
    queryFn: () => getCifraclubPlaylist(eventoId),
    enabled: !!eventoId && enabled,
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
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para duplicar uma escala existente via mutation.
 *
 * Invalida a listagem de eventos e os relatórios (mesmo padrão de
 * `useCreateEvento` — a cópia nasce `publicada` e entra nas contagens) e
 * exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para duplicação de escala.
 */
export function useDuplicarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Executa o POST de duplicação da escala.
     *
     * @param args - Objeto com `id` da escala de origem e `dados` da cópia.
     * @returns Promise com a resposta da API (`EventoCreateResponse`).
     */
    mutationFn: ({ id, dados }: { id: string; dados: CreateEventoForm }) =>
      duplicarEvento(id, dados),
    /**
     * Callback de sucesso: invalida listagem e relatórios e exibe toast.
     *
     * @param data - Resposta da API com mensagem e evento criado.
     */
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success(data.msg);
    },
    /**
     * Callback de erro: exibe toast com a mensagem do erro.
     *
     * @param error - Erro lançado pelo `mutationFn`.
     */
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar um evento existente via mutation.
 *
 * Invalida as queries de listagem e do detalhe do evento.
 *
 * @returns Resultado do useMutation para atualização de evento.
 */
export function useUpdateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UpdateEventoForm }) =>
      updateEvento(id, dados),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos", id] });
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir um evento via mutation.
 *
 * Invalida a query de listagem e remove a query do detalhe. Com
 * `options.silent`, o toast de sucesso é suprimido — usado pelo fluxo de
 * exclusão com desfazer (`useUndoableDelete`), em que o feedback é o toast
 * com a ação "Desfazer" e um segundo toast aqui duplicaria o aviso. O toast
 * de erro permanece em ambos os modos.
 *
 * @param options - `silent` suprime o toast de sucesso (padrão: false).
 * @returns Resultado do useMutation para exclusão de evento.
 */
export function useDeleteEvento(options?: { silent?: boolean }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvento(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.removeQueries({ queryKey: ["eventos", id] });
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
      if (!options?.silent) {
        toast.success(data.msg);
      }
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
      queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
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
      queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para reordenar as músicas de um evento com optimistic UI.
 *
 * Atualiza o cache imediatamente após o drop, salva em background,
 * e reverte com toast de erro em caso de falha.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para reordenação de músicas.
 */
export function useReorderMusicas(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (musicasIds: string[]) => reorderMusicas(eventoId, musicasIds),
    onMutate: async (musicasIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["eventos", eventoId] });

      const previousData = queryClient.getQueryData<EventoShow>(["eventos", eventoId]);

      if (previousData) {
        const reorderedMusicas = musicasIds
          .map((id, index) => {
            const musica = previousData.musicas.find(m => m.id === id);
            return musica ? { ...musica, ordem: index + 1 } : null;
          })
          .filter(Boolean);

        queryClient.setQueryData<EventoShow>(["eventos", eventoId], {
          ...previousData,
          musicas: reorderedMusicas as EventoShow["musicas"],
        });
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["eventos", eventoId], context.previousData);
      }
      toast.error("Erro ao reordenar músicas. A ordem anterior foi restaurada.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
    },
  });
}

/**
 * Hook para definir a versão selecionada de uma música em um evento.
 *
 * Invalida apenas a query de detalhe do evento — a listagem (`EVENTO_INDEX_SELECT`)
 * não expõe versão e não precisa ser refetchada. O parâmetro `silent` suprime o toast
 * de sucesso em cenários de auto-seleção (ex.: música com uma única versão), atendendo
 * ao requisito do PRD "no UI noise".
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para seleção de versão.
 */
export function useSetMusicaVersao(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Executa a chamada PATCH para atualizar a versão selecionada da música.
     *
     * @param args - Objeto com `musicaId`, `artistasMusicasId` e flag `silent` opcional.
     * @returns Promise com a resposta da API (`AssociationResponse`).
     */
    mutationFn: ({
      musicaId,
      artistasMusicasId,
    }: {
      musicaId: string;
      artistasMusicasId: string | null;
      silent?: boolean;
    }) => setMusicaVersao(eventoId, musicaId, artistasMusicasId),
    /**
     * Callback de sucesso: invalida o cache do detalhe do evento e dispara toast
     * de sucesso quando `variables.silent` é falso.
     *
     * @param data - Resposta da API (`AssociationResponse`).
     * @param variables - Variáveis enviadas à mutation (inclui `silent`).
     */
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      if (!variables.silent) {
        toast.success(data.msg);
      }
    },
    /**
     * Callback de erro: exibe toast com a mensagem do erro.
     *
     * @param error - Erro lançado pelo `mutationFn`.
     */
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para definir o tom próprio (override) de uma música numa escala.
 *
 * Invalida o detalhe do evento e a playlist CifraClub — a playlist embute o
 * tom efetivo no fragmento `#key=N` da URL de cada cifra, então sem essa
 * segunda invalidação o `CifraclubPlaylistDialog` mostraria a transposição do
 * tom antigo até a query expirar por conta própria. **Nota de oportunidade**:
 * `useSetMusicaVersao` (acima) tem a mesma lacuna — a versão selecionada
 * também afeta a playlist (`link_versao`/cifra) e não invalida essa query.
 * Registrado aqui de propósito; não corrigido porque está fora do escopo
 * desta fase (tom por evento) e não foi pedido.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para definição de tom.
 */
export function useSetMusicaTonalidade(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Executa a chamada PATCH para atualizar o tom da música nesta escala.
     *
     * @param args - Objeto com `musicaId` e `fkTonalidade` (UUID ou null).
     * @returns Promise com a resposta da API (`AssociationResponse`).
     */
    mutationFn: ({
      musicaId,
      fkTonalidade,
    }: {
      musicaId: string;
      fkTonalidade: string | null;
    }) => setMusicaTonalidade(eventoId, musicaId, fkTonalidade),
    /**
     * Callback de sucesso: invalida o detalhe do evento e a playlist CifraClub,
     * e dispara toast de sucesso.
     *
     * @param data - Resposta da API (`AssociationResponse`).
     */
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      queryClient.invalidateQueries({
        queryKey: ["eventos", eventoId, "cifraclub-playlist"],
      });
      toast.success(data.msg);
    },
    /**
     * Callback de erro: exibe toast com a mensagem do erro.
     *
     * @param error - Erro lançado pelo `mutationFn`.
     */
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para associar um integrante a um evento, com funções opcionais.
 *
 * @param eventoId - UUID do evento para invalidação de cache.
 * @returns Resultado do useMutation para associação de integrante.
 */
export function useAddIntegranteToEvento(eventoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      integranteId,
      funcaoIds,
    }: {
      integranteId: string;
      funcaoIds?: string[];
    }) => addIntegranteToEvento(eventoId, integranteId, funcaoIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
      queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
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
      queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
      toast.success(data.msg);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
