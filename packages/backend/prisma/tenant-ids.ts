/**
 * IDs fixos dos tenants de sistema.
 *
 * Vivem em módulo próprio, sem efeitos colaterais, porque `cliente.ts`
 * instancia um `PrismaClient` no carregamento: importar as constantes de lá
 * dentro de um seed ou de um teste abriria uma conexão só para ler dois UUIDs.
 * Era exatamente por isso que `seeds/admin.ts` e `tests/fakes/mock-data.ts`
 * redeclaravam os valores — três cópias do mesmo UUID que precisavam bater
 * entre si sem nada garantindo isso.
 */

/** Tenant sentinela para atribuições de nível plataforma (ex.: super-admin). */
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

/** Tenant padrão usado na migração de dados existentes. */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
