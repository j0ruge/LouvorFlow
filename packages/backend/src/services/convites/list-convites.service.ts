/**
 * Service para listagem de convites de um tenant.
 *
 * Busca todos os convites do tenant e computa o status derivado
 * (active, expired, used, revoked) para cada um.
 */
import { AppError } from '../../errors/AppError.js';
import convitesRepository from '../../repositories/convites.repository.js';
import { deriveInviteStatus } from '../../types/convites.types.js';
import type { InviteResponse } from '../../types/convites.types.js';

class ListInvitesService {
    /**
     * Lista todos os convites do tenant com status derivado.
     *
     * @param tenantId - UUID do tenant
     * @returns Lista de convites com status computado, criador e usuário que aceitou
     */
    async execute(tenantId: string): Promise<InviteResponse[]> {
        const invites = await convitesRepository.findAllByTenantId(tenantId);

        const appWebUrl = process.env.APP_WEB_URL;

        if (!appWebUrl && process.env.NODE_ENV === 'production') {
            throw new AppError('APP_WEB_URL é obrigatória em ambiente de produção', 500);
        }

        const baseUrl = (appWebUrl ?? 'http://localhost:8080').replace(/\/+$/, '');

        return invites.map((invite) => ({
            id: invite.id,
            token: invite.token,
            url: `${baseUrl}/convite/${invite.token}`,
            expires_at: invite.expires_at,
            created_at: invite.created_at,
            used_at: invite.used_at,
            status: deriveInviteStatus(invite),
            created_by: { id: invite.creator.id, name: invite.creator.name },
            used_by: invite.user ? { id: invite.user.id, name: invite.user.name } : null,
        }));
    }
}

export default new ListInvitesService();
