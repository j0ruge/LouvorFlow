/**
 * Testes unitários do serviço de atribuição de permissões a roles.
 *
 * Valida a associação de permissões válidas a uma role existente,
 * rejeição de role inexistente e rejeição de permissões inexistentes.
 */

import { AppError } from '../../../src/errors/AppError.js';

import fakeRolesRepo from '../../fakes/auth/fake-roles.repository.js';
import fakePermissionsRepo from '../../fakes/auth/fake-permissions.repository.js';

/**
 * Substitui o repositório real de roles pelo fake para isolamento de testes.
 * @returns Módulo com o export default apontando para o repositório fake de roles.
 */
vi.mock('../../../src/repositories/auth/roles.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-roles.repository.js');
    return { default: fake.default };
});

/**
 * Substitui o repositório real de permissões pelo fake para isolamento de testes.
 * @returns Módulo com o export default apontando para o repositório fake de permissões.
 */
vi.mock('../../../src/repositories/auth/permissions.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-permissions.repository.js');
    return { default: fake.default };
});

const { default: createRolePermissionService } = await import(
    '../../../src/services/auth/create-role-permissions.service.js'
);

/**
 * Suite de testes do serviço CreateRolePermissionService.
 * Cobre cenários de atribuição de permissões válidas a uma role,
 * rejeição de role inexistente e rejeição de permissões inexistentes.
 */
describe('CreateRolePermissionService', () => {
    /** Reinicia os repositórios fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeRolesRepo.reset();
        fakePermissionsRepo.reset();
    });

    /** Deve atribuir permissões válidas a uma role existente. */
    it('deve atribuir permissões a uma role', async () => {
        const role = await fakeRolesRepo.create({
            name: 'admin',
            description: 'Administrador',
        });

        const perm1 = await fakePermissionsRepo.create({
            name: 'create_user',
            description: 'Permite criar usuários',
        });

        const perm2 = await fakePermissionsRepo.create({
            name: 'delete_user',
            description: 'Permite deletar usuários',
        });

        const result = await createRolePermissionService.execute({
            roleId: role.id,
            permissions: [perm1.id, perm2.id],
        });

        expect(result).toHaveProperty('id', role.id);
        expect(result).toHaveProperty('permissions');
        expect(result!.permissions).toHaveLength(2);
    });

    /** Deve lançar AppError 400 quando a role informada não existe no repositório. */
    it('deve lançar erro para role inexistente', async () => {
        await expect(
            createRolePermissionService.execute({
                roleId: 'non-existent-id',
                permissions: ['perm-1'],
            }),
        ).rejects.toMatchObject({
            message: 'Role not found',
            statusCode: 400,
        });
    });

    /** Deve lançar AppError 400 quando alguma permissão informada não existe. */
    it('deve lançar erro para permissões inexistentes', async () => {
        const role = await fakeRolesRepo.create({
            name: 'editor',
            description: 'Editor de conteúdo',
        });

        const validPerm = await fakePermissionsRepo.create({
            name: 'edit_content',
            description: 'Permite editar conteúdo',
        });

        await expect(
            createRolePermissionService.execute({
                roleId: role.id,
                permissions: [validPerm.id, 'non-existent-perm-id'],
            }),
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});
