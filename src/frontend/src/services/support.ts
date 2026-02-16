/**
 * Serviço de dados de suporte (lookup lists) para formulários.
 *
 * Fornece funções para buscar tonalidades, funções e tipos de eventos
 * que populam selects e dropdowns nos formulários de criação.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { IdNomeSchema, TonalidadeSchema } from "@/schemas/shared";
import type { IdNome, Tonalidade } from "@/schemas/shared";

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
