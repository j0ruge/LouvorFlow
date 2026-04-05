/**
 * Service para revogação de convites pelo líder.
 *
 * Valida que o convite existe, pertence ao tenant, não foi usado
 * e não foi revogado antes de marcar como revogado.
 */
import { AppError } from '../../errors/AppError.js';
import prisma from '../../../prisma/cliente.js';

class RevokeInviteService {
    /**
     * Revoga um convite ativo impedindo que seja utilizado.
     * Usa update condicional atômico para evitar race condition com aceite concorrente.
     *
     * @param inviteId - UUID do registro de convite
     * @param tenantId - UUID do tenant do líder (para validação de ownership)
     * @throws AppError 404 se o convite não existir no tenant
     * @throws AppError 400 se o convite já foi utilizado ou já está revogado
     */
    async execute(inviteId: string, tenantId: string): Promise<void> {
        /** Revogação atômica: atualiza apenas se pertence ao tenant, não foi usado e não foi revogado. */
        const result = await prisma.inviteTokens.updateMany({
            where: {
                id: inviteId,
                tenant_id: tenantId,
                used_at: null,
                revoked_at: null,
            },
            data: { revoked_at: new Date() },
        });

        if (result.count === 0) {
            /** Busca o registro para retornar erro específico. */
            const invite = await prisma.inviteTokens.findFirst({
                where: { id: inviteId, tenant_id: tenantId },
            });

            if (!invite) {
                throw new AppError('Convite não encontrado', 404);
            }

            if (invite.used_at) {
                throw new AppError('Este convite já foi utilizado e não pode ser revogado', 400);
            }

            throw new AppError('Este convite já está revogado', 400);
        }
    }
}

export default new RevokeInviteService();
