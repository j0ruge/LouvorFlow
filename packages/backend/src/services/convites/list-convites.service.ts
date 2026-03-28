/**
 * Service para listagem de convites de um tenant.
 *
 * Busca todos os convites do tenant e computa o status derivado
 * (active, expired, used, revoked) para cada um.
 */
import convitesRepository from '../../repositories/convites.repository.js';
import { deriveStatus } from './create-convite.service.js';
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

        const appWebUrl = (process.env.APP_WEB_URL ?? 'http://localhost:5173').replace(/\/+$/, '');

        return invites.map((invite) => ({
            id: invite.id,
            token: invite.token,
            url: `${appWebUrl}/convite/${invite.token}`,
            expires_at: invite.expires_at,
            created_at: invite.created_at,
            used_at: invite.used_at,
            status: deriveStatus(invite),
            created_by: invite.creator,
            used_by: invite.user,
        }));
    }
}

export default new ListInvitesService();
