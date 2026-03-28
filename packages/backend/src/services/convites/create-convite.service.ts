/**
 * Service para geração de novos links de convite.
 *
 * Cria um token de convite com expiração de 2 horas e constrói
 * a URL pública para compartilhamento via WhatsApp ou outro canal.
 */
import convitesRepository from '../../repositories/convites.repository.js';
import type { InviteResponse } from '../../types/convites.types.js';

/** Duração do convite em milissegundos (2 horas). */
const INVITE_EXPIRATION_MS = 2 * 60 * 60 * 1000;

/**
 * Deriva o status de um convite a partir dos campos temporais.
 *
 * @param invite - Registro do convite com campos used_at, revoked_at, expires_at
 * @returns Status derivado: 'used', 'revoked', 'expired' ou 'active'
 */
function deriveStatus(invite: { used_at: Date | null; revoked_at: Date | null; expires_at: Date }): 'active' | 'expired' | 'used' | 'revoked' {
    if (invite.used_at) return 'used';
    if (invite.revoked_at) return 'revoked';
    if (new Date() > invite.expires_at) return 'expired';
    return 'active';
}

class CreateInviteService {
    /**
     * Gera um novo token de convite para o tenant.
     *
     * @param tenantId - UUID do tenant que receberá o convite
     * @param createdBy - UUID do líder que está gerando o convite
     * @returns Dados do convite com URL pronta para compartilhar
     */
    async execute(tenantId: string, createdBy: string): Promise<InviteResponse> {
        const expiresAt = new Date(Date.now() + INVITE_EXPIRATION_MS);

        const invite = await convitesRepository.create(tenantId, createdBy, expiresAt);

        const appWebUrl = (process.env.APP_WEB_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
        const url = `${appWebUrl}/convite/${invite.token}`;

        return {
            id: invite.id,
            token: invite.token,
            url,
            expires_at: invite.expires_at,
            created_at: invite.created_at,
            status: deriveStatus(invite),
        };
    }
}

export default new CreateInviteService();
export { deriveStatus };
