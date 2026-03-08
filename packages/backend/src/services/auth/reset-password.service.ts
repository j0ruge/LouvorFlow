/**
 * Serviço de redefinição de senha do usuário.
 *
 * Valida o token de recuperação, verifica se não expirou (limite de 2 horas),
 * gera o hash da nova senha e persiste a atualização no banco de dados.
 */

import { AppError } from '../../errors/AppError.js';
import recoveryTokensRepository from '../../repositories/auth/recovery-tokens.repository.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import hashProvider from '../../providers/hash.provider.js';
import dateProvider from '../../providers/date.provider.js';

class ResetPasswordService {
    /**
     * Redefine a senha do usuário a partir de um token de recuperação.
     *
     * Busca o token de recuperação, verifica se ainda é válido (não expirou
     * após 2 horas), gera o hash da nova senha e atualiza o registro do
     * usuário associado ao token.
     *
     * @param token - UUID do token de recuperação recebido por email.
     * @param password - Nova senha em texto plano a ser definida.
     * @throws AppError 400 se o token não existir.
     * @throws AppError 400 se o token estiver expirado (mais de 2 horas).
     */
    async execute(token: string, password: string): Promise<void> {
        const recoveryToken = await recoveryTokensRepository.findByToken(token);

        if (!recoveryToken) {
            throw new AppError('Token does not exist', 400);
        }

        const hoursSinceCreation = dateProvider.compareInHours(
            recoveryToken.created_at,
            dateProvider.dateNow(),
        );

        if (hoursSinceCreation > 2) {
            throw new AppError('Token expired', 400);
        }

        const userId = recoveryToken.user_id;
        const hashedPassword = await hashProvider.generateHash(password);

        await usersRepository.save(userId, { password: hashedPassword });

        await recoveryTokensRepository.deleteById(recoveryToken.id);
    }
}

export default new ResetPasswordService();
