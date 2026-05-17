/**
 * Serviço de categorias — chamadas à API REST.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { IdNomeSchema, type IdNome } from "@/schemas/shared";

/**
 * Lista todas as categorias do tenant atual.
 *
 * @returns Array de categorias `{ id, nome }`.
 */
export async function listCategorias(): Promise<IdNome[]> {
  const data = await apiFetch<unknown>("/categorias");
  return z.array(IdNomeSchema).parse(data);
}
