/**
 * Serviço de integrantes — chamadas à API REST.
 *
 * Funções para listar, buscar por id e criar integrantes,
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
