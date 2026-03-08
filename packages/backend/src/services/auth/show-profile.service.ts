/**
 * Serviço de exibição de perfil do usuário.
 *
 * Busca e retorna os dados públicos do usuário autenticado
 * (sem senha), incluindo roles e permissões carregadas.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import type { IShowProfileDTO } from '../../types/auth.types.js';

class ShowProfileService {
    /**
     * Retorna os dados públicos do perfil de um usuário.
     *
     * Busca o usuário pelo ID fornecido no DTO. Os dados retornados
     * utilizam a seleção pública (USER_PUBLIC_SELECT), que exclui
     * o hash da senha e inclui roles e permissões.
     *
     * @param dto - Objeto contendo o user_id do usuário autenticado.
     * @returns Dados públicos do usuário com roles e permissões.
     * @throws AppError 400 se o usuário não for encontrado.
     */
    async execute({ user_id }: IShowProfileDTO) {
        const user = await usersRepository.findById(user_id);

        if (!user) {
            throw new AppError('User not found', 400);
        }

        return user;
    }
}

export default new ShowProfileService();
