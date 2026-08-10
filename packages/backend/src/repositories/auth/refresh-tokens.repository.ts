/**
 * Repositório Prisma para operações de persistência de refresh tokens.
 *
 * Encapsula todas as queries relacionadas ao model `UsersRefreshTokens`,
 * gerenciando o ciclo de vida dos tokens de atualização de sessão.
 */
import prisma from '../../../prisma/cliente.js';

class RefreshTokensRepository {
    /**
     * Cria um novo registro de refresh token no banco de dados.
     *
     * @param data - Dados de criação: user_id, expires_date e refresh_token
     * @returns Registro de refresh token criado
     */
    async create(data: { user_id: string; expires_date: Date; refresh_token: string }) {
        return prisma.usersRefreshTokens.create({
            data,
        });
    }

    /**
     * Rotaciona atomicamente o refresh token: remove o token antigo e cria o novo
     * dentro de uma única transação.
     *
     * O `deleteMany` mantém a trava otimista (apenas uma requisição concorrente
     * obtém `count === 1`, bloqueando double-spend) e a transação garante que o
     * novo token só é persistido se o antigo foi consumido — se o `create` falhar,
     * o rollback preserva o token antigo e o usuário não fica deslogado.
     *
     * @param userId - UUID do usuário dono do token.
     * @param oldToken - Refresh token a ser consumido.
     * @param newData - Dados do novo refresh token a persistir.
     * @returns Objeto com a contagem de registros removidos (`count`). `0` quando o
     *   token antigo não existia (nenhum novo token é criado nesse caso).
     */
    async rotateAtomic(
        userId: string,
        oldToken: string,
        newData: { user_id: string; expires_date: Date; refresh_token: string },
    ): Promise<{ count: number }> {
        return prisma.$transaction(async (tx) => {
            const { count } = await tx.usersRefreshTokens.deleteMany({
                where: { user_id: userId, refresh_token: oldToken },
            });
            if (count === 0) return { count: 0 };
            await tx.usersRefreshTokens.create({ data: newData });
            return { count };
        });
    }

    /**
     * Substitui atomicamente TODOS os refresh tokens do usuário por um novo,
     * dentro de uma única transação (logout total + emissão da nova sessão).
     *
     * Garante que a remoção das sessões anteriores e a criação da nova sejam
     * atômicas: se o `create` falhar, o rollback evita deixar o usuário sem
     * nenhuma sessão válida.
     *
     * @param userId - UUID do usuário.
     * @param newData - Dados do novo refresh token a persistir.
     * @returns Registro de refresh token criado.
     */
    async replaceAllByUserId(
        userId: string,
        newData: { user_id: string; expires_date: Date; refresh_token: string },
    ) {
        return prisma.$transaction(async (tx) => {
            await tx.usersRefreshTokens.deleteMany({ where: { user_id: userId } });
            return tx.usersRefreshTokens.create({ data: newData });
        });
    }

    /**
     * Busca um refresh token pela combinação de user_id e token.
     *
     * @deprecated A rotação de tokens agora usa {@link rotateAtomic}; este método
     *   permanece apenas para compatibilidade e não é usado em caminhos de produção.
     * @param userId - UUID do usuário
     * @param token - Valor do refresh token
     * @returns Registro encontrado ou `null`
     */
    async findByUserIdAndRefreshToken(userId: string, token: string) {
        return prisma.usersRefreshTokens.findFirst({
            where: {
                user_id: userId,
                refresh_token: token,
            },
        });
    }

    /**
     * Remove um refresh token pelo ID do registro.
     *
     * @deprecated A rotação de tokens agora usa {@link rotateAtomic}; este método
     *   permanece apenas para compatibilidade e não é usado em caminhos de produção.
     * @param id - UUID do registro de refresh token
     * @returns Registro removido
     */
    async deleteById(id: string) {
        return prisma.usersRefreshTokens.delete({
            where: { id },
        });
    }

    /**
     * Remove atomicamente o refresh token correspondente ao par (user_id, token).
     *
     * Usa `deleteMany`, cuja contagem de linhas afetadas atua como trava otimista:
     * em chamadas concorrentes com o mesmo token apenas uma obtém `count === 1`
     * (a linha é removida uma única vez pelo lock de linha do Postgres), evitando
     * a emissão dupla de sessões durante a rotação de tokens.
     *
     * @param userId - UUID do usuário dono do token.
     * @param token - Valor do refresh token a ser consumido.
     * @returns Objeto com a contagem de registros removidos (`count`).
     */
    async deleteByUserIdAndRefreshToken(
        userId: string,
        token: string,
    ): Promise<{ count: number }> {
        return prisma.usersRefreshTokens.deleteMany({
            where: { user_id: userId, refresh_token: token },
        });
    }

    /**
     * Remove todos os refresh tokens de um usuário.
     * Utilizado em operações de logout completo ou revogação de sessões.
     *
     * @param userId - UUID do usuário
     * @returns Contagem de registros removidos
     */
    async deleteAllByUserId(userId: string) {
        return prisma.usersRefreshTokens.deleteMany({
            where: { user_id: userId },
        });
    }
}

export default new RefreshTokensRepository();
