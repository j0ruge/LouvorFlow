/**
 * Serviço de troca de tenant sem necessidade de re-login.
 *
 * Permite que um usuário já autenticado troque o tenant ativo da sessão
 * sem precisar realizar login novamente. Invalida todos os refresh tokens
 * anteriores e emite um novo par de tokens (access + refresh) com o
 * tenantId do novo tenant no payload JWT.
 */

import { AppError } from '../../errors/AppError.js';
import prisma from '../../../prisma/cliente.js';
import authenticateUserService from './authenticate-user.service.js';
import { montarUserSessionInclude } from './user-session-include.js';
import type { IResponseDTO } from '../../types/auth.types.js';

/** DTO de entrada para a operação de troca de tenant. */
interface ISwitchTenantDTO {
    /** UUID do usuário autenticado (extraído do JWT). */
    userId: string;
    /** UUID do tenant de destino escolhido pelo usuário. */
    tenant_id: string;
}

class SwitchTenantService {
    /**
     * Realiza a troca do tenant ativo para um usuário já autenticado.
     *
     * Fluxo:
     * 1. Verifica se o usuário está vinculado ao tenant de destino via `TenantUsers`.
     * 2. Confirma que o tenant existe e possui status `active`.
     * 3. Carrega o usuário completo (com roles e permissões) via Prisma.
     * 4. Delega a geração dos novos tokens e resposta de sessão ao `_generateSession`
     *    do `AuthenticateUserService`, que invalida os refresh tokens antigos internamente.
     *
     * @param dto - Objeto contendo `userId` (do JWT) e `tenant_id` (do body da requisição).
     * @returns Resposta de sessão completa com usuário sanitizado, token, refresh_token e tenant.
     * @throws AppError 403 se o usuário não estiver vinculado ao tenant de destino.
     * @throws AppError 404 se o tenant não existir.
     * @throws AppError 400 se o tenant não estiver ativo.
     * @throws AppError 404 se o usuário não for encontrado no banco.
     */
    async execute({ userId, tenant_id }: ISwitchTenantDTO): Promise<IResponseDTO> {
        // Verifica o vínculo do usuário com o tenant de destino
        const tenantLink = await prisma.tenantUsers.findFirst({
            where: {
                user_id: userId,
                tenant_id,
            },
        });

        if (!tenantLink) {
            throw new AppError('Usuário não vinculado a esta igreja', 403);
        }

        // Verifica que o tenant existe e está ativo
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenant_id },
            select: { id: true, name: true, status: true },
        });

        if (!tenant) {
            throw new AppError('Igreja não encontrada', 404);
        }

        if (tenant.status !== 'active') {
            throw new AppError('Igreja não está ativa', 400);
        }

        // Carrega o usuário completo (incluindo senha, roles e permissões filtradas pelo tenant de destino)
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: montarUserSessionInclude(tenant_id),
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        // Reutiliza o _generateSession do AuthenticateUserService para emitir os novos tokens
        return authenticateUserService._generateSession(user, { id: tenant.id, name: tenant.name });
    }
}

export default new SwitchTenantService();
