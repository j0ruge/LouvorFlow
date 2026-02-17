/**
 * Serviço de integrantes — chamadas à API REST.
 *
 * Funções para listar, buscar por id, criar e atualizar integrantes,
 * com parsing Zod para garantir conformidade com o contrato.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import {
  IntegranteComFuncoesSchema,
  IntegranteResponseSchema,
} from "@/schemas/integrante";
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
