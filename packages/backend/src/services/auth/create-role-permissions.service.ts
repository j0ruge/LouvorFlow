/**
 * Serviço de atribuição de permissões a uma role.
 *
 * Valida a existência da role e das permissões informadas,
 * e associa as permissões encontradas à role no banco de dados.
 */

import { AppError } from '../../errors/AppError.js';
import rolesRepository from '../../repositories/auth/roles.repository.js';
import permissionsRepository from '../../repositories/auth/permissions.repository.js';
import type { ICreateRolePermissionsDTO } from '../../types/auth.types.js';

class CreateRolePermissionService {
    /**
     * Atribui uma lista de permissões a uma role existente.
     *
     * @param dto - Objeto contendo o ID da role e a lista de IDs de permissões.
     * @returns A role atualizada com as permissões associadas.
     * @throws AppError 400 se a role não for encontrada.
     */
    async execute({ roleId, permissions }: ICreateRolePermissionsDTO) {
        const role = await rolesRepository.findById(roleId);

        if (!role) {
            throw new AppError('Role not found', 400);
        }

        const foundPermissions =
            await permissionsRepository.findByIds(permissions);

        if (foundPermissions.length !== permissions.length) {
            const foundPermissionIds = foundPermissions.map((p) => p.id);
            const notFoundIds = permissions.filter(id => !foundPermissionIds.includes(id));
            throw new AppError(`Permissions not found: ${notFoundIds.join(', ')}`, 400);
        }

        const foundPermissionIds = foundPermissions.map((p) => p.id);

        const updatedRole = await rolesRepository.save(roleId, {
            permissions: foundPermissionIds,
        });

        return updatedRole;
    }
}

export default new CreateRolePermissionService();
