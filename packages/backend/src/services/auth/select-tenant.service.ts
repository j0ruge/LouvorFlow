/**
 * Serviço de seleção de tenant no fluxo de login multi-tenant.
 *
 * Recebe o selection_token emitido pelo login quando o usuário possui múltiplos
 * tenants ativos, valida o token, verifica o vínculo do usuário com o tenant
 * solicitado e emite os tokens de sessão definitivos com tenantId no payload.
 */

import { AppError } from '../../errors/AppError.js';
import tokenProvider from '../../providers/token.provider.js';
import { authConfig } from '../../config/auth.js';
import { consumeSelectionToken } from '../../providers/selection-token-store.provider.js';
import type { ISelectTenantDTO, IResponseDTO } from '../../types/auth.types.js';
import prisma from '../../../prisma/cliente.js';
import authenticateUserService from './authenticate-user.service.js';
import { montarUserSessionInclude } from './user-session-include.js';

/**
 * Tempo de vida (ms) da marca de consumo do selection token no store de uso único.
 * Deve cobrir a validade do token (5 min) para impedir replay durante toda a janela.
 */
const SELECTION_TOKEN_TTL_MS = 5 * 60 * 1000;

class SelectTenantService {
    /**
     * Completa o fluxo de login multi-tenant selecionando um tenant específico.
     *
     * Verifica o selection_token, extrai o userId do subject JWT, valida o vínculo
     * do usuário com o tenant solicitado, confirma que o tenant está ativo e emite
     * os tokens de sessão definitivos com tenantId incluído no payload.
     *
     * @param dto - Objeto contendo selection_token e tenant_id selecionado pelo usuário.
     * @returns Resposta de sessão completa com usuário sanitizado, tokens e dados do tenant.
     * @throws AppError 401 se o selection_token for inválido, expirado ou com purpose incorreto.
     * @throws AppError 403 se o usuário não estiver vinculado ao tenant solicitado.
     * @throws AppError 404 se o tenant não existir.
     * @throws AppError 400 se o tenant não estiver ativo.
     */
    async execute({ selection_token, tenant_id }: ISelectTenantDTO): Promise<IResponseDTO> {
        // Verifica e decodifica o selection_token
        let decoded: Record<string, unknown>;

        try {
            decoded = tokenProvider.verify(selection_token, authConfig.selectionToken.secret);
        } catch {
            throw new AppError('Token de seleção inválido ou expirado', 401);
        }

        if (decoded.purpose !== 'tenant_selection') {
            throw new AppError('Token de seleção inválido ou expirado', 401);
        }

        if (typeof decoded.sub !== 'string') {
            throw new AppError('Token de seleção inválido ou expirado', 401);
        }

        const userId = decoded.sub;

        // Busca o usuário completo (com senha) via Prisma, filtrando roles e permissões pelo tenant selecionado
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: montarUserSessionInclude(tenant_id),
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 401);
        }

        // Verifica o vínculo do usuário com o tenant solicitado
        const tenantLink = await prisma.tenantUsers.findFirst({
            where: {
                user_id: userId,
                tenant_id: tenant_id,
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

        /**
         * Uso único: consome o selection token (por `jti`) imediatamente antes de emitir
         * a sessão. Consumir somente aqui — após todas as validações — evita "queimar" o
         * token em uma seleção inválida (ex.: tenant errado) e bloqueia replay/concorrência.
         */
        if (
            typeof decoded.jti !== 'string' ||
            !consumeSelectionToken(decoded.jti, SELECTION_TOKEN_TTL_MS)
        ) {
            throw new AppError('Token de seleção inválido ou já utilizado', 401);
        }

        // Gera os tokens de sessão com tenantId no payload, reutilizando o método do AuthenticateUserService
        return authenticateUserService._generateSession(user, { id: tenant.id, name: tenant.name });
    }
}

export default new SelectTenantService();
