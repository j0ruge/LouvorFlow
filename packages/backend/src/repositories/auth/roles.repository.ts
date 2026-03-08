/**
 * Repositório Prisma para operações de persistência de roles (papéis).
 *
 * Encapsula todas as queries relacionadas ao model `Roles`,
 * incluindo carregamento de permissões associadas via tabela de junção.
 */
import prisma from '../../../prisma/cliente.js';

/** Seleção padrão para roles com permissões carregadas. */
const ROLE_WITH_PERMISSIONS_SELECT = {
    id: true,
    name: true,
    description: true,
    created_at: true,
    updated_at: true,
    permissions: {
        select: {
            permission: {
                select: { id: true, name: true, description: true },
            },
        },
    },
} as const;

class RolesRepository {
    /**
     * Lista todas as roles com suas permissões carregadas.
     *
     * @returns Array de roles com permissões
     */
    async findAll() {
        return prisma.roles.findMany({
            select: ROLE_WITH_PERMISSIONS_SELECT,
        });
    }

    /**
     * Busca uma role pelo ID com suas permissões carregadas.
     *
     * @param id - UUID da role
     * @returns Role com permissões ou `null` se não encontrada
     */
    async findById(id: string) {
        return prisma.roles.findUnique({
            where: { id },
            select: ROLE_WITH_PERMISSIONS_SELECT,
        });
    }

    /**
     * Busca múltiplas roles pelos IDs, com permissões carregadas.
     *
     * @param ids - Array de UUIDs das roles
     * @returns Array de roles encontradas com permissões
     */
    async findByIds(ids: string[]) {
        return prisma.roles.findMany({
            where: { id: { in: ids } },
            select: ROLE_WITH_PERMISSIONS_SELECT,
        });
    }

    /**
     * Busca uma role pelo nome.
     *
     * @param name - Nome da role
     * @returns Role com permissões ou `null` se não encontrada
     */
    async findByName(name: string) {
        return prisma.roles.findUnique({
            where: { name },
            select: ROLE_WITH_PERMISSIONS_SELECT,
        });
    }

    /**
     * Cria uma nova role no banco de dados.
     *
     * @param data - Dados de criação: name e description
     * @returns Role criada
     */
    async create(data: { name: string; description: string }) {
        return prisma.roles.create({
            data,
            select: ROLE_WITH_PERMISSIONS_SELECT,
        });
    }

    /**
     * Atualiza uma role existente. Quando `permissions` é fornecido,
     * utiliza uma transação para deletar os vínculos antigos e criar
     * os novos (padrão deleteMany + createMany).
     *
     * @param id - UUID da role a atualizar
     * @param data - Campos a atualizar (name, description, permissions)
     * @returns Role atualizada com permissões
     */
    async save(
        id: string,
        data: {
            name?: string;
            description?: string;
            permissions?: string[];
        },
    ) {
        const { permissions, ...scalarData } = data;

        if (permissions !== undefined) {
            return prisma.$transaction(async (tx) => {
                await tx.permissionsRoles.deleteMany({ where: { role_id: id } });

                if (permissions.length > 0) {
                    await tx.permissionsRoles.createMany({
                        data: permissions.map((permission_id) => ({ role_id: id, permission_id })),
                    });
                }

                return tx.roles.update({
                    where: { id },
                    data: scalarData,
                    select: ROLE_WITH_PERMISSIONS_SELECT,
                });
            });
        }

        return prisma.roles.update({
            where: { id },
            data: scalarData,
            select: ROLE_WITH_PERMISSIONS_SELECT,
        });
    }
}

export default new RolesRepository();
