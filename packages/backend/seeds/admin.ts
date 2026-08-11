/**
 * @module seeds/admin
 * @description Script CLI idempotente para bootstrap do usuário administrador
 * e infraestrutura multi-tenant.
 *
 * Cria (ou garante a existência de):
 * - Tenant sentinela "Sistema" (SYSTEM_TENANT_ID)
 * - Tenant padrão "Igreja Padrão" (DEFAULT_TENANT_ID)
 * - Role e permissão `super-admin` (nível plataforma)
 * - Role e permissão `admin` (nível tenant)
 * - Permissões granulares de domínio
 * - Usuário admin com associações corretas
 *
 * Executar via `npx tsx seeds/admin.ts`.
 *
 * Variáveis de ambiente obrigatórias:
 * - ADMIN_EMAIL: e-mail do administrador
 * - ADMIN_PASSWORD: senha do administrador (será hasheada com bcrypt)
 * - ADMIN_NAME: nome de exibição do administrador
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedTenantDefaults } from './domain-defaults.js';
import { SYSTEM_TENANT_ID, DEFAULT_TENANT_ID } from '../prisma/tenant-ids.js';

/**
 * Valida e retorna as variáveis de ambiente obrigatórias para o seed admin.
 * @returns Objeto com email, password e name do admin.
 * @throws {Error} Se qualquer variável obrigatória estiver ausente.
 */
function getAdminConfig(): { email: string; password: string; name: string } {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    throw new Error(
      'Variáveis de ambiente obrigatórias ausentes: ADMIN_EMAIL, ADMIN_PASSWORD e ADMIN_NAME devem estar definidas.',
    );
  }

  return { email, password, name };
}

/**
 * Executa o bootstrap completo do administrador e infraestrutura multi-tenant.
 * Cria tenants, permissões, papéis, usuário e suas associações de forma idempotente.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const { email: adminEmail, password: adminPassword, name: adminName } = getAdminConfig();

  try {
    // ─── Tenants ─────────────────────────────────────────────────

    /** Garante a existência do tenant sentinela "Sistema". */
    await prisma.tenant.upsert({
      where: { id: SYSTEM_TENANT_ID },
      update: {},
      create: {
        id: SYSTEM_TENANT_ID,
        name: 'Sistema',
        status: 'system',
      },
    });
    console.log('✓ System tenant ready');

    /** Garante a existência do tenant padrão "Igreja Padrão". */
    await prisma.tenant.upsert({
      where: { id: DEFAULT_TENANT_ID },
      update: {},
      create: {
        id: DEFAULT_TENANT_ID,
        name: 'Igreja Padrão',
        status: 'active',
      },
    });
    console.log('✓ Default tenant ready');

    // ─── Permissions ─────────────────────────────────────────────

    /** Garante a existência da permissão "admin_full_access". */
    const adminPermission = await prisma.permissions.upsert({
      where: { name: 'admin_full_access' },
      update: {},
      create: {
        name: 'admin_full_access',
        description: 'Full administrative access',
      },
    });
    console.log('✓ Permission "admin_full_access" ready');

    /** Garante a existência da permissão "super_admin_access". */
    const superAdminPermission = await prisma.permissions.upsert({
      where: { name: 'super_admin_access' },
      update: {},
      create: {
        name: 'super_admin_access',
        description: 'Platform-level super administrator access',
      },
    });
    console.log('✓ Permission "super_admin_access" ready');

    /** Garante a existência das permissões granulares de domínio. */
    const domainPermissions = [
      { name: 'configuracoes.write', description: 'Permite criar, editar e excluir dados de configuração (artistas, categorias, funções, tonalidades, tipos de eventos)' },
      { name: 'integrantes.write', description: 'Permite criar, editar e excluir integrantes' },
      { name: 'escalas.write', description: 'Permite criar, editar e excluir escalas e gerenciar suas músicas e integrantes' },
      { name: 'musicas.write', description: 'Permite criar, editar e excluir músicas, versões, categorias e funções associadas' },
    ];

    const createdDomainPermissions = [];
    for (const perm of domainPermissions) {
      const created = await prisma.permissions.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
      createdDomainPermissions.push(created);
      console.log(`✓ Permission "${perm.name}" ready`);
    }

    // ─── Roles ───────────────────────────────────────────────────

    /** Garante a existência do papel "admin". */
    const adminRole = await prisma.roles.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Tenant administrator',
      },
    });
    console.log('✓ Role "admin" ready');

    /** Garante a existência do papel "super-admin". */
    const superAdminRole = await prisma.roles.upsert({
      where: { name: 'super-admin' },
      update: {},
      create: {
        name: 'super-admin',
        description: 'Platform super administrator',
      },
    });
    console.log('✓ Role "super-admin" ready');

    /**
     * Garante a existência do papel "integrante" — membro básico, atribuído
     * automaticamente a quem entra por link de convite (spec 023, FR-004).
     *
     * Deliberadamente sem nenhuma permissão associada: dá ao usuário uma role
     * no tenant (satisfazendo `ensureHasRole`) sem conceder escrita. O líder
     * promove depois, se quiser.
     */
    await prisma.roles.upsert({
      where: { name: 'integrante' },
      update: {},
      create: {
        name: 'integrante',
        description: 'Membro básico da igreja (sem permissões administrativas)',
      },
    });
    console.log('✓ Role "integrante" ready');

    // ─── Role-Permission associations ────────────────────────────

    /** Associa todas as permissões (admin + domínio) ao papel admin. */
    const allAdminPermissions = [adminPermission, ...createdDomainPermissions];
    for (const perm of allAdminPermissions) {
      await prisma.permissionsRoles.upsert({
        where: {
          role_id_permission_id: {
            role_id: adminRole.id,
            permission_id: perm.id,
          },
        },
        update: {},
        create: {
          role_id: adminRole.id,
          permission_id: perm.id,
        },
      });
    }
    console.log('✓ All permissions assigned to role "admin"');

    /** Associa permissão super_admin_access ao papel super-admin. */
    await prisma.permissionsRoles.upsert({
      where: {
        role_id_permission_id: {
          role_id: superAdminRole.id,
          permission_id: superAdminPermission.id,
        },
      },
      update: {},
      create: {
        role_id: superAdminRole.id,
        permission_id: superAdminPermission.id,
      },
    });
    console.log('✓ Permission "super_admin_access" assigned to role "super-admin"');

    // ─── Admin User ──────────────────────────────────────────────

    /** Cria o usuário admin com senha hasheada, caso não exista. Só atualiza senha se o usuário for novo. */
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const existingAdmin = await prisma.users.findUnique({ where: { email: adminEmail } });
    const adminUser = await prisma.users.upsert({
      where: { email: adminEmail },
      update: { name: adminName, ...(existingAdmin ? {} : { password: hashedPassword }) },
      create: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
      },
    });
    console.log(`✓ Admin user "${adminEmail}" ready`);

    // ─── User-Tenant bindings ────────────────────────────────────

    /** Vincula admin ao tenant padrão. */
    await prisma.tenantUsers.upsert({
      where: { tenant_id_user_id: { tenant_id: DEFAULT_TENANT_ID, user_id: adminUser.id } },
      update: {},
      create: { tenant_id: DEFAULT_TENANT_ID, user_id: adminUser.id },
    });
    console.log('✓ Admin user bound to default tenant');

    // ─── User-Role assignments (per-tenant) ──────────────────────

    /** Associa role "admin" ao admin user no tenant padrão. */
    await prisma.usersRoles.upsert({
      where: {
        user_id_role_id_tenant_id: {
          user_id: adminUser.id,
          role_id: adminRole.id,
          tenant_id: DEFAULT_TENANT_ID,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: adminRole.id,
        tenant_id: DEFAULT_TENANT_ID,
      },
    });
    console.log('✓ Role "admin" assigned to admin user in default tenant');

    /** Associa role "super-admin" ao admin user via tenant sentinela. */
    await prisma.usersRoles.upsert({
      where: {
        user_id_role_id_tenant_id: {
          user_id: adminUser.id,
          role_id: superAdminRole.id,
          tenant_id: SYSTEM_TENANT_ID,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: superAdminRole.id,
        tenant_id: SYSTEM_TENANT_ID,
      },
    });
    console.log('✓ Role "super-admin" assigned to admin user via system tenant');

    // ─── Domain defaults (per-tenant) ─────────────────────────

    /** Semeia dados padrão de domínio para todos os tenants ativos. */
    const activeTenants = await prisma.tenant.findMany({
      where: { status: { in: ['active'] } },
      select: { id: true, name: true },
    });

    for (const tenant of activeTenants) {
      console.log(`\n→ Seeding domain defaults for "${tenant.name}"...`);
      await seedTenantDefaults(prisma, tenant.id);
    }

    console.log('\n✓ Admin bootstrap complete');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Admin seed failed:', error);
  process.exit(1);
});
