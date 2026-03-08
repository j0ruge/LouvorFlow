/**
 * Repositório Prisma para operações de persistência de permissões.
 *
 * Encapsula todas as queries relacionadas ao model `Permissions`.
 */
import prisma from '../../../prisma/cliente.js';

class PermissionsRepository {
    /**
     * Busca uma permissão pelo ID.
     *
     * @param id - UUID da permissão
     * @returns Permissão encontrada ou `null`
     */
    async findById(id: string) {
        return prisma.permissions.findUnique({
            where: { id },
        });
    }

    /**
     * Busca múltiplas permissões pelos IDs.
     *
     * @param ids - Array de UUIDs das permissões
     * @returns Array de permissões encontradas
     */
    async findByIds(ids: string[]) {
        return prisma.permissions.findMany({
            where: { id: { in: ids } },
        });
    }

    /**
     * Busca uma permissão pelo nome.
     *
     * @param name - Nome da permissão
     * @returns Permissão encontrada ou `null`
     */
    async findByName(name: string) {
        return prisma.permissions.findUnique({
            where: { name },
        });
    }

    /**
     * Cria uma nova permissão no banco de dados.
     *
     * @param data - Dados de criação: name e description
     * @returns Permissão criada
     */
    async create(data: { name: string; description: string }) {
        return prisma.permissions.create({
            data,
        });
    }

    /**
     * Atualiza uma permissão existente.
     *
     * @param id - UUID da permissão a atualizar
     * @param data - Campos a atualizar (name, description)
     * @returns Permissão atualizada
     */
    async save(id: string, data: { name?: string; description?: string }) {
        return prisma.permissions.update({
            where: { id },
            data,
        });
    }
}

export default new PermissionsRepository();
