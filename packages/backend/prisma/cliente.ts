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
 * Retorna o Prisma Client adequado ao contexto da requisição.
 *
 * Se chamado dentro de uma requisição com tenant context (configurado
 * pelo middleware `ensureAuthenticated`), retorna o client tenant-scoped.
 * Caso contrário, retorna o client base (global).
 *
 * Uso: repositories de domínio devem usar `getPrisma()` ao invés de
 * importar `prisma` diretamente.
 *
 * @returns PrismaClient — tenant-scoped se em contexto de request, base caso contrário
 */
export function getPrisma(): PrismaClient {
  return (tenantContext.getStore() as PrismaClient) ?? prisma;
}

/**
 * IDs fixos dos tenants de sistema.
 * SYSTEM_TENANT_ID: tenant sentinela para atribuições de nível plataforma (ex: super-admin).
 * DEFAULT_TENANT_ID: tenant padrão para migração de dados existentes.
 */
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Lista de modelos de domínio que devem ser filtrados por tenant.
 * Usada pelo `forTenant()` para saber quais modelos interceptar.
 */
const TENANT_MODELS = [
  'artistas',
  'artistas_Musicas',
  'musicas',
  'tonalidades',
  'funcoes',
  'categorias',
  'tipos_Eventos',
  'eventos',
  'eventos_Musicas',
  'eventos_Users',
  'eventos_Users_Funcoes',
  'musicas_Funcoes',
  'musicas_Categorias',
  'users_Funcoes',
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

          /** Operações de atualização: injetar where.tenant_id. */
          if (['update', 'updateMany'].includes(operation)) {
            args.where = { ...args.where, tenant_id: tenantId };
            return query(args);
          }

          /** Upsert: injetar em where e create. */
          if (operation === 'upsert') {
            args.where = { ...args.where, tenant_id: tenantId };
            args.create = { ...args.create, tenant_id: tenantId };
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
