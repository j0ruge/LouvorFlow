/**
 * Contexto de tenant por requisição usando AsyncLocalStorage.
 *
 * Permite que repositories acessem o Prisma Client com filtro de tenant
 * sem necessidade de receber `req.prisma` como parâmetro — o middleware
 * `ensureAuthenticated` configura o contexto automaticamente.
 */
import { AsyncLocalStorage } from 'async_hooks';
import type { PrismaClient } from '@prisma/client';

/**
 * AsyncLocalStorage que armazena o Prisma Client scoped ao tenant da requisição.
 * Cada request tem seu próprio contexto isolado.
 */
export const tenantContext = new AsyncLocalStorage<PrismaClient>();
