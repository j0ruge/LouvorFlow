/**
 * Serviço de integrantes — chamadas à API REST.
 *
 * Funções para listar, buscar por id, criar, atualizar e excluir integrantes,
 * com parsing Zod para garantir conformidade com o contrato.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import {
  IntegranteComFuncoesSchema,
  IntegranteResponseSchema,
} from "@/schemas/integrante";
import { IdNomeSchema } from "@/schemas/shared";
import type { IdNome } from "@/schemas/shared";
import type {
  IntegranteComFuncoes,
  IntegranteResponse,
  CreateIntegranteForm,
  UpdateIntegranteForm,
} from "@/schemas/integrante";

/**
 * Busca todos os integrantes com suas funções.
 *
 * @returns Lista de integrantes parseados pelo schema Zod.
 */
export async function getIntegrantes(): Promise<IntegranteComFuncoes[]> {
  const data = await apiFetch<unknown[]>("/integrantes");
  return z.array(IntegranteComFuncoesSchema).parse(data);
}

/**
 * Busca um integrante específico pelo id.
 *
 * @param id - UUID do integrante.
 * @returns Integrante parseado pelo schema Zod.
 */
export async function getIntegrante(id: string): Promise<IntegranteComFuncoes> {
  const data = await apiFetch<unknown>(`/integrantes/${id}`);
  return IntegranteComFuncoesSchema.parse(data);
}

/**
 * Cria um novo integrante.
 *
 * @param dados - Dados do formulário de criação.
 * @returns Resposta da API com mensagem e integrante criado.
 */
export async function createIntegrante(
  dados: CreateIntegranteForm,
): Promise<IntegranteResponse> {
  const data = await apiFetch<unknown>("/integrantes", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return IntegranteResponseSchema.parse(data);
}

/**
 * Atualiza um integrante existente.
 *
 * @param id - UUID do integrante.
 * @param dados - Dados do formulário de edição.
 * @returns Resposta da API com mensagem e integrante atualizado.
 */
export async function updateIntegrante(
  id: string,
  dados: UpdateIntegranteForm,
): Promise<IntegranteResponse> {
  const data = await apiFetch<unknown>(`/integrantes/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return IntegranteResponseSchema.parse(data);
}

/**
 * Exclui um integrante pelo id.
 *
 * @param id - UUID do integrante a ser removido.
 * @returns Resposta da API com mensagem e integrante excluído.
 */
export async function deleteIntegrante(id: string): Promise<IntegranteResponse> {
  const data = await apiFetch<unknown>(`/integrantes/${id}`, {
    method: "DELETE",
  });
  return IntegranteResponseSchema.parse(data);
}

/* ========== Funções do Integrante ========== */

/**
 * Retorna funções de um integrante.
 *
 * @param integranteId - UUID do integrante.
 * @returns Lista de funções parseadas pelo schema Zod.
 */
export async function getFuncoesIntegrante(integranteId: string): Promise<IdNome[]> {
  const data = await apiFetch<unknown[]>(`/integrantes/${integranteId}/funcoes`);
  return z.array(IdNomeSchema).parse(data);
}

/**
 * Adiciona uma função a um integrante.
 *
 * @param integranteId - UUID do integrante.
 * @param funcaoId - UUID da função.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function addFuncaoIntegrante(
  integranteId: string,
  funcaoId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/integrantes/${integranteId}/funcoes`, {
    method: "POST",
    body: JSON.stringify({ funcao_id: funcaoId }),
  });
  return z.object({ msg: z.string() }).parse(data);
}

/**
 * Remove uma função de um integrante.
 *
 * @param integranteId - UUID do integrante.
 * @param funcaoId - UUID da função.
 * @returns Resposta da API com mensagem de confirmação.
 */
export async function removeFuncaoIntegrante(
  integranteId: string,
  funcaoId: string,
): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(
    `/integrantes/${integranteId}/funcoes/${funcaoId}`,
    { method: "DELETE" },
  );
  return z.object({ msg: z.string() }).parse(data);
}
