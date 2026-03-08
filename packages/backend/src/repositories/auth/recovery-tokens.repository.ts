/**
 * Repositório Prisma para operações de persistência de tokens de recuperação de senha.
 *
 * Encapsula todas as queries relacionadas ao model `UsersRecoveryTokens`,
 * gerenciando a geração e busca de tokens para o fluxo de redefinição de senha.
 */
import prisma from '../../../prisma/cliente.js';

class RecoveryTokensRepository {
    /**
     * Gera um novo token de recuperação de senha para o usuário.
     * O UUID do token é gerado automaticamente pelo `@default(uuid())` do Prisma.
     *
     * @param userId - UUID do usuário que solicitou a recuperação
     * @returns Registro de recovery token criado (com token UUID auto-gerado)
     */
    async generate(userId: string) {
        return prisma.usersRecoveryTokens.create({
            data: { user_id: userId },
        });
    }

    /**
     * Busca um token de recuperação pelo valor do token,
     * incluindo a relação com o usuário associado.
     *
     * @param token - UUID do token de recuperação
     * @returns Registro com usuário incluído ou `null` se não encontrado
     */
    async findByToken(token: string) {
        return prisma.usersRecoveryTokens.findFirst({
            where: { token },
            include: { user: true },
        });
    }

    /**
     * Remove um token de recuperação pelo ID do registro.
     * Utilizado após redefinição de senha para invalidar o token.
     *
     * @param id - UUID do registro de recovery token
     * @returns Registro removido
     */
    async deleteById(id: string) {
        return prisma.usersRecoveryTokens.delete({
            where: { id },
        });
    }
}

export default new RecoveryTokensRepository();
