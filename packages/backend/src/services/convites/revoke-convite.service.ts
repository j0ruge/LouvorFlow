/**
 * Service para revogação de convites pelo líder.
 *
 * Valida que o convite existe, pertence ao tenant, não foi usado
 * e não foi revogado antes de marcar como revogado.
 */
import { AppError } from '../../errors/AppError.js';
import convitesRepository from '../../repositories/convites.repository.js';

class RevokeInviteService {
    /**
     * Revoga um convite ativo impedindo que seja utilizado.
     *
     * @param inviteId - UUID do registro de convite
     * @param tenantId - UUID do tenant do líder (para validação de ownership)
     * @throws AppError 404 se o convite não existir no tenant
     * @throws AppError 400 se o convite já foi utilizado ou já está revogado
     */
    async execute(inviteId: string, tenantId: string): Promise<void> {
        const invite = await convitesRepository.findById(inviteId);

        if (!invite || invite.tenant_id !== tenantId) {
            throw new AppError('Convite não encontrado', 404);
        }

        if (invite.used_at) {
            throw new AppError('Este convite já foi utilizado e não pode ser revogado', 400);
        }

        if (invite.revoked_at) {
            throw new AppError('Este convite já está revogado', 400);
        }

        await convitesRepository.revokeById(inviteId);
    }
}

export default new RevokeInviteService();
