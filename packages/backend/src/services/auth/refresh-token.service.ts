/**
 * Serviço de renovação de tokens de sessão.
 *
 * Verifica o refresh token atual, invalida-o no banco e emite
 * um novo par de access token + refresh token (rotação de tokens).
 */

import { AppError } from '../../errors/AppError.js';
import refreshTokensRepository from '../../repositories/auth/refresh-tokens.repository.js';
import tokenProvider from '../../providers/token.provider.js';
import dateProvider from '../../providers/date.provider.js';
import { authConfig } from '../../config/auth.js';

class UserRefreshTokenService {
    /**
     * Renova a sessão do usuário a partir de um refresh token válido.
     *
     * @param token - Refresh token JWT enviado pelo cliente.
     * @returns Novo par de access token e refresh token.
     * @throws AppError 400 se o refresh token for inválido ou não existir no banco.
     */
    async execute(
        token: string,
    ): Promise<{ token: string; refresh_token: string }> {
        let sub: string;
        let email: string;

        try {
            const decoded = tokenProvider.verify(
                token,
                authConfig.refreshToken.secret,
            );
            sub = decoded.sub as string;
            email = decoded.email as string;
        } catch {
            throw new AppError('Refresh token does not exist', 400);
        }

        const existingToken =
            await refreshTokensRepository.findByUserIdAndRefreshToken(
                sub,
                token,
            );

        if (!existingToken) {
            throw new AppError('Refresh token does not exist', 400);
        }

        await refreshTokensRepository.deleteById(existingToken.id);

        const newAccessToken = tokenProvider.sign(
            {},
            authConfig.accessToken.secret,
            {
                subject: sub,
                expiresIn: authConfig.accessToken.expiresIn,
            },
        );

        const newRefreshToken = tokenProvider.sign(
            { email },
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
