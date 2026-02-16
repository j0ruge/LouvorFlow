/**
 * Serviço de músicas — chamadas à API REST.
 *
 * Funções para listar (paginado), buscar por id e criar músicas,
 * com parsing Zod para garantir conformidade com o contrato.
 */

import { apiFetch } from "@/lib/api";
import {
  MusicasPaginadasSchema,
  MusicaSchema,
  MusicaCreateResponseSchema,
} from "@/schemas/musica";
import type {
  MusicasPaginadas,
  Musica,
  MusicaCreateResponse,
  CreateMusicaForm,
} from "@/schemas/musica";

/**
 * Busca músicas com paginação.
 *
 * @param page - Número da página (default: 1).
 * @param limit - Quantidade por página (default: 20).
 * @returns Resposta paginada de músicas parseada pelo schema Zod.
 */
export async function getMusicas(
  page = 1,
  limit = 20,
): Promise<MusicasPaginadas> {
  const data = await apiFetch<unknown>(
    `/musicas?page=${page}&limit=${limit}`,
  );
  return MusicasPaginadasSchema.parse(data);
}

/**
 * Busca uma música específica pelo id.
 *
 * @param id - UUID da música.
 * @returns Música parseada pelo schema Zod.
 */
export async function getMusica(id: string): Promise<Musica> {
  const data = await apiFetch<unknown>(`/musicas/${id}`);
  return MusicaSchema.parse(data);
}

/**
 * Cria uma nova música.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem e música criada.
 */
export async function createMusica(
  dados: CreateMusicaForm,
): Promise<MusicaCreateResponse> {
  const data = await apiFetch<unknown>("/musicas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return MusicaCreateResponseSchema.parse(data);
}
