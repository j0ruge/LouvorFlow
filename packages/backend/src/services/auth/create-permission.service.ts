/**
 * Serviço de criação de permissões.
 *
 * Valida unicidade do nome da permissão e persiste
 * o novo registro no banco de dados.
 */

import { AppError } from '../../errors/AppError.js';
import permissionsRepository from '../../repositories/auth/permissions.repository.js';
import type { ICreatePermissionDTO } from '../../types/auth.types.js';

class CreatePermissionService {
    /**
     * Cria uma nova permissão no sistema.
     *
     * @param dto - Objeto contendo nome e descrição da permissão.
     * @returns A permissão recém-criada.
     * @throws AppError 400 se já existir uma permissão com o mesmo nome.
     */
    async execute({ name, description }: ICreatePermissionDTO) {
        const existingPermission =
            await permissionsRepository.findByName(name);

        if (existingPermission) {
            throw new AppError('Permission already exists', 400);
        }

        const permission = await permissionsRepository.create({
            name,
            description,
        });

        return permission;
    }
}

export default new CreatePermissionService();
