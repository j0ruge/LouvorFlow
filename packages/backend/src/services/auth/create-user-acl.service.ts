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
     * Busca o usuário pelo ID, valida que todos os IDs de roles e permissões
     * existem no banco, e persiste a nova ACL substituindo os vínculos anteriores.
     *
     * @param dto - Objeto contendo userId, array de IDs de roles e array de IDs de permissões.
     * @returns Usuário atualizado com as novas roles e permissões.
     * @throws AppError 404 se o usuário não for encontrado.
     * @throws AppError 400 se alguma role ou permissão informada não existir.
     */
    async execute({ userId, roles, permissions }: ICreateUserAccessControlListDTO) {
        const user = await usersRepository.findById(userId);

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const foundRoles = await rolesRepository.findByIds(roles);
        const foundRoleIds = foundRoles.map((role) => role.id);

        const missingRoleIds = roles.filter((id) => !foundRoleIds.includes(id));
        if (missingRoleIds.length > 0) {
            throw new AppError(
                `Roles não encontradas: ${missingRoleIds.join(', ')}`,
                400,
            );
        }

        const foundPermissions = await permissionsRepository.findByIds(permissions);
        const foundPermissionIds = foundPermissions.map((permission) => permission.id);

        const missingPermissionIds = permissions.filter((id) => !foundPermissionIds.includes(id));
        if (missingPermissionIds.length > 0) {
            throw new AppError(
                `Permissões não encontradas: ${missingPermissionIds.join(', ')}`,
                400,
            );
        }

        const updatedUser = await usersRepository.save(userId, {
            roles: foundRoleIds,
            permissions: foundPermissionIds,
        });

        return updatedUser;
    }
}

export default new CreateUserAccessControlListService();
