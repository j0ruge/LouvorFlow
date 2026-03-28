/**
 * Repositório fake de tokens de convite para testes unitários.
 *
 * Utiliza arrays em memória para simular operações de persistência
 * sem dependência de banco de dados real.
 */
import { randomUUID } from 'node:crypto';

/** Representação interna de um invite token no fake. */
interface FakeInviteToken {
    id: string;
    token: string;
    tenant_id: string;
    created_by: string;
    expires_at: Date;
    used_at: Date | null;
    used_by: string | null;
    revoked_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

/** Referência simplificada de tenant para include simulado. */
interface FakeTenantRef {
    id: string;
    name: string;
}

/** Referência simplificada de usuário para include simulado. */
interface FakeUserRef {
    id: string;
    name: string;
}

class FakeConvitesRepository {
    /** Array em memória que simula a tabela invite_tokens. */
    private invites: FakeInviteToken[] = [];

    /** Mapa de tenants para simular a relação include tenant. */
    private tenantRefs: Map<string, FakeTenantRef> = new Map();

    /** Mapa de usuários para simular as relações include creator/user. */
    private userRefs: Map<string, FakeUserRef> = new Map();

    /**
     * Registra uma referência de tenant para uso nas relações.
     *
     * @param tenant - Dados do tenant a registrar
     */
    setTenantRef(tenant: FakeTenantRef) {
        this.tenantRefs.set(tenant.id, tenant);
    }

    /**
     * Registra uma referência de usuário para uso nas relações.
     *
     * @param user - Dados do usuário a registrar
     */
    setUserRef(user: FakeUserRef) {
        this.userRefs.set(user.id, user);
    }

    /**
     * Cria um novo token de convite no array em memória.
     *
     * @param tenantId - UUID do tenant
     * @param createdBy - UUID do criador
     * @param expiresAt - Data de expiração
     * @returns Registro criado com token UUID auto-gerado
     */
    async create(tenantId: string, createdBy: string, expiresAt: Date) {
        const now = new Date();
        const invite: FakeInviteToken = {
            id: randomUUID(),
            token: randomUUID(),
            tenant_id: tenantId,
            created_by: createdBy,
            expires_at: expiresAt,
            used_at: null,
            used_by: null,
            revoked_at: null,
            created_at: now,
            updated_at: now,
        };
        this.invites.push(invite);
        return { ...invite };
    }

    /**
     * Busca um convite pelo valor do token, incluindo relações simuladas.
     *
     * @param token - UUID do token
     * @returns Registro com tenant, creator e user incluídos ou null
     */
    async findByToken(token: string) {
        const record = this.invites.find((i) => i.token === token);
        if (!record) return null;

        const tenant = this.tenantRefs.get(record.tenant_id) ?? { id: record.tenant_id, name: 'Tenant' };
        const creator = this.userRefs.get(record.created_by) ?? { id: record.created_by, name: 'Creator' };
        const user = record.used_by ? (this.userRefs.get(record.used_by) ?? null) : null;

        return { ...record, tenant, creator, user };
    }

    /**
     * Lista todos os convites de um tenant com relações simuladas.
     *
     * @param tenantId - UUID do tenant
     * @returns Lista de convites com relações
     */
    async findAllByTenantId(tenantId: string) {
        return this.invites
            .filter((i) => i.tenant_id === tenantId)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
            .map((record) => ({
                ...record,
                creator: this.userRefs.get(record.created_by) ?? { id: record.created_by, name: 'Creator' },
                user: record.used_by ? (this.userRefs.get(record.used_by) ?? null) : null,
            }));
    }

    /**
     * Busca um convite pelo ID do registro.
     *
     * @param id - UUID do registro
     * @returns Registro ou null
     */
    async findById(id: string) {
        const record = this.invites.find((i) => i.id === id);
        return record ? { ...record } : null;
    }

    /**
     * Marca um convite como utilizado.
     *
     * @param id - UUID do registro
     * @param usedBy - UUID do usuário que aceitou
     * @returns Registro atualizado
     */
    async markAsUsed(id: string, usedBy: string) {
        const record = this.invites.find((i) => i.id === id);
        if (record) {
            record.used_at = new Date();
            record.used_by = usedBy;
            record.updated_at = new Date();
        }
        return record ? { ...record } : null;
    }

    /**
     * Marca um convite como revogado.
     *
     * @param id - UUID do registro
     * @returns Registro atualizado
     */
    async revokeById(id: string) {
        const record = this.invites.find((i) => i.id === id);
        if (record) {
            record.revoked_at = new Date();
            record.updated_at = new Date();
        }
        return record ? { ...record } : null;
    }

    /**
     * Popula o repositório com convites pré-definidos (helper para testes).
     *
     * @param invites - Array de convites a inserir
     */
    seed(invites: FakeInviteToken[]) {
        this.invites.push(...invites.map((i) => ({ ...i })));
    }

    /**
     * Reinicia os arrays em memória para isolamento entre testes.
     */
    reset() {
        this.invites = [];
        this.tenantRefs = new Map();
        this.userRefs = new Map();
    }
}

export default new FakeConvitesRepository();
