/**
 * Repositório Prisma para operações de persistência de usuários.
 *
 * Encapsula todas as queries relacionadas ao model `Users`,
 * incluindo carregamento de roles e permissões associadas.
 */
import prisma from '../../../prisma/cliente.js';
import { USER_PUBLIC_SELECT } from '../../types/auth.types.js';

class UsersRepository {
    /**
     * Busca um usuário pelo ID com seleção pública (sem senha),
     * incluindo roles e permissões carregadas.
     *
     * @param id - UUID do usuário
     * @returns Usuário com roles e permissões, ou `null` se não encontrado
     */
    async findById(id: string) {
        return prisma.users.findUnique({
            where: { id },
            select: USER_PUBLIC_SELECT,
        });
    }

    /**
     * Busca um usuário pelo email, retornando o registro completo
     * (incluindo hash da senha) para comparação de autenticação.
     *
     * @param email - Email do usuário
     * @returns Usuário completo ou `null` se não encontrado
     */
    async findByEmail(email: string) {
        return prisma.users.findUnique({
            where: { email },
        });
    }

    /**
     * Retorna as permissões diretas atribuídas ao usuário,
     * mapeadas para um array plano de objetos `{ id, name, description }`.
     *
     * @param id - UUID do usuário
     * @returns Array de permissões diretas do usuário
     */
    async getUserPermissions(id: string) {
        const userPermissions = await prisma.usersPermissions.findMany({
            where: { user_id: id },
            select: {
                permission: {
                    select: { id: true, name: true, description: true },
                },
            },
        });

        return userPermissions.map((up) => up.permission);
    }

    /**
     * Retorna as roles atribuídas ao usuário, cada uma com suas
     * permissões carregadas e achatadas em um array plano.
     *
     * @param id - UUID do usuário
     * @returns Array de roles com permissões achatadas
     */
    async getUserRoles(id: string) {
        const userRoles = await prisma.usersRoles.findMany({
            where: { user_id: id },
            select: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        permissions: {
                            select: {
                                permission: {
                                    select: { id: true, name: true, description: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
            permissions: ur.role.permissions.map((rp) => rp.permission),
        }));
    }

    /**
     * Cria um novo usuário no banco de dados.
     *
     * @param data - Dados de criação: name, email e password (hash)
     * @returns Usuário criado com seleção pública (sem senha)
     */
    async create(data: { name: string; email: string; password: string }) {
        return prisma.users.create({
            data,
            select: USER_PUBLIC_SELECT,
        });
    }

    /**
     * Atualiza um usuário existente. Quando `roles` ou `permissions` são
     * fornecidos, utiliza uma transação para deletar os vínculos antigos
     * e criar os novos (padrão deleteMany + createMany).
     *
     * @param id - UUID do usuário a atualizar
     * @param data - Campos a atualizar (name, email, password, avatar, roles, permissions)
     * @returns Usuário atualizado com seleção pública (sem senha)
     */
    async save(
        id: string,
        data: {
            name?: string;
            email?: string;
            password?: string;
            avatar?: string;
            roles?: string[];
            permissions?: string[];
        },
    ) {
        const { roles, permissions, ...scalarData } = data;

        if (roles !== undefined || permissions !== undefined) {
            return prisma.$transaction(async (tx) => {
                if (roles !== undefined) {
                    await tx.usersRoles.deleteMany({ where: { user_id: id } });
                    if (roles.length > 0) {
                        await tx.usersRoles.createMany({
                            data: roles.map((role_id) => ({ user_id: id, role_id })),
                        });
                    }
                }

                if (permissions !== undefined) {
                    await tx.usersPermissions.deleteMany({ where: { user_id: id } });
                    if (permissions.length > 0) {
                        await tx.usersPermissions.createMany({
                            data: permissions.map((permission_id) => ({ user_id: id, permission_id })),
                        });
                    }
                }

                return tx.users.update({
                    where: { id },
                    data: scalarData,
                    select: USER_PUBLIC_SELECT,
                });
            });
        }

        return prisma.users.update({
            where: { id },
            data: scalarData,
            select: USER_PUBLIC_SELECT,
        });
    }
}

export default new UsersRepository();
