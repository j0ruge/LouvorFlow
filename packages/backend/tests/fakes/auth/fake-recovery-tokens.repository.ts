/**
 * Repositório fake de tokens de recuperação de senha para testes unitários.
 *
 * Utiliza arrays em memória para simular operações de persistência
 * sem dependência de banco de dados real.
 */
import { randomUUID } from 'node:crypto';

/** Representação interna de um recovery token no fake. */
interface FakeRecoveryToken {
    id: string;
    token: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
}

/** Representação simplificada de um usuário para inclusão na relação. */
interface FakeUserRef {
    id: string;
    name: string;
    email: string;
    password: string;
    avatar: string | null;
    created_at: Date;
    updated_at: Date;
}

class FakeRecoveryTokensRepository {
    /** Array em memória que simula a tabela de recovery tokens. */
    private tokens: FakeRecoveryToken[] = [];

    /** Mapa de usuários referenciados para simular a relação `include: { user }`. */
    private userRefs: Map<string, FakeUserRef> = new Map();

    /**
     * Registra uma referência de usuário para uso na relação `findByToken`.
     * Deve ser chamado nos testes para simular o include do Prisma.
     *
     * @param user - Dados do usuário a registrar como referência
     */
    setUserRef(user: FakeUserRef) {
        this.userRefs.set(user.id, user);
    }

    /**
     * Gera um novo token de recuperação de senha para o usuário.
     * O UUID do token é gerado automaticamente via `crypto.randomUUID()`.
     *
     * @param userId - UUID do usuário que solicitou a recuperação
     * @returns Registro de recovery token criado (com token UUID auto-gerado)
     */
    async generate(userId: string) {
        const now = new Date();
        const recoveryToken: FakeRecoveryToken = {
            id: randomUUID(),
            token: randomUUID(),
            user_id: userId,
            created_at: now,
            updated_at: now,
        };

        this.tokens.push(recoveryToken);
        return { ...recoveryToken };
    }

    /**
     * Busca um token de recuperação pelo valor do token,
     * incluindo a relação com o usuário associado (simulada via userRefs).
     *
     * @param token - UUID do token de recuperação
     * @returns Registro com usuário incluído ou `null` se não encontrado
     */
    async findByToken(token: string) {
        const record = this.tokens.find((t) => t.token === token);
        if (!record) return null;

        const user = this.userRefs.get(record.user_id) ?? null;
        return { ...record, user };
    }

    /**
     * Remove um token de recuperação pelo ID do registro.
     * Utilizado após redefinição de senha para invalidar o token.
     *
     * @param id - UUID do registro de recovery token
     */
    async deleteById(id: string) {
        const index = this.tokens.findIndex((t) => t.id === id);
        if (index >= 0) {
            this.tokens.splice(index, 1);
        }
    }

    /**
     * Remove todos os tokens de recuperação de um usuário.
     * Utilizado antes de gerar um novo token para evitar acúmulo.
     *
     * @param userId - UUID do usuário
     * @returns Contagem de registros removidos
     */
    async deleteAllByUserId(userId: string) {
        const before = this.tokens.length;
        this.tokens = this.tokens.filter((t) => t.user_id !== userId);
        return { count: before - this.tokens.length };
    }

    /**
     * Reinicia os arrays de tokens e referências de usuário em memória.
     * Utilizado entre testes para garantir isolamento.
     */
    reset() {
        this.tokens = [];
        this.userRefs = new Map();
    }
}

export default new FakeRecoveryTokensRepository();
