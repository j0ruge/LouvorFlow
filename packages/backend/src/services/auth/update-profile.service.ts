/**
 * Serviço de atualização de perfil do usuário.
 *
 * Permite alterar nome, email e senha do usuário autenticado.
 * Para troca de senha, exige confirmação da senha anterior.
 * Valida unicidade do email quando alterado.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import hashProvider from '../../providers/hash.provider.js';
import type { IUpdateProfileDTO } from '../../types/auth.types.js';

class UpdateProfileService {
    /**
     * Atualiza os dados de perfil de um usuário.
     *
     * Busca o usuário pelo ID, valida unicidade do novo email (se alterado),
     * e quando uma nova senha é fornecida, exige a senha anterior para confirmação.
     * A senha antiga é verificada contra o hash armazenado via `findByEmail`,
     * que retorna o registro completo incluindo o campo de senha.
     *
     * @param dto - Objeto contendo user_id, name, email e opcionalmente old_password e password.
     * @returns Usuário atualizado com dados públicos (sem senha).
     * @throws AppError 400 se o usuário não for encontrado.
     * @throws AppError 400 se o email já estiver em uso por outro usuário.
     * @throws AppError 400 se a nova senha for informada sem a senha anterior.
     * @throws AppError 400 se a senha anterior não corresponder ao hash armazenado.
     */
    async execute({ user_id, name, email, old_password, password }: IUpdateProfileDTO) {
        const user = await usersRepository.findById(user_id);

        if (!user) {
            throw new AppError('User not found', 400);
        }

        if (email && email !== user.email) {
            const userWithSameEmail = await usersRepository.findByEmail(email);

            if (userWithSameEmail && userWithSameEmail.id !== user_id) {
                throw new AppError('Email address already used', 400);
            }
        }

        let hashedPassword: string | undefined;

        if (password) {
            if (!old_password) {
                throw new AppError('Old password is required to set a new password', 400);
            }

            const fullUser = await usersRepository.findByEmail(user.email);

            if (!fullUser) {
                throw new AppError('User not found', 400);
            }

            const passwordMatched = await hashProvider.compareHash(
                old_password,
                fullUser.password,
            );

            if (!passwordMatched) {
                throw new AppError('Old password does not match', 400);
            }

            hashedPassword = await hashProvider.generateHash(password);
        }

        const updateData = {
            ...(name !== undefined ? { name } : {}),
            ...(email !== undefined ? { email } : {}),
            ...(hashedPassword ? { password: hashedPassword } : {}),
        };

        const updatedUser = await usersRepository.save(user_id, updateData);

        return updatedUser;
    }
}

export default new UpdateProfileService();
