/**
 * Interfaces e DTOs para o módulo de convites.
 *
 * Define os contratos de dados para geração, validação, aceitação,
 * listagem e revogação de tokens de convite.
 */

/** Status derivado de um convite (computado, não armazenado). */
export type InviteStatus = 'active' | 'expired' | 'used' | 'revoked';

/** Dados de entrada para aceitar um convite via link público. */
export interface AcceptInviteInput {
    nome: string;
    email: string;
    senha: string;
    senha_confirmacao: string;
}

/** Representação pública do criador ou usuário que aceitou o convite. */
export interface InviteUserRef {
    id: string;
    name: string;
}

/** Representação pública de um convite na resposta da API. */
export interface InviteResponse {
    id: string;
    token: string;
    url: string;
    expires_at: Date;
    created_at: Date;
    status: InviteStatus;
    used_at?: Date | null;
    created_by?: InviteUserRef;
    used_by?: InviteUserRef | null;
}

/** Resultado da validação de um token de convite. */
export interface InviteValidationResult {
    valid: boolean;
    tenant: { name: string };
}

/**
 * Deriva o status de um convite a partir dos campos temporais.
 * Prioridade: used > revoked > expired > active.
 *
 * @param invite - Registro do convite com campos used_at, revoked_at, expires_at
 * @returns Status derivado: 'used', 'revoked', 'expired' ou 'active'
 */
export function deriveInviteStatus(invite: { used_at: Date | null; revoked_at: Date | null; expires_at: Date }): InviteStatus {
    if (invite.used_at) return 'used';
    if (invite.revoked_at) return 'revoked';
    if (new Date() > invite.expires_at) return 'expired';
    return 'active';
}
