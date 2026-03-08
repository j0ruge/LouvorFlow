/**
 * Serviço de logout de usuários.
 *
 * Remove todos os refresh tokens do usuário no banco de dados,
 * invalidando todas as sessões ativas daquele usuário.
 */

import refreshTokensRepository from '../../repositories/auth/refresh-tokens.repository.js';
import type { ILogoutDTO } from '../../types/auth.types.js';

class LogoutUserService {
    /**
     * Realiza o logout removendo todos os refresh tokens do usuário.
     *
     * @param dto - Objeto contendo o ID do usuário a ser deslogado.
     */
    async execute({ user_id }: ILogoutDTO): Promise<void> {
        await refreshTokensRepository.deleteAllByUserId(user_id);
    }
}

export default new LogoutUserService();
