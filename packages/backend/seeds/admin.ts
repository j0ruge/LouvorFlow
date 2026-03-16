/**
 * @module seeds/admin
 * @description Script CLI idempotente para bootstrap do usuário administrador.
 *
 * Cria (ou garante a existência de) permissão, papel e usuário admin,
 * além de associá-los corretamente. Executar via `npx tsx seeds/admin.ts`.
 *
 * Variáveis de ambiente obrigatórias:
 * - ADMIN_EMAIL: e-mail do administrador
 * - ADMIN_PASSWORD: senha do administrador (será hasheada com bcrypt)
 * - ADMIN_NAME: nome de exibição do administrador
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
 * Executa o bootstrap completo do administrador no banco de dados.
 * Cria permissão, papel, usuário e suas associações de forma idempotente.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const { email: adminEmail, password: adminPassword, name: adminName } = getAdminConfig();

  try {
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

    /** Garante a existência do papel "admin". */
    const adminRole = await prisma.roles.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'System administrator',
      },
    });
    console.log('✓ Role "admin" ready');

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

    /** Associa todas as permissões (admin + domínio) ao papel admin. */
    const allPermissions = [adminPermission, ...createdDomainPermissions];
    for (const perm of allPermissions) {
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

    /** Cria o usuário admin com senha hasheada, caso não exista. */
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = await prisma.users.upsert({
      where: { email: adminEmail },
      update: { name: adminName, password: hashedPassword },
      create: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
      },
    });
    console.log(`✓ Admin user "${adminEmail}" ready`);

    /** Associa o papel "admin" ao usuário, caso ainda não esteja associado. */
    await prisma.usersRoles.upsert({
      where: {
        user_id_role_id: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    });
    console.log('✓ Role "admin" assigned to admin user');

    console.log('✓ Admin bootstrap complete');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Admin seed failed:', error);
  process.exit(1);
});
