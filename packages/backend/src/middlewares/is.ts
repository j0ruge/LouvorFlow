/**
 * Middleware factory de autorização por roles (papéis).
 *
 * Gera um middleware que verifica se o usuário autenticado possui
 * pelo menos uma das roles exigidas para acessar o recurso.
 */
import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError.js';
import usersRepository from '../repositories/auth/users.repository.js';

/**
 * Cria um middleware que exige que o usuário possua ao menos uma
 * das roles informadas.
 *
 * @param roles - Array com os nomes das roles aceitas (ex: `["admin", "leader"]`)
 * @returns Middleware assíncrono do Express que valida as roles do usuário
 *
 * @example
 * ```typescript
 * router.delete('/users/:id', ensureAuthenticated, is(['admin']), deleteUser);
 * ```
 */
export function is(roles: string[]) {
    /**
     * Middleware que verifica se o usuário autenticado possui
     * pelo menos uma das roles requeridas.
     *
     * @param req - Objeto de requisição do Express (deve conter `req.user.id`)
     * @param _res - Objeto de resposta do Express (não utilizado)
     * @param next - Função para prosseguir ao próximo middleware
     * @throws AppError com status 401 se o usuário não estiver autenticado
     * @throws AppError com status 403 se o usuário não possuir nenhuma das roles exigidas
     */
    return async (
        req: Request,
        _res: Response,
        next: NextFunction,
    ): Promise<void> => {
        if (!req.user?.id) {
            throw new AppError('Invalid authentication token', 401);
        }

        if (!req.user.roles) {
            req.user.roles = await usersRepository.getUserRoles(req.user.id);
        }

        const hasRole = req.user.roles.some((userRole) =>
            roles.includes(userRole.name),
        );

        if (!hasRole) {
            throw new AppError('User does not have the required role', 403);
        }

        next();
    };
}
