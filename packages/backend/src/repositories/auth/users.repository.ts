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
     * Lista usuários com seleção pública (sem senha),
     * incluindo roles e permissões carregadas.
     * Suporta paginação opcional via `page` e `limit`.
     *
     * @param options - Opções de paginação (page e limit). Se omitidos, retorna todos.
     * @returns Objeto com `data` (array de usuários), `total`, `page` e `limit`
     */
    async findAll(options?: { page?: number; limit?: number }) {
        const page = options?.page;
        const limit = options?.limit;
        const isPaginated = page !== undefined && limit !== undefined;

        const [data, total] = await Promise.all([
            prisma.users.findMany({
                select: USER_PUBLIC_SELECT,
                orderBy: { name: 'asc' },
                ...(isPaginated ? { skip: (page - 1) * limit, take: limit } : {}),
            }),
            prisma.users.count(),
        ]);

        return { data, total, page: page ?? 1, limit: limit ?? total };
    }

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
        return prisma.users.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: {
                roles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                created_at: true,
                                updated_at: true,
                                permissions: {
                                    select: {
                                        permission: {
                                            select: { id: true, name: true, description: true, created_at: true, updated_at: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                permissions: {
                    select: {
                        permission: {
                            select: { id: true, name: true, description: true, created_at: true, updated_at: true }
                        }
                    }
                }
            },
        });
    }

    /**
     * Retorna as permissões diretas atribuídas ao usuário,
     * mapeadas para um array plano de objetos `{ id, name, description }`.
     * Quando `tenantId` é fornecido, filtra apenas os registros daquele tenant.
     *
     * @param id - UUID do usuário
     * @param tenantId - UUID do tenant para filtro opcional
     * @returns Array de permissões diretas do usuário
     */
    async getUserPermissions(id: string, tenantId?: string) {
        const userPermissions = await prisma.usersPermissions.findMany({
            where: { user_id: id, ...(tenantId ? { tenant_id: tenantId } : {}) },
            select: {
                permission: {
                    select: { id: true, name: true, description: true, created_at: true, updated_at: true },
                },
            },
        });

        return userPermissions.map((up) => up.permission);
    }

    /**
     * Retorna as roles atribuídas ao usuário, cada uma com suas
     * permissões carregadas e achatadas em um array plano.
     * Quando `tenantId` é fornecido, filtra apenas os registros daquele tenant.
     *
     * @param id - UUID do usuário
     * @param tenantId - UUID do tenant para filtro opcional
     * @returns Array de roles com permissões achatadas
     */
    async getUserRoles(id: string, tenantId?: string) {
        const userRoles = await prisma.usersRoles.findMany({
            where: { user_id: id, ...(tenantId ? { tenant_id: tenantId } : {}) },
            select: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        created_at: true,
                        updated_at: true,
                        permissions: {
                            select: {
                                permission: {
                                    select: { id: true, name: true, description: true, created_at: true, updated_at: true },
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
            created_at: ur.role.created_at,
            updated_at: ur.role.updated_at,
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
     * Quando `tenantId` é informado, o deleteMany filtra apenas os vínculos
     * daquele tenant e o createMany inclui `tenant_id` explicitamente,
     * garantindo que ACLs de outros tenants não sejam afetadas.
     *
     * @param id - UUID do usuário a atualizar
     * @param data - Campos a atualizar (name, email, password, avatar, roles, permissions, tenantId)
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
            tenantId?: string;
        },
    ) {
        const { roles, permissions, tenantId, ...scalarData } = data;

        if (roles !== undefined || permissions !== undefined) {
            return prisma.$transaction(async (tx) => {
                if (roles !== undefined) {
                    await tx.usersRoles.deleteMany({
                        where: {
                            user_id: id,
                            ...(tenantId ? { tenant_id: tenantId } : {}),
                        },
                    });
                    if (roles.length > 0) {
                        await tx.usersRoles.createMany({
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id fornecido explicitamente ou injetado pelo interceptor forTenant em runtime
                            data: roles.map((role_id) => {
                                if (!tenantId) {
                                    throw new Error(`tenant_id é obrigatório para atribuir roles. Recebido: ${tenantId}`);
                                }
                                return { user_id: id, role_id, tenant_id: tenantId };
                            }),
                        });
                    }
                }

                if (permissions !== undefined) {
                    await tx.usersPermissions.deleteMany({
                        where: {
                            user_id: id,
                            ...(tenantId ? { tenant_id: tenantId } : {}),
                        },
                    });
                    if (permissions.length > 0) {
                        await tx.usersPermissions.createMany({
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id fornecido explicitamente ou injetado pelo interceptor forTenant em runtime
                            data: permissions.map((permission_id) => {
                                if (!tenantId) {
                                    throw new Error(`tenant_id é obrigatório para atribuir permissões. Recebido: ${tenantId}`);
                                }
                                return { user_id: id, permission_id, tenant_id: tenantId };
                            }),
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
