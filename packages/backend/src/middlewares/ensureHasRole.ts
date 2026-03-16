/**
 * Middleware de autorização genérica por presença de role.
 *
 * Verifica se o usuário autenticado possui **pelo menos uma role** atribuída,
 * independentemente de qual role seja. Útil para proteger endpoints de escrita
 * (POST, PUT, DELETE) sem exigir uma role específica.
 */
import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError.js';
import usersRepository from '../repositories/auth/users.repository.js';

/**
 * Garante que o usuário autenticado possui ao menos uma role.
 *
 * Caso o usuário não possua nenhuma role atribuída, retorna HTTP 403.
 * Reutiliza o cache de roles em `req.user.roles` para evitar queries
 * repetidas quando combinado com outros middlewares de autorização.
 *
 * @param req - Objeto de requisição do Express (deve conter `req.user.id`)
 * @param _res - Objeto de resposta do Express (não utilizado)
 * @param next - Função para prosseguir ao próximo middleware
 * @throws AppError com status 401 se o usuário não estiver autenticado
 * @throws AppError com status 403 se o usuário não possuir nenhuma role
 */
export async function ensureHasRole(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    if (!req.user?.id) {
        throw new AppError('Invalid authentication token', 401);
    }

    if (!req.user.roles) {
        req.user.roles = await usersRepository.getUserRoles(req.user.id);
    }

    if (req.user.roles.length === 0) {
        throw new AppError('User does not have any role assigned', 403);
    }

    next();
}
