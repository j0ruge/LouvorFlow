/**
 * Serviço de convites — chamadas à API REST.
 *
 * Funções para gerar, listar, revogar, validar e aceitar convites,
 * com parsing Zod para garantir conformidade com o contrato.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";

/** Schema de um usuário referenciado no convite (criador ou quem aceitou). */
const InviteUserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** Schema de um convite retornado pela API. */
const InviteSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
  status: z.enum(["active", "expired", "used", "revoked"]),
  used_at: z.string().nullable().optional(),
  created_by: InviteUserRefSchema.optional(),
  used_by: InviteUserRefSchema.nullable().optional(),
});

/** Schema de resposta da geração de convite (POST /api/convites). */
const CreateInviteResponseSchema = z.object({
  msg: z.string(),
  invite: InviteSchema,
});

/** Schema de resposta da listagem de convites (GET /api/convites). */
const ListInvitesResponseSchema = z.object({
  invites: z.array(InviteSchema),
});

/** Schema de resposta de mensagem simples (DELETE, POST accept). */
const MsgResponseSchema = z.object({
  msg: z.string(),
});

/** Schema de resposta da validação de token (GET /api/convites/:token/validate). */
const ValidateInviteResponseSchema = z.object({
  valid: z.boolean(),
  tenant: z.object({ name: z.string() }),
});

/** Tipo inferido de um convite. */
export type Invite = z.infer<typeof InviteSchema>;

/** Tipo inferido da resposta de criação. */
export type CreateInviteResponse = z.infer<typeof CreateInviteResponseSchema>;

/** Tipo inferido da resposta de validação. */
export type ValidateInviteResponse = z.infer<typeof ValidateInviteResponseSchema>;

/** Dados para aceitar um convite. */
export interface AcceptInviteData {
  nome: string;
  email: string;
  senha: string;
  senha_confirmacao: string;
}

/**
 * Gera um novo link de convite para o tenant do líder autenticado.
 *
 * @returns Resposta com mensagem e dados do convite incluindo URL.
 */
export async function createInvite(): Promise<CreateInviteResponse> {
  const data = await apiFetch<unknown>("/convites", {
    method: "POST",
  });
  return CreateInviteResponseSchema.parse(data);
}

/**
 * Lista todos os convites do tenant do líder autenticado.
 *
 * @returns Lista de convites com status derivado.
 */
export async function getInvites(): Promise<Invite[]> {
  const data = await apiFetch<unknown>("/convites");
  const parsed = ListInvitesResponseSchema.parse(data);
  return parsed.invites;
}

/**
 * Revoga um convite ativo pelo ID.
 *
 * @param id - UUID do convite a revogar.
 * @returns Mensagem de confirmação.
 */
export async function revokeInvite(id: string): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/convites/${id}`, {
    method: "DELETE",
  });
  return MsgResponseSchema.parse(data);
}

/**
 * Valida um token de convite e retorna dados do tenant (rota pública).
 *
 * @param token - UUID do token de convite.
 * @returns Resultado da validação com nome do tenant.
 */
export async function validateInvite(token: string): Promise<ValidateInviteResponse> {
  const data = await apiFetch<unknown>(`/convites/${token}/validate`);
  return ValidateInviteResponseSchema.parse(data);
}

/**
 * Aceita um convite e cria conta ou vincula conta existente (rota pública).
 *
 * @param token - UUID do token de convite.
 * @param body - Dados do participante.
 * @returns Mensagem de confirmação.
 */
export async function acceptInvite(token: string, body: AcceptInviteData): Promise<{ msg: string }> {
  const data = await apiFetch<unknown>(`/convites/${token}/accept`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return MsgResponseSchema.parse(data);
}
