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
     * Remove atomicamente o refresh token pelo par (user_id, token), simulando o
     * `deleteMany` do Prisma: retorna a contagem de registros removidos, usada como
     * trava otimista na rotação de tokens.
     *
     * @param userId - UUID do usuário dono do token.
     * @param token - Valor do refresh token a ser consumido.
     * @returns Objeto com a contagem de registros removidos (`count`).
     */
    async deleteByUserIdAndRefreshToken(userId: string, token: string): Promise<{ count: number }> {
        const before = this.tokens.length;
        this.tokens = this.tokens.filter(
            (t) => !(t.user_id === userId && t.refresh_token === token),
        );
        return { count: before - this.tokens.length };
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
     * Rotaciona atomicamente o token (simula a transação do Prisma): consome o
     * token antigo via trava otimista e, se removido, cria o novo.
     *
     * @param userId - UUID do usuário dono do token.
     * @param oldToken - Refresh token a ser consumido.
     * @param newData - Dados do novo refresh token a persistir.
     * @returns Objeto com a contagem de registros removidos (`count`).
     */
    async rotateAtomic(
        userId: string,
        oldToken: string,
        newData: { user_id: string; expires_date: Date; refresh_token: string },
    ): Promise<{ count: number }> {
        const { count } = await this.deleteByUserIdAndRefreshToken(userId, oldToken);
        if (count === 0) return { count: 0 };
        await this.create(newData);
        return { count };
    }

    /**
     * Substitui atomicamente todos os tokens do usuário por um novo (simula a
     * transação do Prisma): remove todos e cria o novo.
     *
     * @param userId - UUID do usuário.
     * @param newData - Dados do novo refresh token a persistir.
     * @returns Registro de refresh token criado.
     */
    async replaceAllByUserId(
        userId: string,
        newData: { user_id: string; expires_date: Date; refresh_token: string },
    ) {
        await this.deleteAllByUserId(userId);
        return this.create(newData);
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
