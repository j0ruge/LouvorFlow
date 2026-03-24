/**
 * Serviço de igrejas (tenants) — chamadas à API REST para CRUD de organizações.
 *
 * Funções para listar, criar, atualizar e desativar igrejas, bem como
 * gerenciar os usuários vinculados a cada tenant.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { IgrejaSchema, IgrejaTenantUserSchema } from "@/schemas/auth";
import type { Igreja, IgrejaTenantUser } from "@/schemas/auth";

/**
 * Busca todas as igrejas (tenants) cadastradas.
 *
 * @returns Lista de igrejas parseadas pelo schema Zod.
 */
export async function listIgrejas(): Promise<Igreja[]> {
  const response = await apiFetch<unknown[]>("/igrejas");
  return z.array(IgrejaSchema).parse(response);
}

/**
 * Busca uma igreja específica pelo seu identificador.
 *
 * @param id - UUID da igreja.
 * @returns Dados da igreja parseados pelo schema Zod.
 */
export async function getIgreja(id: string): Promise<Igreja> {
  const data = await apiFetch<unknown>(`/igrejas/${id}`);
  return IgrejaSchema.parse(data);
}

/**
 * Cria uma nova igreja (tenant).
 *
 * O backend retorna `{ msg, igreja }` — extrai o campo `igreja` antes de parsear.
 *
 * @param data - Objeto contendo o nome da nova igreja.
 * @returns Igreja criada, parseada pelo schema Zod.
 */
export async function createIgreja(data: { name: string }): Promise<Igreja> {
  const response = await apiFetch<{ msg: string; igreja: unknown }>("/igrejas", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return IgrejaSchema.parse(response.igreja);
}

/**
 * Atualiza os dados de uma igreja existente.
 *
 * O backend retorna `{ msg, igreja }` — extrai o campo `igreja` antes de parsear.
 *
 * @param id - UUID da igreja a ser atualizada.
 * @param data - Campos a atualizar (nome e/ou status).
 * @returns Igreja atualizada, parseada pelo schema Zod.
 */
export async function updateIgreja(
  id: string,
  data: { name?: string; status?: string },
): Promise<Igreja> {
  const response = await apiFetch<{ msg: string; igreja: unknown }>(`/igrejas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return IgrejaSchema.parse(response.igreja);
}

/**
 * Desativa (soft-delete) uma igreja pelo seu identificador.
 *
 * @param id - UUID da igreja a ser desativada.
 * @returns Promessa resolvida sem valor após a desativação.
 */
export async function deactivateIgreja(id: string): Promise<void> {
  await apiFetch<void>(`/igrejas/${id}`, { method: "DELETE" });
}

/**
 * Busca todos os usuários vinculados a uma igreja.
 *
 * @param id - UUID da igreja.
 * @returns Lista de usuários da igreja, parseados pelo schema Zod.
 */
export async function listIgrejaUsers(id: string): Promise<IgrejaTenantUser[]> {
  const response = await apiFetch<unknown[]>(`/igrejas/${id}/users`);
  return z.array(IgrejaTenantUserSchema).parse(response);
}

/** Schema do vínculo retornado pelo backend ao vincular usuário a uma igreja. */
const TenantUserVinculoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
});

/** Tipo inferido do vínculo tenant-user. */
export type TenantUserVinculo = z.infer<typeof TenantUserVinculoSchema>;

/**
 * Vincula um usuário existente a uma igreja.
 *
 * O backend retorna `{ msg, vinculo }` — extrai e valida o campo `vinculo`.
 *
 * @param igrejaId - UUID da igreja.
 * @param userId - UUID do usuário a vincular.
 * @returns Dados do vínculo criado, validados pelo schema Zod.
 */
export async function addUserToIgreja(
  igrejaId: string,
  userId: string,
): Promise<TenantUserVinculo> {
  const response = await apiFetch<{ msg: string; vinculo: unknown }>(`/igrejas/${igrejaId}/users`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  return TenantUserVinculoSchema.parse(response.vinculo);
}

/**
 * Remove o vínculo de um usuário com uma igreja.
 *
 * @param igrejaId - UUID da igreja.
 * @param userId - UUID do usuário a desvincular.
 * @returns Promessa resolvida sem valor após a remoção do vínculo.
 */
export async function removeUserFromIgreja(
  igrejaId: string,
  userId: string,
): Promise<void> {
  await apiFetch<void>(`/igrejas/${igrejaId}/users/${userId}`, { method: "DELETE" });
}
