/**
 * Serviço de autenticação de usuários.
 *
 * Valida credenciais (email + senha), gera access token e refresh token JWT,
 * e persiste o refresh token no banco para permitir renovação de sessão.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import hashProvider from '../../providers/hash.provider.js';
import tokenProvider from '../../providers/token.provider.js';
import refreshTokensRepository from '../../repositories/auth/refresh-tokens.repository.js';
import dateProvider from '../../providers/date.provider.js';
import { authConfig } from '../../config/auth.js';
import type { ILoginDTO, IResponseDTO } from '../../types/auth.types.js';

class AuthenticateUserService {
    /**
     * Autentica um usuário com email e senha.
     *
     * @param dto - Objeto contendo email e senha do usuário.
     * @returns Objeto com o usuário sanitizado (sem senha), access token e refresh token.
     * @throws AppError 401 se o email não existir ou a senha não corresponder.
     */
    async execute({ email, password }: ILoginDTO): Promise<IResponseDTO> {
        const user = await usersRepository.findByEmail(email);

        if (!user) {
            throw new AppError('Incorrect email/password combination', 401);
        }

        const passwordMatched = await hashProvider.compareHash(
            password,
            user.password,
        );

        if (!passwordMatched) {
            throw new AppError('Incorrect email/password combination', 401);
        }

        const token = tokenProvider.sign({}, authConfig.accessToken.secret, {
            subject: user.id,
            expiresIn: authConfig.accessToken.expiresIn,
        });

        const refresh_token = tokenProvider.sign(
            { email: user.email },
            authConfig.refreshToken.secret,
            {
                subject: user.id,
                expiresIn: authConfig.refreshToken.expiresIn,
            },
        );

        const expires_date = dateProvider.addDays(
            authConfig.refreshToken.expiresDays,
        );

        await refreshTokensRepository.create({
            user_id: user.id,
            refresh_token,
            expires_date,
        });

        const { password: _password, ...userWithoutPassword } = user;
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        const sanitizedUser = {
            ...userWithoutPassword,
            avatar_url: userWithoutPassword.avatar
                ? `${appApiUrl}/files/${userWithoutPassword.avatar}`
                : null,
        };

        return {
            user: sanitizedUser,
            token,
            refresh_token,
        };
    }
}

export default new AuthenticateUserService();
