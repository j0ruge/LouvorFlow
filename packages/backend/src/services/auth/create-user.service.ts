/**
 * Serviço de criação de usuários.
 *
 * Valida unicidade do email, realiza o hash da senha
 * e persiste o novo usuário no banco de dados.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import hashProvider from '../../providers/hash.provider.js';
import type { ICreateUserDTO } from '../../types/auth.types.js';

class CreateUserService {
    /**
     * Cria um novo usuário no sistema.
     *
     * @param dto - Objeto contendo nome, email e senha do novo usuário.
     * @returns O usuário recém-criado.
     * @throws AppError 400 se o email já estiver em uso.
     */
    async execute({ name, email, password }: ICreateUserDTO) {
        const existingUser = await usersRepository.findByEmail(email);

        if (existingUser) {
            throw new AppError('Email address already used', 400);
        }

        const hashedPassword = await hashProvider.generateHash(password);

        const user = await usersRepository.create({
            name,
            email,
            password: hashedPassword,
        });

        return user;
    }
}

export default new CreateUserService();
