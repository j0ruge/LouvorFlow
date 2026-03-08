/**
 * Repositório fake de permissões para testes unitários.
 *
 * Utiliza arrays em memória para simular operações de persistência
 * sem dependência de banco de dados real.
 */
import { randomUUID } from 'node:crypto';

/** Representação interna de uma permissão no fake. */
interface FakePermission {
    id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

class FakePermissionsRepository {
    /** Array em memória que simula a tabela de permissões. */
    private permissions: FakePermission[] = [];

    /**
     * Busca uma permissão pelo ID.
     *
     * @param id - UUID da permissão
     * @returns Permissão encontrada ou `null`
     */
    async findById(id: string) {
        return this.permissions.find((p) => p.id === id) ?? null;
    }

    /**
     * Busca múltiplas permissões pelos IDs, retornando as que forem encontradas.
     *
     * @param ids - Array de UUIDs das permissões
     * @returns Array de permissões encontradas (correspondência parcial)
     */
    async findByIds(ids: string[]) {
        return this.permissions.filter((p) => ids.includes(p.id));
    }

    /**
     * Busca uma permissão pelo nome.
     *
     * @param name - Nome da permissão
     * @returns Permissão encontrada ou `null`
     */
    async findByName(name: string) {
        return this.permissions.find((p) => p.name === name) ?? null;
    }

    /**
     * Cria uma nova permissão no array em memória.
     * Gera UUID e timestamps automaticamente.
     *
     * @param data - Dados de criação: name e description
     * @returns Permissão criada
     */
    async create(data: { name: string; description: string }) {
        const now = new Date();
        const permission: FakePermission = {
            id: randomUUID(),
            name: data.name,
            description: data.description,
            created_at: now,
            updated_at: now,
        };

        this.permissions.push(permission);
        return { ...permission };
    }

    /**
     * Atualiza uma permissão existente no array em memória.
     *
     * @param id - UUID da permissão a atualizar
     * @param data - Campos a atualizar (name, description)
     * @returns Permissão atualizada ou `null` se não encontrada
     */
    async save(id: string, data: { name?: string; description?: string }) {
        const permission = this.permissions.find((p) => p.id === id);
        if (!permission) return null;

        if (data.name !== undefined) permission.name = data.name;
        if (data.description !== undefined) permission.description = data.description;
        permission.updated_at = new Date();

        return { ...permission };
    }

    /**
     * Reinicia o array de permissões em memória.
     * Utilizado entre testes para garantir isolamento.
     */
    reset() {
        this.permissions = [];
    }
}

export default new FakePermissionsRepository();
