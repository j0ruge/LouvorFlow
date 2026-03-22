/**
 * Middleware de autenticação JWT com suporte a multi-tenant.
 *
 * Valida o header `Authorization` da requisição, extrai e verifica o
 * access token JWT, injeta os dados do usuário autenticado em `req.user`
 * (incluindo `tenantId`), cria uma instância do Prisma Client com
 * filtro automático de tenant em `req.prisma`, e configura o
 * AsyncLocalStorage para que repositories acessem o client scoped
 * transparentemente via `getPrisma()`.
 * Rejeita requisições sem token válido com HTTP 401.
 */
import type { Request, Response, NextFunction } from 'express';

import { authConfig } from '../config/auth.js';
import { AppError } from '../errors/AppError.js';
import tokenProvider from '../providers/token.provider.js';
import prisma from '../../prisma/cliente.js';
import { forTenant } from '../../prisma/cliente.js';
import { tenantContext } from '../context/tenant-context.js';

/**
 * Garante que a requisição possui um token JWT válido no header Authorization.
 *
 * Fluxo:
 * 1. Extrai o header `Authorization`
 * 2. Valida que o esquema é "Bearer"
 * 3. Verifica o token com a chave secreta do access token
 * 4. Injeta `req.user.id` e `req.user.tenantId` com dados do payload
 * 5. Se `tenantId` presente, valida que o tenant existe e está ativo,
 *    cria instância tenant-scoped do Prisma em `req.prisma`,
 *    e configura AsyncLocalStorage para acesso transparente via `getPrisma()`
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

        const { sub, tenantId } = decoded;

        if (typeof sub !== 'string') {
            throw new AppError('Invalid authentication token', 401);
        }

        req.user = { id: sub };

        /** Se o token contém tenantId, valida e cria prisma scoped. */
        if (typeof tenantId === 'string') {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, status: true },
            });

            if (!tenant || tenant.status !== 'active') {
                throw new AppError('Tenant inativo ou não encontrado', 401);
            }

            req.user.tenantId = tenantId;
            const scopedPrisma = forTenant(tenantId);
            req.prisma = scopedPrisma as any;

            /** Configura AsyncLocalStorage para acesso transparente via getPrisma(). */
            tenantContext.run(scopedPrisma as any, () => next());
            return;
        }

        next();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Invalid authentication token', 401);
    }
}
