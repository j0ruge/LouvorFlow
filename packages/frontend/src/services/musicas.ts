/**
 * Serviço de músicas — chamadas à API REST.
 *
 * Funções para listar (paginado), buscar por id, criar, atualizar e excluir músicas,
 * além de gerenciar versões, categorias e funções associadas, com parsing Zod
 * para garantir conformidade com o contrato.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { IdNomeSchema } from "@/schemas/shared";
import {
  MusicasPaginadasSchema,
  MusicaSchema,
  MusicaCreateResponseSchema,
  MusicaCompleteResponseSchema,
  VersaoSchema,
} from "@/schemas/musica";
import type {
  MusicasPaginadas,
  Musica,
  MusicaCreateResponse,
  MusicaCompleteResponse,
  CreateMusicaForm,
  UpdateMusicaForm,
  CreateMusicaCompleteForm,
  UpdateMusicaCompleteForm,
  CreateVersaoForm,
  UpdateVersaoForm,
  Versao,
} from "@/schemas/musica";
import type { IdNome } from "@/schemas/shared";

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

/**
 * Atualiza nome e/ou tonalidade de uma música.
 *
 * @param id - UUID da música.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem e música atualizada.
 */
export async function updateMusica(
  id: string,
  dados: UpdateMusicaForm,
): Promise<MusicaCreateResponse> {
  const data = await apiFetch<unknown>(`/musicas/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return MusicaCreateResponseSchema.parse(data);
}

/**
 * Remove uma música pelo id.
 *
 * @param id - UUID da música a ser removida.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteMusica(id: string): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/musicas/${id}`, {
    method: "DELETE",
  });
  return z.object({ msg: z.string() }).parse(data);
}

/* ========== Complete (música + versão atômica) ========== */

/**
 * Limpa strings vazias de um objeto, convertendo-as em `undefined`.
 *
 * @param obj - Objeto com possíveis strings vazias.
 * @returns Novo objeto com strings vazias substituídas por `undefined`.
 */
function cleanEmptyStrings(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    cleaned[key] = value === "" ? undefined : value;
  }
  return cleaned;
}

/**
 * Cria uma música com versão opcional de forma atômica.
 *
 * @param dados - Dados do formulário de criação completa.
 * @returns Resposta da API com mensagem e música completa.
 */
export async function createMusicaComplete(
  dados: CreateMusicaCompleteForm,
): Promise<MusicaCompleteResponse> {
  const payload = cleanEmptyStrings(dados as unknown as Record<string, unknown>);
  const data = await apiFetch<unknown>("/musicas/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return MusicaCompleteResponseSchema.parse(data);
}

/**
 * Atualiza uma música e opcionalmente sua versão de forma atômica.
 *
 * @param id - UUID da música.
 * @param dados - Dados do formulário de edição completa.
 * @returns Resposta da API com mensagem e música atualizada completa.
 */
export async function updateMusicaComplete(
  id: string,
  dados: UpdateMusicaCompleteForm,
): Promise<MusicaCompleteResponse> {
  const payload = cleanEmptyStrings(dados as unknown as Record<string, unknown>);
  const data = await apiFetch<unknown>(`/musicas/${id}/complete`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return MusicaCompleteResponseSchema.parse(data);
}

/* ========== Versões ========== */

/**
 * Retorna versões de uma música.
 *
 * @param musicaId - UUID da música.
 * @returns Lista de versões parseadas pelo schema Zod.
 */
export async function getVersoes(musicaId: string): Promise<Versao[]> {
  const data = await apiFetch<unknown[]>(`/musicas/${musicaId}/versoes`);
  return z.array(VersaoSchema).parse(data);
}

/**
 * Adiciona uma versão a uma música.
 *
 * @param musicaId - UUID da música.
 * @param dados - Dados do formulário de criação de versão.
 * @returns Resposta da API com mensagem e versão criada.
 */
export async function addVersao(
  musicaId: string,
  dados: CreateVersaoForm,
): Promise<{ msg: string; versao: Versao }> {
  const payload = {
    ...dados,
    bpm: dados.bpm === "" ? undefined : dados.bpm,
    link_versao: dados.link_versao === "" ? undefined : dados.link_versao,
  };
  const data = await apiFetch<unknown>(`/musicas/${musicaId}/versoes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return z.object({ msg: z.string(), versao: VersaoSchema }).parse(data);
}

/**
 * Atualiza uma versão de uma música.
 *
 * @param musicaId - UUID da música.
 * @param versaoId - UUID da versão.
 * @param dados - Dados do formulário de edição de versão.
 * @returns Resposta da API com mensagem e versão atualizada.
 */
export async function updateVersao(
  musicaId: string,
  versaoId: string,
  dados: UpdateVersaoForm,
): Promise<{ msg: string; versao: Versao }> {
  const payload = {
    ...dados,
    bpm: dados.bpm === "" ? undefined : dados.bpm,
    link_versao: dados.link_versao === "" ? undefined : dados.link_versao,
  };
  const data = await apiFetch<unknown>(
    `/musicas/${musicaId}/versoes/${versaoId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return z.object({ msg: z.string(), versao: VersaoSchema }).parse(data);
}

/**
 * Remove uma versão de uma música.
 *
 * @param musicaId - UUID da música.
 * @param versaoId - UUID da versão.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function removeVersao(
  musicaId: string,
  versaoId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(
    `/musicas/${musicaId}/versoes/${versaoId}`,
    { method: "DELETE" },
  );
  return z.object({ msg: z.string() }).parse(data);
}

/* ========== Categorias da Música ========== */

/**
 * Retorna categorias de uma música.
 *
 * @param musicaId - UUID da música.
 * @returns Lista de categorias parseadas pelo schema Zod.
 */
export async function getCategoriasMusica(musicaId: string): Promise<IdNome[]> {
  const data = await apiFetch<unknown[]>(`/musicas/${musicaId}/categorias`);
  return z.array(IdNomeSchema).parse(data);
}

/**
 * Adiciona uma categoria a uma música.
 *
 * @param musicaId - UUID da música.
 * @param categoriaId - UUID da categoria.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function addCategoriaMusica(
  musicaId: string,
  categoriaId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/musicas/${musicaId}/categorias`, {
    method: "POST",
    body: JSON.stringify({ categoria_id: categoriaId }),
  });
  return z.object({ msg: z.string() }).parse(data);
}

/**
 * Remove uma categoria de uma música.
 *
 * @param musicaId - UUID da música.
 * @param categoriaId - UUID da categoria.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function removeCategoriaMusica(
  musicaId: string,
  categoriaId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/musicas/${musicaId}/categorias/${categoriaId}`, {
    method: "DELETE",
  });
  return z.object({ msg: z.string() }).parse(data);
}

/* ========== Funções da Música ========== */

/**
 * Retorna funções requeridas de uma música.
 *
 * @param musicaId - UUID da música.
 * @returns Lista de funções parseadas pelo schema Zod.
 */
export async function getFuncoesMusica(musicaId: string): Promise<IdNome[]> {
  const data = await apiFetch<unknown[]>(`/musicas/${musicaId}/funcoes`);
  return z.array(IdNomeSchema).parse(data);
}

/**
 * Adiciona uma função requerida a uma música.
 *
 * @param musicaId - UUID da música.
 * @param funcaoId - UUID da função.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function addFuncaoMusica(
  musicaId: string,
  funcaoId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/musicas/${musicaId}/funcoes`, {
    method: "POST",
    body: JSON.stringify({ funcao_id: funcaoId }),
  });
  return z.object({ msg: z.string() }).parse(data);
}

/**
 * Remove uma função requerida de uma música.
 *
 * @param musicaId - UUID da música.
 * @param funcaoId - UUID da função.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function removeFuncaoMusica(
  musicaId: string,
  funcaoId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(
    `/musicas/${musicaId}/funcoes/${funcaoId}`,
    { method: "DELETE" },
  );
  return z.object({ msg: z.string() }).parse(data);
}
