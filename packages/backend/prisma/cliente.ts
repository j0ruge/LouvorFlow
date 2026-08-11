import { PrismaClient } from "@prisma/client";
import { tenantContext } from '../src/context/tenant-context.js';

/**
 * Instância singleton do Prisma Client (base, sem filtro de tenant).
 *
 * Usado diretamente apenas para:
 * - Operações globais (auth, login, gestão de tenants pelo super-admin)
 * - Migrations e seeds
 *
 * Para operações de domínio, usar `getPrisma()` (que retorna o client
 * tenant-scoped via AsyncLocalStorage) ou `forTenant(tenantId)`.
 */
const prisma = new PrismaClient();

export default prisma;

/**
 * Retorna o Prisma Client tenant-scoped do contexto da requisição.
 *
 * Deve ser chamado apenas dentro de uma requisição com tenant context
 * (configurado pelo middleware `ensureAuthenticated` + `ensureTenantContext`).
 * Lança erro se chamado fora do contexto de tenant para evitar acesso
 * cross-tenant acidental.
 *
 * Uso: repositories de domínio devem usar `getPrisma()` ao invés de
 * importar `prisma` diretamente. Para operações globais (auth, seeds,
 * super-admin), importe `prisma` (default export) diretamente.
 *
 * @returns PrismaClient — tenant-scoped via AsyncLocalStorage
 * @throws Error se chamado fora de um contexto de tenant ativo
 */
export function getPrisma(): PrismaClient {
  const client = tenantContext.getStore() as PrismaClient | undefined;
  if (!client) {
    throw new Error(
      'getPrisma() chamado fora de um contexto de tenant. '
      + 'Use tenantContext.run() ou importe o client base (prisma) diretamente para operações globais.',
    );
  }
  return client;
}

/**
 * IDs fixos dos tenants de sistema.
 *
 * Definidos em `tenant-ids.ts` (módulo sem efeitos colaterais) e reexportados
 * aqui para não quebrar quem já os importava deste caminho. Seeds e testes devem
 * importar de `tenant-ids.js`, evitando instanciar o Prisma Client só por causa
 * de duas constantes.
 */
export { SYSTEM_TENANT_ID, DEFAULT_TENANT_ID } from './tenant-ids.js';

/**
 * Lista de modelos de domínio que devem ser filtrados por tenant.
 * Usada pelo `forTenant()` para saber quais modelos interceptar.
 */
const TENANT_MODELS = [
  'Artistas',
  'Artistas_Musicas',
  'Musicas',
  'Tonalidades',
  'Funcoes',
  'Funcoes_Grupos',
  'Categorias',
  'Tipos_Eventos',
  'Eventos',
  'Eventos_Musicas',
  'Eventos_Users',
  'Eventos_Users_Funcoes',
  'Musicas_Funcoes',
  'Musicas_Categorias',
  'Users_Funcoes',
  'UsersRoles',
  'UsersPermissions',
] as const;

/**
 * Cache de instâncias tenant-scoped do Prisma Client.
 *
 * Evita a criação de um novo objeto `$extends` por requisição, reutilizando
 * a instância já criada para cada `tenantId`. O número de tenants é pequeno
 * e finito, portanto um Map simples é suficiente (sem necessidade de TTL/eviction).
 */
const tenantClientCache = new Map<string, ReturnType<typeof prisma.$extends>>();

/**
 * Cria ou retorna do cache uma instância do Prisma Client com filtro automático de tenant.
 *
 * Intercepta todas as operações nos modelos de domínio para:
 * - Injetar `where.tenant_id` em queries de leitura (findMany, findFirst, findUnique, count, aggregate, groupBy)
 * - Injetar `data.tenant_id` em operações de escrita (create, createMany, update, updateMany, upsert)
 * - Injetar `where.tenant_id` em operações de exclusão (delete, deleteMany)
 *
 * @param tenantId - UUID do tenant ativo na sessão do usuário
 * @returns Instância do PrismaClient com $extends para isolamento de tenant (reutilizada do cache quando disponível)
 */
export function forTenant(tenantId: string) {
  const cached = tenantClientCache.get(tenantId);
  if (cached) return cached;

  const client = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          /** Ignora modelos que não são de domínio. */
          if (!model || !TENANT_MODELS.includes(model as typeof TENANT_MODELS[number])) {
            return query(args);
          }

          /** Operações de leitura: injetar where.tenant_id. */
          if (['findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            args.where = { ...args.where, tenant_id: tenantId };
            return query(args);
          }

          /** Operações de criação: injetar data.tenant_id. */
          if (operation === 'create') {
            args.data = { ...args.data, tenant_id: tenantId };
            return query(args);
          }

          if (operation === 'createMany' || operation === 'createManyAndReturn') {
            const items = Array.isArray(args.data) ? args.data : [args.data];
            args.data = items.map((item: Record<string, unknown>) => ({ ...item, tenant_id: tenantId }));
            return query(args);
          }

          /** Operações de atualização: injetar where.tenant_id e impedir troca de tenant via payload. */
          if (['update', 'updateMany'].includes(operation)) {
            args.where = { ...args.where, tenant_id: tenantId };
            if (args.data) {
              const { tenant_id: _stripped, ...safeData } = args.data;
              args.data = safeData;
            }
            return query(args);
          }

          /** Upsert: injetar em where e create, e impedir troca de tenant via update payload. */
          if (operation === 'upsert') {
            args.where = { ...args.where, tenant_id: tenantId };
            args.create = { ...args.create, tenant_id: tenantId };
            if (args.update) {
              const { tenant_id: _stripped, ...safeUpdate } = args.update;
              args.update = safeUpdate;
            }
            return query(args);
          }

          /** Operações de exclusão: injetar where.tenant_id. */
          if (['delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, tenant_id: tenantId };
            return query(args);
          }

          return query(args);
        },
      },
    },
  });

  tenantClientCache.set(tenantId, client);
  return client;
}
