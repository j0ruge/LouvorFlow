/**
 * Repositório fake de usuários para testes unitários.
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
    permissions: FakePermission[];
}

/** Representação interna completa de um usuário no fake. */
interface FakeUser {
    id: string;
    name: string;
    email: string;
    password: string;
    avatar: string | null;
    created_at: Date;
    updated_at: Date;
    roles: FakeRole[];
    permissions: FakePermission[];
}

/**
 * Remove o campo `password` de um usuário, retornando apenas dados públicos.
 *
 * @param user - Usuário completo com senha
 * @returns Usuário sem o campo password
 */
function sanitize(user: FakeUser) {
    const { password: _, ...publicUser } = user;
    return publicUser;
}

class FakeUsersRepository {
    /** Array em memória que simula a tabela de usuários. */
    private users: FakeUser[] = [];

    /**
     * Busca um usuário pelo ID, retornando sem o campo de senha.
     *
     * @param id - UUID do usuário
     * @returns Usuário sanitizado ou `null` se não encontrado
     */
    async findById(id: string) {
        const user = this.users.find((u) => u.id === id);
        return user ? sanitize(user) : null;
    }

    /**
     * Busca um usuário pelo email (case-insensitive),
     * retornando o registro completo incluindo a senha
     * para comparação no fluxo de autenticação.
     *
     * @param email - Email do usuário
     * @returns Usuário completo (com senha) ou `null` se não encontrado
     */
    async findByEmail(email: string) {
        const normalizedEmail = email.toLowerCase();
        return this.users.find((u) => u.email.toLowerCase() === normalizedEmail) ?? null;
    }

    /**
     * Retorna as permissões diretas atribuídas ao usuário.
     *
     * @param id - UUID do usuário
     * @returns Array de permissões diretas do usuário
     */
    async getUserPermissions(id: string) {
        const user = this.users.find((u) => u.id === id);
        return user ? [...user.permissions] : [];
    }

    /**
     * Retorna as roles atribuídas ao usuário com suas permissões carregadas.
     *
     * @param id - UUID do usuário
     * @returns Array de roles com permissões
     */
    async getUserRoles(id: string) {
        const user = this.users.find((u) => u.id === id);
        return user ? user.roles.map((r) => ({ ...r, permissions: [...r.permissions] })) : [];
    }

    /**
     * Cria um novo usuário no array em memória.
     * Gera UUID, timestamps e inicializa roles/permissions como arrays vazios.
     *
     * @param data - Dados de criação: name, email e password (hash)
     * @returns Usuário criado sem o campo password
     */
    async create(data: { name: string; email: string; password: string }) {
        const now = new Date();
        const user: FakeUser = {
            id: randomUUID(),
            name: data.name,
            email: data.email,
            password: data.password,
            avatar: null,
            created_at: now,
            updated_at: now,
            roles: [],
            permissions: [],
        };

        this.users.push(user);
        return sanitize(user);
    }

    /**
     * Atualiza um usuário existente no array em memória.
     * Para `roles` e `permissions`, substitui o array completo.
     *
     * @param id - UUID do usuário a atualizar
     * @param data - Campos a atualizar (name, email, password, avatar, roles, permissions)
     * @returns Usuário atualizado sem o campo password, ou `null` se não encontrado
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
        const user = this.users.find((u) => u.id === id);
        if (!user) return null;

        if (data.name !== undefined) user.name = data.name;
        if (data.email !== undefined) user.email = data.email;
        if (data.password !== undefined) user.password = data.password;
        if (data.avatar !== undefined) user.avatar = data.avatar;

        if (data.roles !== undefined) {
            user.roles = data.roles.map((roleId) => ({
                id: roleId,
                name: '',
                description: '',
                permissions: [],
            }));
        }

        if (data.permissions !== undefined) {
            user.permissions = data.permissions.map((permId) => ({
                id: permId,
                name: '',
                description: '',
            }));
        }

        user.updated_at = new Date();
        return sanitize(user);
    }

    /**
     * Reinicia o array de usuários em memória.
     * Utilizado entre testes para garantir isolamento.
     */
    reset() {
        this.users = [];
    }
}

export default new FakeUsersRepository();
