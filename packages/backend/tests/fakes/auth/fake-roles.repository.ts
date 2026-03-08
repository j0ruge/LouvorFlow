/**
 * Repositório fake de roles (papéis) para testes unitários.
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
}

/** Representação interna de uma role com permissões no fake. */
interface FakeRole {
    id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
    permissions: FakePermission[];
}

class FakeRolesRepository {
    /** Array em memória que simula a tabela de roles. */
    private roles: FakeRole[] = [];

    /**
     * Lista todas as roles em memória com suas permissões.
     *
     * @returns Array de todas as roles
     */
    async findAll() {
        return this.roles.map((r) => ({ ...r, permissions: [...r.permissions] }));
    }

    /**
     * Busca uma role pelo ID com suas permissões.
     *
     * @param id - UUID da role
     * @returns Role encontrada ou `null`
     */
    async findById(id: string) {
        const role = this.roles.find((r) => r.id === id);
        return role ? { ...role, permissions: [...role.permissions] } : null;
    }

    /**
     * Busca múltiplas roles pelos IDs, retornando as que forem encontradas.
     *
     * @param ids - Array de UUIDs das roles
     * @returns Array de roles encontradas (correspondência parcial)
     */
    async findByIds(ids: string[]) {
        return this.roles
            .filter((r) => ids.includes(r.id))
            .map((r) => ({ ...r, permissions: [...r.permissions] }));
    }

    /**
     * Busca uma role pelo nome.
     *
     * @param name - Nome da role
     * @returns Role encontrada ou `null`
     */
    async findByName(name: string) {
        const role = this.roles.find((r) => r.name === name);
        return role ? { ...role, permissions: [...role.permissions] } : null;
    }

    /**
     * Cria uma nova role no array em memória.
     * Gera UUID, timestamps e inicializa permissions como array vazio.
     *
     * @param data - Dados de criação: name e description
     * @returns Role criada
     */
    async create(data: { name: string; description: string }) {
        const now = new Date();
        const role: FakeRole = {
            id: randomUUID(),
            name: data.name,
            description: data.description,
            created_at: now,
            updated_at: now,
            permissions: [],
        };

        this.roles.push(role);
        return { ...role, permissions: [...role.permissions] };
    }

    /**
     * Atualiza uma role existente no array em memória.
     * Para `permissions`, substitui o array completo.
     *
     * @param id - UUID da role a atualizar
     * @param data - Campos a atualizar (name, description, permissions)
     * @returns Role atualizada com permissões, ou `null` se não encontrada
     */
    async save(
        id: string,
        data: {
            name?: string;
            description?: string;
            permissions?: string[];
        },
    ) {
        const role = this.roles.find((r) => r.id === id);
        if (!role) return null;

        if (data.name !== undefined) role.name = data.name;
        if (data.description !== undefined) role.description = data.description;

        if (data.permissions !== undefined) {
            role.permissions = data.permissions.map((permId) => ({
                id: permId,
                name: '',
                description: '',
            }));
        }

        role.updated_at = new Date();
        return { ...role, permissions: [...role.permissions] };
    }

    /**
     * Reinicia o array de roles em memória.
     * Utilizado entre testes para garantir isolamento.
     */
    reset() {
        this.roles = [];
    }
}

export default new FakeRolesRepository();
