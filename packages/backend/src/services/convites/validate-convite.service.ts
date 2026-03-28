/**
 * Service para validação pública de tokens de convite.
 *
 * Verifica o estado do token (válido, expirado, usado, revogado, inexistente)
 * e retorna informações do tenant para exibição na tela de cadastro.
 */
import { AppError } from '../../errors/AppError.js';
import convitesRepository from '../../repositories/convites.repository.js';
import type { InviteValidationResult } from '../../types/convites.types.js';

class ValidateInviteService {
    /**
     * Valida um token de convite e retorna dados do tenant se válido.
     *
     * @param token - UUID do token de convite
     * @returns Resultado com `valid: true` e nome do tenant se o token for válido
     * @throws AppError 404 se o token não existir
     * @throws AppError 400 se o token estiver expirado, usado ou revogado (com status específico)
     */
    async execute(token: string): Promise<InviteValidationResult> {
        const invite = await convitesRepository.findByToken(token);

        if (!invite) {
            throw new AppError('Convite não encontrado.', 404);
        }

        if (invite.used_at) {
            throw Object.assign(
                new AppError('Este convite já foi utilizado.', 400),
                { status: 'used' },
            );
        }

        if (invite.revoked_at) {
            throw Object.assign(
                new AppError('Este convite foi cancelado.', 400),
                { status: 'revoked' },
            );
        }

        if (new Date() > invite.expires_at) {
            throw Object.assign(
                new AppError('Este convite expirou. Peça um novo ao seu líder.', 400),
                { status: 'expired' },
            );
        }

        return {
            valid: true,
            tenant: { name: invite.tenant.name },
        };
    }
}

export default new ValidateInviteService();
