/**
 * Serviço HTTP dos grupos de funções.
 *
 * Consome `/api/funcoes-grupos` e valida toda resposta com Zod antes
 * de devolvê-la à camada de hooks.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { CrudResponseSchema } from "@/schemas/shared";
import type { CrudResponse } from "@/schemas/shared";
import {
  GrupoFuncoesSchema,
  GrupoFuncoesMutationResponseSchema,
} from "@/schemas/funcoes-grupos";
import type {
  GrupoFuncoes,
  GrupoFuncoesMutationResponse,
  CreateGrupoForm,
  UpdateGrupoForm,
} from "@/schemas/funcoes-grupos";

/**
 * Busca os grupos de funções do tenant, já na ordem de exibição.
 *
 * @returns Lista de grupos parseada pelo schema Zod.
 */
export async function getFuncoesGrupos(): Promise<GrupoFuncoes[]> {
  const data = await apiFetch<unknown[]>("/funcoes-grupos");
  return z.array(GrupoFuncoesSchema).parse(data);
}

/**
 * Cria um grupo no fim da sequência.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem e o grupo criado.
 */
export async function createGrupo(dados: CreateGrupoForm): Promise<GrupoFuncoesMutationResponse> {
  const data = await apiFetch<unknown>("/funcoes-grupos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return GrupoFuncoesMutationResponseSchema.parse(data);
}

/**
 * Renomeia um grupo existente.
 *
 * @param id - UUID do grupo.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem e o grupo atualizado.
 */
export async function updateGrupo(
  id: string,
  dados: UpdateGrupoForm,
): Promise<GrupoFuncoesMutationResponse> {
  const data = await apiFetch<unknown>(`/funcoes-grupos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return GrupoFuncoesMutationResponseSchema.parse(data);
}

/**
 * Exclui um grupo. As funções que pertenciam a ele ficam sem grupo.
 *
 * @param id - UUID do grupo a ser removido.
 * @returns Resposta da API com mensagem e o grupo removido.
 */
export async function deleteGrupo(id: string): Promise<GrupoFuncoesMutationResponse> {
  const data = await apiFetch<unknown>(`/funcoes-grupos/${id}`, { method: "DELETE" });
  return GrupoFuncoesMutationResponseSchema.parse(data);
}

/**
 * Reordena os grupos. A lista deve conter todos os grupos do tenant.
 *
 * @param gruposIds - UUIDs dos grupos na nova ordem desejada.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function reorderGrupos(gruposIds: string[]): Promise<CrudResponse> {
  const data = await apiFetch<unknown>("/funcoes-grupos/reorder", {
    method: "PATCH",
    body: JSON.stringify({ grupos_ids: gruposIds }),
  });
  return CrudResponseSchema.parse(data);
}

/**
 * Define quais funções pertencem ao grupo, substituindo o conjunto atual.
 *
 * @param id - UUID do grupo.
 * @param funcoesIds - UUIDs das funções que devem pertencer ao grupo (pode ser vazio).
 * @returns Resposta da API com mensagem e o grupo atualizado.
 */
export async function setGrupoFuncoes(
  id: string,
  funcoesIds: string[],
): Promise<GrupoFuncoesMutationResponse> {
  const data = await apiFetch<unknown>(`/funcoes-grupos/${id}/funcoes`, {
    method: "PUT",
    body: JSON.stringify({ funcoes_ids: funcoesIds }),
  });
  return GrupoFuncoesMutationResponseSchema.parse(data);
}
