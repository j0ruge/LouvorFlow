/**
 * Serviço de listagem da lista de controle de acesso (ACL) de um usuário.
 *
 * Retorna as roles e permissões diretas atribuídas ao usuário,
 * consolidadas em um único DTO para consumo pelo controller.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import type { IUserACLsDTO } from '../../types/auth.types.js';

class ListUserAccessControlListService {
    /**
     * Consulta a ACL completa de um usuário no contexto de um tenant.
     *
     * Busca o usuário pelo ID, carrega suas roles e permissões diretas
     * filtradas pelo tenant ativo, e retorna um DTO consolidado.
     *
     * @param userId - UUID do usuário cuja ACL será consultada.
     * @param tenantId - UUID do tenant ativo para filtrar roles e permissões.
     * @returns DTO com userId, name, roles e permissões do usuário.
     * @throws AppError 404 se o usuário não for encontrado.
     */
    async execute(userId: string, tenantId?: string): Promise<IUserACLsDTO> {
        const user = await usersRepository.findById(userId);

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const [roles, permissions] = await Promise.all([
            usersRepository.getUserRoles(userId, tenantId),
            usersRepository.getUserPermissions(userId, tenantId),
        ]);

        return {
            userId: user.id,
            name: user.name,
            roles,
            permissions,
        };
    }
}

export default new ListUserAccessControlListService();
