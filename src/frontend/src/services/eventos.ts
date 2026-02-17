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
} from "@/schemas/evento";
import type {
  EventoIndex,
  EventoShow,
  EventoCreateResponse,
  CreateEventoForm,
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
 * Associa um integrante a um evento.
 *
 * @param eventoId - UUID do evento.
 * @param integranteId - UUID do integrante a associar.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function addIntegranteToEvento(
  eventoId: string,
  integranteId: string,
): Promise<AssociationResponse> {
  const data = await apiFetch<unknown>(`/eventos/${eventoId}/integrantes`, {
    method: "POST",
    body: JSON.stringify({ fk_integrante_id: integranteId }),
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
