/**
 * Serviço de dados de suporte (lookup lists) para formulários.
 *
 * Fornece funções para buscar tonalidades, funções e tipos de eventos
 * que populam selects e dropdowns nos formulários de criação.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { IdNomeSchema, TonalidadeSchema, CrudResponseSchema, TonalidadeCreateResponseSchema } from "@/schemas/shared";
import type {
  IdNome,
  Tonalidade,
  CrudResponse,
  TonalidadeCreateResponse,
  CreateCategoriaForm,
  UpdateCategoriaForm,
  CreateFuncaoForm,
  UpdateFuncaoForm,
  CreateTonalidade,
  UpdateTonalidade,
  CreateTipoEvento,
  UpdateTipoEvento,
} from "@/schemas/shared";

/**
 * Busca todas as tonalidades disponíveis.
 *
 * @returns Lista de tonalidades parseadas pelo schema Zod.
 */
export async function getTonalidades(): Promise<Tonalidade[]> {
  const data = await apiFetch<unknown[]>("/tonalidades");
  return z.array(TonalidadeSchema).parse(data);
}

/**
 * Busca todas as funções disponíveis (ex.: Vocal, Guitarra, Ministro).
 *
 * @returns Lista de funções parseadas pelo schema Zod.
 */
export async function getFuncoes(): Promise<IdNome[]> {
  const data = await apiFetch<unknown[]>("/funcoes");
  return z.array(IdNomeSchema).parse(data);
}

/**
 * Busca todos os tipos de eventos disponíveis (ex.: Culto, Ensaio).
 *
 * @returns Lista de tipos de eventos parseados pelo schema Zod.
 */
export async function getTiposEventos(): Promise<IdNome[]> {
  const data = await apiFetch<unknown[]>("/tipos-eventos");
  return z.array(IdNomeSchema).parse(data);
}

/**
 * Busca todas as categorias disponíveis.
 *
 * @returns Lista de categorias parseadas pelo schema Zod.
 */
export async function getCategorias(): Promise<IdNome[]> {
  const data = await apiFetch<unknown[]>("/categorias");
  return z.array(IdNomeSchema).parse(data);
}

/* ========== Categorias CRUD ========== */

/**
 * Cria uma nova categoria.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function createCategoria(dados: CreateCategoriaForm): Promise<CrudResponse> {
  const data = await apiFetch<unknown>("/categorias", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Atualiza uma categoria existente.
 *
 * @param id - UUID da categoria.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function updateCategoria(id: string, dados: UpdateCategoriaForm): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Exclui uma categoria pelo id.
 *
 * @param id - UUID da categoria a ser removida.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteCategoria(id: string): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/categorias/${id}`, { method: "DELETE" });
  return CrudResponseSchema.parse(data);
}

/* ========== Funções CRUD ========== */

/**
 * Cria uma nova função.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function createFuncao(dados: CreateFuncaoForm): Promise<CrudResponse> {
  const data = await apiFetch<unknown>("/funcoes", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Atualiza uma função existente.
 *
 * @param id - UUID da função.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function updateFuncao(id: string, dados: UpdateFuncaoForm): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/funcoes/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Exclui uma função pelo id.
 *
 * @param id - UUID da função a ser removida.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteFuncao(id: string): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/funcoes/${id}`, { method: "DELETE" });
  return CrudResponseSchema.parse(data);
}

/* ========== Tonalidades CRUD ========== */

/**
 * Cria uma nova tonalidade.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem e tonalidade criada (id + tom).
 */
export async function createTonalidade(dados: CreateTonalidade): Promise<TonalidadeCreateResponse> {
  const data = await apiFetch<unknown>("/tonalidades", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return TonalidadeCreateResponseSchema.parse(data);
}

/**
 * Atualiza uma tonalidade existente.
 *
 * @param id - UUID da tonalidade.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function updateTonalidade(id: string, dados: UpdateTonalidade): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/tonalidades/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Exclui uma tonalidade pelo id.
 *
 * @param id - UUID da tonalidade a ser removida.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteTonalidade(id: string): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/tonalidades/${id}`, { method: "DELETE" });
  return CrudResponseSchema.parse(data);
}

/* ========== Tipos de Evento CRUD ========== */

/**
 * Cria um novo tipo de evento.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function createTipoEvento(dados: CreateTipoEvento): Promise<CrudResponse> {
  const data = await apiFetch<unknown>("/tipos-eventos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Atualiza um tipo de evento existente.
 *
 * @param id - UUID do tipo de evento.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function updateTipoEvento(id: string, dados: UpdateTipoEvento): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/tipos-eventos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Exclui um tipo de evento pelo id.
 *
 * @param id - UUID do tipo de evento a ser removido.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function deleteTipoEvento(id: string): Promise<CrudResponse> {
  const data = await apiFetch<unknown>(`/tipos-eventos/${id}`, { method: "DELETE" });
  return CrudResponseSchema.parse(data);
}
