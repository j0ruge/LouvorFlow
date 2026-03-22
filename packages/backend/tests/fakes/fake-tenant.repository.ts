/**
 * Fake repositories para Tenant e TenantUsers em testes unitários.
 * Operações in-memory que simulam o comportamento do banco de dados.
 */
import { randomUUID } from 'node:crypto';
import { MOCK_TENANTS, MOCK_TENANT_USERS } from './mock-data.js';

/** Representa um tenant em memória. */
interface FakeTenant {
  id: string;
  name: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

/** Representa um vínculo user-tenant em memória. */
interface FakeTenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
}

/** Cria fake repository para Tenants com dados em memória. */
export function createFakeTenantRepository() {
  let data: FakeTenant[] = MOCK_TENANTS.map(t => ({ ...t }));

  return {
    /** Lista todos os tenants ativos (exclui status 'system'). */
    findAll: async () => data.filter(t => t.status !== 'system'),

    /** Busca tenant por ID. */
    findById: async (id: string) => data.find(t => t.id === id) ?? null,

    /** Busca tenant por nome. */
    findByName: async (name: string) => data.find(t => t.name === name) ?? null,

    /** Cria um novo tenant. */
    create: async (input: { name: string }) => {
      const tenant: FakeTenant = { id: randomUUID(), name: input.name, status: 'active' };
      data.push(tenant);
      return tenant;
    },

    /** Atualiza um tenant existente. */
    update: async (id: string, input: { name?: string; status?: string }) => {
      const tenant = data.find(t => t.id === id);
      if (!tenant) return null;
      if (input.name !== undefined) tenant.name = input.name;
      if (input.status !== undefined) tenant.status = input.status;
      return tenant;
    },

    /** Reseta dados para o estado inicial. */
    reset: () => { data = MOCK_TENANTS.map(t => ({ ...t })); },
  };
}

/** Cria fake repository para TenantUsers com dados em memória. */
export function createFakeTenantUsersRepository() {
  let data: FakeTenantUser[] = MOCK_TENANT_USERS.map(tu => ({ ...tu }));

  return {
    /** Busca vínculos por user_id. */
    findByUserId: async (userId: string) => data.filter(tu => tu.user_id === userId),

    /** Busca vínculo específico user+tenant. */
    findByUserAndTenant: async (userId: string, tenantId: string) =>
      data.find(tu => tu.user_id === userId && tu.tenant_id === tenantId) ?? null,

    /** Lista users de um tenant. */
    findByTenantId: async (tenantId: string) => data.filter(tu => tu.tenant_id === tenantId),

    /** Cria vínculo user-tenant. */
    create: async (tenantId: string, userId: string) => {
      const entry: FakeTenantUser = { id: randomUUID(), tenant_id: tenantId, user_id: userId };
      data.push(entry);
      return entry;
    },

    /** Remove vínculo user-tenant. */
    remove: async (tenantId: string, userId: string) => {
      const idx = data.findIndex(tu => tu.tenant_id === tenantId && tu.user_id === userId);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },

    /** Reseta dados para o estado inicial. */
    reset: () => { data = MOCK_TENANT_USERS.map(tu => ({ ...tu })); },
  };
}
