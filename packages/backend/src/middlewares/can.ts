/**
 * Middleware factory de autorização por permissões.
 *
 * Gera um middleware que verifica se o usuário autenticado possui
 * pelo menos uma das permissões exigidas, considerando tanto
 * permissões diretas quanto permissões herdadas via roles.
 */
import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError.js';
import usersRepository from '../repositories/auth/users.repository.js';

/**
 * Cria um middleware que exige que o usuário possua ao menos uma
 * das permissões informadas (direta ou via role).
 *
 * O middleware busca em paralelo as permissões diretas e as roles do
 * usuário, consolida todos os nomes de permissão em um `Set` e verifica
 * se há interseção com as permissões requeridas.
 *
 * @param permissions - Array com os nomes das permissões aceitas (ex: `["users.create", "users.delete"]`)
 * @returns Middleware assíncrono do Express que valida as permissões do usuário
 *
 * @example
 * ```typescript
 * router.post('/users', ensureAuthenticated, can(['users.create']), createUser);
 * ```
 */
export function can(permissions: string[]) {
    /**
     * Middleware que verifica se o usuário autenticado possui
     * pelo menos uma das permissões requeridas.
     *
     * Consolida permissões diretas e permissões herdadas via roles
     * em um único conjunto para a verificação.
     *
     * @param req - Objeto de requisição do Express (deve conter `req.user.id`)
     * @param _res - Objeto de resposta do Express (não utilizado)
     * @param next - Função para prosseguir ao próximo middleware
     * @throws AppError com status 401 se o usuário não estiver autenticado
     * @throws AppError com status 403 se o usuário não possuir nenhuma das permissões exigidas
     */
    return async (
        req: Request,
        _res: Response,
        next: NextFunction,
    ): Promise<void> => {
        if (!req.user?.id) {
            throw new AppError('Invalid authentication token', 401);
        }

        if (!req.user.permissions || !req.user.roles) {
            const [directPermissions, userRoles] = await Promise.all([
                req.user.permissions
                    ? Promise.resolve(req.user.permissions)
                    : usersRepository.getUserPermissions(req.user.id),
                req.user.roles
                    ? Promise.resolve(req.user.roles)
                    : usersRepository.getUserRoles(req.user.id),
            ]);

            req.user.permissions = directPermissions;
            req.user.roles = userRoles;
        }

        const allPermissionNames = new Set<string>();

        for (const permission of req.user.permissions) {
            allPermissionNames.add(permission.name);
        }

        for (const role of req.user.roles) {
            for (const permission of role.permissions) {
                allPermissionNames.add(permission.name);
            }
        }

        const hasPermission = permissions.some((requiredPermission) =>
            allPermissionNames.has(requiredPermission),
        );

        if (!hasPermission) {
            throw new AppError(
                'User does not have the required permission',
                403,
            );
        }

        next();
    };
}
