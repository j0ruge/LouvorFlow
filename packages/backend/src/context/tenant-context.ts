/**
 * Contexto de tenant por requisição usando AsyncLocalStorage.
 *
 * Permite que repositories acessem o Prisma Client com filtro de tenant
 * sem necessidade de receber `req.prisma` como parâmetro — o middleware
 * `ensureAuthenticated` configura o contexto automaticamente.
 */
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage que armazena o Prisma Client scoped ao tenant da requisição.
 * Cada request tem seu próprio contexto isolado.
 *
 * Tipado como `unknown` porque `forTenant()` retorna um tipo estendido via
 * `$extends` incompatível com `PrismaClient` puro. O consumidor (`getPrisma()`)
 * faz o cast para `PrismaClient` ao recuperar do store.
 */
export const tenantContext = new AsyncLocalStorage<unknown>();
