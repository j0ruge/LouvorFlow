/**
 * Serviço de eventos (escalas) — chamadas à API REST.
 *
 * Funções para listar, buscar por id, criar eventos e gerenciar
 * associações de músicas e integrantes a um evento.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import {
  EventoIndexSchema,
  EventoShowSchema,
  EventoCreateResponseSchema,
  EventoUpdateResponseSchema,
} from "@/schemas/evento";
import { CrudResponseSchema, type CrudResponse } from "@/schemas/shared";
import type {
  EventoIndex,
  EventoShow,
  EventoCreateResponse,
  EventoUpdateResponse,
  CreateEventoForm,
  UpdateEventoForm,
} from "@/schemas/evento";

/** Schema de resposta para endpoints de associação/desassociação. */
const AssociationResponseSchema = z.object({
  msg: z.string(),
});

/** Tipo inferido da resposta de associação. */
type AssociationResponse = z.infer<typeof AssociationResponseSchema>;

/**
 * Busca todos os eventos com resumo de músicas e integrantes.
 *
 * @returns Lista de eventos parseados pelo schema Zod.
 */
export async function getEventos(): Promise<EventoIndex[]> {
  const data = await apiFetch<unknown[]>("/eventos");
  return z.array(EventoIndexSchema).parse(data);
}

/**
 * Busca o detalhe completo de um evento.
 *
 * @param id - UUID do evento.
 * @returns Evento com detalhes completos parseado pelo schema Zod.
 */
export async function getEvento(id: string): Promise<EventoShow> {
  const data = await apiFetch<unknown>(`/eventos/${id}`);
  return EventoShowSchema.parse(data);
}

/**
 * Cria um novo evento.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem e evento criado.
 */
export async function createEvento(
  dados: CreateEventoForm,
): Promise<EventoCreateResponse> {
  const data = await apiFetch<unknown>("/eventos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return EventoCreateResponseSchema.parse(data);
}

/**
 * Atualiza um evento existente.
 *
 * @param id - UUID do evento.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem e evento atualizado.
 */
export async function updateEvento(
  id: string,
  dados: UpdateEventoForm,
): Promise<EventoUpdateResponse> {
  const data = await apiFetch<unknown>(`/eventos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return EventoUpdateResponseSchema.parse(data);
}

/**
 * Duplica uma escala existente: cria um novo evento copiando da origem o
 * repertório (ordem, versões e tons) e a equipe.
 *
 * `fk_tipo_evento` e `descricao` são opcionais no backend (omitidos, herdam
 * da origem); a cópia nasce sempre com status `publicada`.
 *
 * @param id - UUID do evento de origem.
 * @param dados - Dados da cópia (`data` obrigatória; tipo/descrição opcionais).
 * @returns Resposta da API com mensagem e o evento criado.
 */
export async function duplicarEvento(
  id: string,
  dados: CreateEventoForm,
): Promise<EventoCreateResponse> {
  const data = await apiFetch<unknown>(`/eventos/${id}/duplicar`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return EventoCreateResponseSchema.parse(data);
}

/**
 * Remove um evento pelo id.
 *
 * @param id - UUID do evento a ser removido.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteEvento(id: string): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/eventos/${id}`, {
    method: "DELETE",
  });
  return CrudResponseSchema.parse(data);
}

/** Schema de resposta da playlist CifraClub. */
const CifraclubPlaylistItemSchema = z.object({
  ordem: z.number(),
  musica_id: z.string(),
  nome: z.string(),
  tom: z.string().nullable(),
  tom_final: z.string().nullable(),
  tom_ajustado: z.boolean(),
  artista_nome: z.string(),
  /** URL da cifra no CifraClub com fragmento #key=N aplicado. */
  cifraclub_url: z.string().refine(
    (val) => val === "" || /^https?:\/\//i.test(val),
    "URL deve usar protocolo http ou https",
  ).nullable(),
});

/** Schema de resposta do endpoint de playlist CifraClub. */
const CifraclubPlaylistResponseSchema = z.object({
  evento: z.object({
    id: z.string(),
    data: z.string(),
    descricao: z.string(),
    tipo_evento: z.string(),
  }),
  playlist: z.array(CifraclubPlaylistItemSchema),
  stats: z.object({
    total: z.number(),
    com_link: z.number(),
    sem_link: z.number(),
  }),
});

/** Tipo inferido da resposta da playlist CifraClub. */
export type CifraclubPlaylistResponse = z.infer<typeof CifraclubPlaylistResponseSchema>;

/**
 * Busca a playlist CifraClub de um evento com URLs enriquecidas (#key=N).
 *
 * @param eventoId - UUID do evento.
 * @returns Playlist ordenada com stats e URL de lista do evento.
 */
export async function getCifraclubPlaylist(
  eventoId: string,
): Promise<CifraclubPlaylistResponse> {
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/cifraclub-playlist`);
  return CifraclubPlaylistResponseSchema.parse(data);
}

/**
 * Associa uma música a um evento.
 *
 * @param eventoId - UUID do evento.
 * @param musicaId - UUID da música a associar.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function addMusicaToEvento(
  eventoId: string,
  musicaId: string,
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/musicas`, {
    method: "POST",
    body: JSON.stringify({ musicas_id: musicaId }),
  });
  return AssociationResponseSchema.parse(data);
}

/**
 * Remove a associação de uma música de um evento.
 *
 * @param eventoId - UUID do evento.
 * @param musicaId - UUID da música a remover.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function removeMusicaFromEvento(
  eventoId: string,
  musicaId: string,
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/musicas/${musicaId}`, {
    method: "DELETE",
  });
  return AssociationResponseSchema.parse(data);
}

/**
 * Reordena as músicas de um evento conforme a ordem dos IDs recebidos.
 *
 * @param eventoId - UUID do evento.
 * @param musicasIds - Array de UUIDs das músicas na nova ordem desejada.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function reorderMusicas(
  eventoId: string,
  musicasIds: string[],
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/musicas/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ musicas_ids: musicasIds }),
  });
  return AssociationResponseSchema.parse(data);
}

/**
 * Define a versão selecionada de uma música em um evento (escala).
 *
 * @param eventoId - UUID do evento.
 * @param musicaId - UUID da música.
 * @param artistasMusicasId - UUID da versão (artistas_musicas) ou `null` para limpar.
 * @returns Resposta da API com mensagem (`AssociationResponse`).
 */
export async function setMusicaVersao(
  eventoId: string,
  musicaId: string,
  artistasMusicasId: string | null,
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/musicas/${musicaId}`, {
    method: "PATCH",
    body: JSON.stringify({ artistas_musicas_id: artistasMusicasId }),
  });
  return AssociationResponseSchema.parse(data);
}

/**
 * Define ou limpa o tom próprio (override) de uma música numa escala.
 *
 * @param eventoId - UUID do evento.
 * @param musicaId - UUID da música.
 * @param fkTonalidade - UUID da tonalidade desejada para esta escala, ou `null`
 * para remover o override e voltar ao tom global da música.
 * @returns Resposta da API com mensagem (`AssociationResponse`).
 */
export async function setMusicaTonalidade(
  eventoId: string,
  musicaId: string,
  fkTonalidade: string | null,
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(
    `/eventos/${eventoId}/musicas/${musicaId}/tonalidade`,
    {
      method: "PATCH",
      body: JSON.stringify({ fk_tonalidade: fkTonalidade }),
    },
  );
  return AssociationResponseSchema.parse(data);
}

/**
 * Associa um integrante a um evento, opcionalmente selecionando funções específicas.
 *
 * @param eventoId - UUID do evento.
 * @param integranteId - UUID do integrante a associar.
 * @param funcaoIds - UUIDs das funções selecionadas (opcional — usa todas se omitido).
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function addIntegranteToEvento(
  eventoId: string,
  integranteId: string,
  funcaoIds?: string[],
): Promise<AssociationResponse> {
  const body: Record<string, unknown> = { fk_integrante_id: integranteId };
  if (funcaoIds !== undefined) body.funcao_ids = funcaoIds;
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/integrantes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return AssociationResponseSchema.parse(data);
}

/**
 * Remove a associação de um integrante de um evento.
 *
 * @param eventoId - UUID do evento.
 * @param integranteId - UUID do integrante a remover.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function removeIntegranteFromEvento(
  eventoId: string,
  integranteId: string,
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(
    `/eventos/${eventoId}/integrantes/${integranteId}`,
    { method: "DELETE" },
  );
  return AssociationResponseSchema.parse(data);
}
