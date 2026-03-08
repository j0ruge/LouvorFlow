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
     * Busca um refresh token pela combinação de user_id e token.
     *
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
     * @param id - UUID do registro de refresh token
     * @returns Registro removido
     */
    async deleteById(id: string) {
        return prisma.usersRefreshTokens.delete({
            where: { id },
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
