/**
 * Verifica se um usuário possui a role `super-admin` no tenant sentinela.
 *
 * Consulta a tabela `users_roles` filtrando pela role `super-admin`
 * e pelo `SYSTEM_TENANT_ID`. Utilizada por controllers que precisam
 * distinguir comportamento entre super-admin e admin regular.
 *
 * @param userId - UUID do usuário a verificar.
 * @returns `true` se o usuário possui role super-admin, `false` caso contrário.
 */
import prisma, { SYSTEM_TENANT_ID } from '../../prisma/cliente.js';

export async function isSuperAdmin(userId: string): Promise<boolean> {
    const superAdminRole = await prisma.usersRoles.findFirst({
        where: {
            user_id: userId,
            tenant_id: SYSTEM_TENANT_ID,
            role: { name: 'super-admin' },
        },
        select: { user_id: true },
    });

    return superAdminRole !== null;
}
