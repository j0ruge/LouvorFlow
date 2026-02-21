/**
 * Serviço de artistas — chamadas à API REST.
 *
 * Funções para listar, buscar por id, criar, atualizar e excluir artistas,
 * com parsing Zod para garantir conformidade com o contrato.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { ArtistaSchema, ArtistaResponseSchema } from "@/schemas/artista";
import type {
  Artista,
  ArtistaResponse,
  CreateArtistaForm,
  UpdateArtistaForm,
} from "@/schemas/artista";

/**
 * Busca todos os artistas cadastrados.
 *
 * @returns Lista de artistas parseados pelo schema Zod.
 */
export async function getArtistas(): Promise<Artista[]> {
  const data = await apiFetch<unknown[]>("/artistas");
  return z.array(ArtistaSchema).parse(data);
}

/**
 * Busca um artista específico pelo id.
 *
 * @param id - UUID do artista.
 * @returns Artista parseado pelo schema Zod.
 */
export async function getArtista(id: string): Promise<Artista> {
  const data = await apiFetch<unknown>(`/artistas/${id}`);
  return ArtistaSchema.parse(data);
}

/**
 * Cria um novo artista.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem e artista criado.
 */
export async function createArtista(
  dados: CreateArtistaForm,
): Promise<ArtistaResponse> {
  const data = await apiFetch<unknown>("/artistas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return ArtistaResponseSchema.parse(data);
}

/**
 * Atualiza o nome de um artista existente.
 *
 * @param id - UUID do artista.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem e artista atualizado.
 */
export async function updateArtista(
  id: string,
  dados: UpdateArtistaForm,
): Promise<ArtistaResponse> {
  const data = await apiFetch<unknown>(`/artistas/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return ArtistaResponseSchema.parse(data);
}

/**
 * Remove um artista pelo id.
 *
 * @param id - UUID do artista a ser removido.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteArtista(id: string): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/artistas/${id}`, {
    method: "DELETE",
  });
  return z.object({ msg: z.string() }).parse(data);
}
