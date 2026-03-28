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
