/**
 * Serviço de criação da lista de controle de acesso (ACL) de um usuário.
 *
 * Atribui roles e permissões diretas a um usuário existente,
 * substituindo os vínculos anteriores pelo novo conjunto fornecido.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import rolesRepository from '../../repositories/auth/roles.repository.js';
import permissionsRepository from '../../repositories/auth/permissions.repository.js';
import type { ICreateUserAccessControlListDTO } from '../../types/auth.types.js';

class CreateUserAccessControlListService {
    /**
     * Atribui roles e permissões a um usuário.
     *
     * Busca o usuário pelo ID, resolve os IDs válidos de roles e permissões
     * informados, e persiste a nova ACL substituindo os vínculos anteriores.
     *
     * @param dto - Objeto contendo userId, array de IDs de roles e array de IDs de permissões.
     * @returns Usuário atualizado com as novas roles e permissões.
     * @throws AppError 400 se o usuário não for encontrado.
     */
    async execute({ userId, roles, permissions }: ICreateUserAccessControlListDTO) {
        const user = await usersRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 400);
        }

        const foundRoles = await rolesRepository.findByIds(roles);
        const foundRoleIds = foundRoles.map((role) => role.id);

        const foundPermissions = await permissionsRepository.findByIds(permissions);
        const foundPermissionIds = foundPermissions.map((permission) => permission.id);

        const updatedUser = await usersRepository.save(userId, {
            roles: foundRoleIds,
            permissions: foundPermissionIds,
        });

        return updatedUser;
    }
}

export default new CreateUserAccessControlListService();
