/**
 * Serviço de criação da lista de controle de acesso (ACL) de um usuário.
 *
 * Atribui roles e permissões diretas a um usuário existente,
 * substituindo os vínculos anteriores pelo novo conjunto fornecido.
 *
 * Inclui validações de segurança contra escalação de privilégios:
 * - Admins regulares não podem atribuir roles/permissions protegidas (super-admin)
 * - Admins regulares não podem editar suas próprias permissões
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import rolesRepository from '../../repositories/auth/roles.repository.js';
import permissionsRepository from '../../repositories/auth/permissions.repository.js';
import type { ICreateUserAccessControlListDTO } from '../../types/auth.types.js';
import { PROTECTED_ROLE_NAMES, PROTECTED_PERMISSION_NAMES } from '../../config/rbac.js';

class CreateUserAccessControlListService {
    /**
     * Atribui roles e permissões a um usuário com validação de privilégios.
     *
     * Busca o usuário pelo ID, valida que todos os IDs de roles e permissões
     * existem no banco, verifica restrições de segurança contra escalação de
     * privilégios, e persiste a nova ACL substituindo os vínculos anteriores.
     *
     * @param dto - Objeto contendo userId, arrays de IDs, tenantId e dados do caller.
     * @returns Usuário atualizado com as novas roles e permissões.
     * @throws AppError 404 se o usuário não for encontrado.
     * @throws AppError 400 se alguma role ou permissão informada não existir.
     * @throws AppError 403 se houver tentativa de escalação de privilégios.
     */
    async execute({
        userId,
        roles,
        permissions,
        tenantId,
        callerId,
        callerIsSuperAdmin,
    }: ICreateUserAccessControlListDTO & {
        tenantId: string;
        callerId: string;
        callerIsSuperAdmin: boolean;
    }) {
        /** Regra anti-self-elevation: admin regular não pode editar próprias permissões. */
        if (userId === callerId && !callerIsSuperAdmin) {
            throw new AppError('Não é permitido editar suas próprias permissões', 403);
        }

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

        /** Regra anti-escalação: admin regular não pode atribuir roles protegidas. */
        if (!callerIsSuperAdmin) {
            const protectedRoleAttempt = foundRoles.find((r) =>
                PROTECTED_ROLE_NAMES.includes(r.name),
            );
            if (protectedRoleAttempt) {
                throw new AppError(
                    `Apenas super-administradores podem atribuir a role "${protectedRoleAttempt.name}"`,
                    403,
                );
            }
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

        /** Regra anti-escalação: admin regular não pode atribuir permissions protegidas. */
        if (!callerIsSuperAdmin) {
            const protectedPermAttempt = foundPermissions.find((p) =>
                PROTECTED_PERMISSION_NAMES.includes(p.name),
            );
            if (protectedPermAttempt) {
                throw new AppError(
                    `Apenas super-administradores podem atribuir a permissão "${protectedPermAttempt.name}"`,
                    403,
                );
            }
        }

        const updatedUser = await usersRepository.save(userId, {
            roles: foundRoleIds,
            permissions: foundPermissionIds,
            tenantId,
        });

        return updatedUser;
    }
}

export default new CreateUserAccessControlListService();
