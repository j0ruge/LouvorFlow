/**
 * Middleware de autenticação JWT.
 *
 * Valida o header `Authorization` da requisição, extrai e verifica o
 * access token JWT, e injeta os dados do usuário autenticado em `req.user`.
 * Rejeita requisições sem token válido com HTTP 401.
 */
import type { Request, Response, NextFunction } from 'express';

import { authConfig } from '../config/auth.js';
import { AppError } from '../errors/AppError.js';
import tokenProvider from '../providers/token.provider.js';

/**
 * Garante que a requisição possui um token JWT válido no header Authorization.
 *
 * Fluxo:
 * 1. Extrai o header `Authorization`
 * 2. Valida que o esquema é "Bearer"
 * 3. Verifica o token com a chave secreta do access token
 * 4. Injeta `req.user.id` com o `sub` do payload decodificado
 *
 * @param req - Objeto de requisição do Express
 * @param _res - Objeto de resposta do Express (não utilizado)
 * @param next - Função para prosseguir ao próximo middleware
 * @throws AppError com status 401 se o token for ausente, inválido ou expirado
 */
export async function ensureAuthenticated(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError('Invalid authentication token', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
        throw new AppError('Invalid authentication token', 401);
    }

    const token = authHeader.slice(7);

    try {
        const decoded = tokenProvider.verify(
            token,
            authConfig.accessToken.secret,
        );

        const { sub } = decoded;

        if (typeof sub !== 'string') {
            throw new AppError('Invalid authentication token', 401);
        }

        req.user = { id: sub };

        next();
    } catch {
        throw new AppError('Invalid authentication token', 401);
    }
}
