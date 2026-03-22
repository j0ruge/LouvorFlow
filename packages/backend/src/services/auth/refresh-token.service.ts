/**
 * Serviço de renovação de tokens de sessão com suporte a multi-tenant.
 *
 * Verifica o refresh token atual, invalida-o no banco e emite
 * um novo par de access token + refresh token (rotação de tokens).
 * O tenantId presente no payload do refresh token é preservado no novo access token,
 * garantindo que o contexto de tenant do usuário seja mantido entre renovações.
 */

import { AppError } from '../../errors/AppError.js';
import refreshTokensRepository from '../../repositories/auth/refresh-tokens.repository.js';
import tokenProvider from '../../providers/token.provider.js';
import dateProvider from '../../providers/date.provider.js';
import { authConfig } from '../../config/auth.js';
import prisma from '../../../prisma/cliente.js';

class UserRefreshTokenService {
    /**
     * Renova a sessão do usuário a partir de um refresh token válido.
     *
     * Decodifica o refresh token para extrair o subject (userId), email e tenantId.
     * O tenantId é preservado no novo access token e refresh token para manter
     * o contexto de tenant entre renovações de sessão.
     * Valida que o tenant associado ao token ainda existe e está ativo antes
     * de emitir novos tokens.
     *
     * @param token - Refresh token JWT enviado pelo cliente.
     * @returns Novo par de access token e refresh token.
     * @throws AppError 400 se o refresh token for inválido ou não existir no banco.
     * @throws AppError 401 se o tenant associado estiver inativo ou não existir.
     */
    async execute(
        token: string,
    ): Promise<{ token: string; refresh_token: string }> {
        let sub: string;
        let email: string;
        let tenantId: string | undefined;

        try {
            const decoded = tokenProvider.verify(
                token,
                authConfig.refreshToken.secret,
            );

            if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
                throw new AppError('Refresh token inválido', 400);
            }

            sub = decoded.sub;
            email = decoded.email;

            // Preserva o tenantId do payload do refresh token, se presente
            if (typeof decoded.tenantId === 'string') {
                tenantId = decoded.tenantId;
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Refresh token inválido', 400);
        }

        // Valida o status do tenant associado ao token, se presente
        if (tenantId) {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { status: true },
            });

            if (!tenant || tenant.status !== 'active') {
                throw new AppError('Tenant inativo ou não encontrado', 401);
            }
        }

        const existingToken =
            await refreshTokensRepository.findByUserIdAndRefreshToken(
                sub,
                token,
            );

        if (!existingToken) {
            throw new AppError('Refresh token não encontrado', 400);
        }

        await refreshTokensRepository.deleteById(existingToken.id);

        // Preserva tenantId no payload do novo access token
        const accessTokenPayload: Record<string, unknown> = {};
        if (tenantId) accessTokenPayload.tenantId = tenantId;

        const newAccessToken = tokenProvider.sign(
            accessTokenPayload,
            authConfig.accessToken.secret,
            {
                subject: sub,
                expiresIn: authConfig.accessToken.expiresIn,
            },
        );

        // Preserva tenantId no payload do novo refresh token
        const refreshTokenPayload: Record<string, unknown> = { email };
        if (tenantId) refreshTokenPayload.tenantId = tenantId;

        const newRefreshToken = tokenProvider.sign(
            refreshTokenPayload,
            authConfig.refreshToken.secret,
            {
                subject: sub,
                expiresIn: authConfig.refreshToken.expiresIn,
            },
        );

        const expires_date = dateProvider.addDays(
            authConfig.refreshToken.expiresDays,
        );

        await refreshTokensRepository.create({
            user_id: sub,
            refresh_token: newRefreshToken,
            expires_date,
        });

        return {
            token: newAccessToken,
            refresh_token: newRefreshToken,
        };
    }
}

export default new UserRefreshTokenService();
