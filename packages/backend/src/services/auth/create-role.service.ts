/**
 * Serviço de criação de roles (papéis de acesso).
 *
 * Valida unicidade do nome da role e persiste
 * o novo registro no banco de dados.
 */

import { AppError } from '../../errors/AppError.js';
import rolesRepository from '../../repositories/auth/roles.repository.js';
import type { ICreateRoleDTO } from '../../types/auth.types.js';

class CreateRoleService {
    /**
     * Cria uma nova role no sistema.
     *
     * @param dto - Objeto contendo nome e descrição da role.
     * @returns A role recém-criada.
     * @throws AppError 400 se já existir uma role com o mesmo nome.
     */
    async execute({ name, description }: ICreateRoleDTO) {
        const existingRole = await rolesRepository.findByName(name);

        if (existingRole) {
            throw new AppError('Role already exists', 400);
        }

        const role = await rolesRepository.create({ name, description });

        return role;
    }
}

export default new CreateRoleService();
