/**
 * Service para geração de novos links de convite.
 *
 * Cria um token de convite com expiração de 2 horas e constrói
 * a URL pública para compartilhamento via WhatsApp ou outro canal.
 */
import convitesRepository from '../../repositories/convites.repository.js';
import { deriveInviteStatus } from '../../types/convites.types.js';
import type { InviteResponse } from '../../types/convites.types.js';

/** Duração do convite em milissegundos (2 horas). */
const INVITE_EXPIRATION_MS = 2 * 60 * 60 * 1000;

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

        const appWebUrl = (process.env.APP_WEB_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
        const url = `${appWebUrl}/convite/${invite.token}`;

        return {
            id: invite.id,
            token: invite.token,
            url,
            expires_at: invite.expires_at,
            created_at: invite.created_at,
            status: deriveInviteStatus(invite),
        };
    }
}

export default new CreateInviteService();
