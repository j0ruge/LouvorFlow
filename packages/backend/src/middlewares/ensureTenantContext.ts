/**
 * Middleware que garante a presença de contexto de tenant na requisição.
 *
 * Rejeita requisições que não possuem `tenantId` no token JWT,
 * impedindo operações de domínio sem isolamento de tenant.
 */
import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError.js';

/**
 * Verifica se o usuário autenticado possui um `tenantId` válido no token.
 *
 * Deve ser adicionado a todas as rotas de domínio (artistas, músicas,
 * eventos, etc.) para garantir que nenhuma operação ocorra sem contexto
 * de tenant.
 *
 * @param req - Objeto de requisição (deve conter `req.user.tenantId`)
 * @param _res - Objeto de resposta (não utilizado)
 * @param next - Função para prosseguir ao próximo middleware
 * @throws AppError 403 se não houver tenantId no contexto do usuário
 */
export function ensureTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user?.tenantId) {
    throw new AppError('Contexto de tenant ausente. Selecione uma igreja para continuar.', 403);
  }

  next();
}
