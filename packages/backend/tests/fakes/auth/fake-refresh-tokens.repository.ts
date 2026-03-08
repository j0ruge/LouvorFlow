/**
 * Repositório fake de refresh tokens para testes unitários.
 *
 * Utiliza arrays em memória para simular operações de persistência
 * sem dependência de banco de dados real.
 */
import { randomUUID } from 'node:crypto';

/** Representação interna de um refresh token no fake. */
interface FakeRefreshToken {
    id: string;
    user_id: string;
    refresh_token: string;
    expires_date: Date;
    created_at: Date;
    updated_at: Date;
}

class FakeRefreshTokensRepository {
    /** Array em memória que simula a tabela de refresh tokens. */
    private tokens: FakeRefreshToken[] = [];

    /**
     * Cria um novo registro de refresh token no array em memória.
     *
     * @param data - Dados de criação: user_id, expires_date e refresh_token
     * @returns Registro de refresh token criado
     */
    async create(data: { user_id: string; expires_date: Date; refresh_token: string }) {
        const now = new Date();
        const token: FakeRefreshToken = {
            id: randomUUID(),
            user_id: data.user_id,
            refresh_token: data.refresh_token,
            expires_date: data.expires_date,
            created_at: now,
            updated_at: now,
        };

        this.tokens.push(token);
        return { ...token };
    }

    /**
     * Busca um refresh token pela combinação de user_id e token.
     *
     * @param userId - UUID do usuário
     * @param token - Valor do refresh token
     * @returns Registro encontrado ou `null`
     */
    async findByUserIdAndRefreshToken(userId: string, token: string) {
        return this.tokens.find(
            (t) => t.user_id === userId && t.refresh_token === token,
        ) ?? null;
    }

    /**
     * Remove um refresh token pelo ID do registro.
     *
     * @param id - UUID do registro de refresh token
     * @returns Registro removido ou `undefined` se não encontrado
     */
    async deleteById(id: string) {
        const idx = this.tokens.findIndex((t) => t.id === id);
        if (idx === -1) return undefined;
        const [removed] = this.tokens.splice(idx, 1);
        return removed;
    }

    /**
     * Remove todos os refresh tokens de um usuário.
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
     * Reinicia o array de tokens em memória.
     * Utilizado entre testes para garantir isolamento.
     */
    reset() {
        this.tokens = [];
    }
}

export default new FakeRefreshTokensRepository();
