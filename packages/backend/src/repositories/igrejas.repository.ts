/**
 * Repositório de igrejas (tenants) — opera com o Prisma base (cross-tenant).
 *
 * Todas as operações são executadas sem filtro de tenant, pois esta camada
 * é usada exclusivamente pelo super-admin para gestão de igrejas na plataforma.
 *
 * Importa `prisma` (base) diretamente, sem `getPrisma()`, para garantir
 * acesso irrestrito às tabelas de tenant.
 */
import prisma from '../../prisma/cliente.js';
import { INTEGRANTE_PUBLIC_SELECT } from '../types/index.js';

/**
 * Repositório responsável pelas operações CRUD sobre a tabela `tenants`
 * e pela gestão de vínculos entre usuários e igrejas (`tenant_users`).
 */
class IgrejasRepository {
  /**
   * Lista todos os tenants que não possuem status `system`.
   *
   * Inclui a contagem de usuários vinculados via `_count.tenant_users`.
   *
   * @returns Lista de tenants com contagem de usuários
   */
  async findAll() {
    return prisma.tenant.findMany({
      where: { status: { not: 'system' } },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: { select: { tenant_users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca um tenant pelo ID com contagem de usuários vinculados.
   *
   * @param id - UUID do tenant
   * @returns Tenant com contagem ou `null` se não encontrado
   */
  async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: { select: { tenant_users: true } },
      },
    });
  }

  /**
   * Busca um tenant pelo nome (para verificação de unicidade).
   *
   * @param name - Nome do tenant a buscar
   * @returns Tenant encontrado ou `null`
   */
  async findByName(name: string) {
    return prisma.tenant.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  /**
   * Cria um novo tenant com status `active` por padrão.
   *
   * @param data - Dados de criação contendo o nome do tenant
   * @returns Tenant criado
   */
  async create(data: { name: string }) {
    return prisma.tenant.create({
      data,
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: { select: { tenant_users: true } },
      },
    });
  }

  /**
   * Atualiza os dados de um tenant existente.
   *
   * @param id - UUID do tenant a atualizar
   * @param data - Campos a atualizar (nome e/ou status)
   * @returns Tenant atualizado
   */
  async update(id: string, data: { name?: string; status?: 'active' | 'inactive' }) {
    return prisma.tenant.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: { select: { tenant_users: true } },
      },
    });
  }

  /**
   * Cria um vínculo entre um usuário e um tenant na tabela `tenant_users`.
   *
   * @param tenantId - UUID do tenant
   * @param userId - UUID do usuário a vincular
   * @returns Registro de vínculo criado
   */
  async addUser(tenantId: string, userId: string) {
    return prisma.tenantUsers.create({
      data: { tenant_id: tenantId, user_id: userId },
    });
  }

  /**
   * Remove o vínculo entre um usuário e um tenant, fazendo cascata nas
   * atribuições de roles (`UsersRoles`) e permissões diretas (`UsersPermissions`)
   * do usuário naquele tenant específico.
   *
   * @param tenantId - UUID do tenant
   * @param userId - UUID do usuário a desvincular
   */
  async removeUser(tenantId: string, userId: string) {
    await prisma.$transaction([
      prisma.usersRoles.deleteMany({ where: { user_id: userId, tenant_id: tenantId } }),
      prisma.usersPermissions.deleteMany({ where: { user_id: userId, tenant_id: tenantId } }),
      prisma.tenantUsers.delete({
        where: { tenant_id_user_id: { tenant_id: tenantId, user_id: userId } },
      }),
    ]);
  }

  /**
   * Lista os usuários vinculados a um tenant com campos públicos.
   *
   * Inclui as roles atribuídas ao usuário naquele tenant.
   *
   * @param tenantId - UUID do tenant
   * @returns Lista de vínculos com dados públicos do usuário e suas roles no tenant
   */
  async findUsers(tenantId: string) {
    return prisma.tenantUsers.findMany({
      where: { tenant_id: tenantId },
      select: {
        id: true,
        created_at: true,
        user: {
          select: INTEGRANTE_PUBLIC_SELECT,
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Verifica se existe o vínculo entre um usuário e um tenant.
   *
   * @param tenantId - UUID do tenant
   * @param userId - UUID do usuário
   * @returns Registro de vínculo ou `null` se não existir
   */
  async findTenantUser(tenantId: string, userId: string) {
    return prisma.tenantUsers.findUnique({
      where: { tenant_id_user_id: { tenant_id: tenantId, user_id: userId } },
    });
  }

  /**
   * Invalida todos os refresh tokens dos usuários vinculados a um tenant.
   *
   * Usado na desativação de tenants para forçar re-autenticação de todos os
   * usuários do tenant desativado.
   *
   * @param tenantId - UUID do tenant cujos tokens devem ser invalidados
   */
  async invalidateRefreshTokens(tenantId: string) {
    const tenantUsers = await prisma.tenantUsers.findMany({
      where: { tenant_id: tenantId },
      select: { user_id: true },
    });
    const userIds = tenantUsers.map(tu => tu.user_id);
    if (userIds.length > 0) {
      await prisma.usersRefreshTokens.deleteMany({
        where: { user_id: { in: userIds } },
      });
    }
  }
}

export default new IgrejasRepository();
