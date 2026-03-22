/**
 * Middleware de autorização para rotas de super-admin.
 *
 * Verifica se o usuário autenticado possui a role `super-admin`
 * (atribuída via tenant sentinela "Sistema"). Anexa `basePrisma`
 * ao request para operações cross-tenant.
 */
import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError.js';
import prisma, { SYSTEM_TENANT_ID } from '../../prisma/cliente.js';

/**
 * Garante que o usuário autenticado possui a role `super-admin`.
 *
 * Consulta a tabela `users_roles` filtrando pela role `super-admin`
 * e pelo tenant sentinela (SYSTEM_TENANT_ID). Se encontrada, anexa
 * o `basePrisma` (sem filtro de tenant) ao request para operações
 * cross-tenant.
 *
 * @param req - Objeto de requisição (deve conter `req.user.id`)
 * @param _res - Objeto de resposta (não utilizado)
 * @param next - Função para prosseguir ao próximo middleware
 * @throws AppError 401 se não autenticado, 403 se não é super-admin
 */
export async function ensureSuperAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user?.id) {
    throw new AppError('Invalid authentication token', 401);
  }

  const superAdminRole = await prisma.usersRoles.findFirst({
    where: {
      user_id: req.user.id,
      tenant_id: SYSTEM_TENANT_ID,
      role: { name: 'super-admin' },
    },
  });

  if (!superAdminRole) {
    throw new AppError('Acesso restrito a super-administradores', 403);
  }

  /** Anexa basePrisma para operações cross-tenant nas rotas de gestão. */
  req.prisma = prisma as any;

  next();
}
