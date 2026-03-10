/**
 * Testes unitarios do servico CreateUserAccessControlListService.
 *
 * Valida a atribuicao de roles e permissoes a um usuario,
 * incluindo cenarios de usuario inexistente e IDs invalidos.
 */

import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import fakeRolesRepository from '../../fakes/auth/fake-roles.repository.js';
import fakePermissionsRepository from '../../fakes/auth/fake-permissions.repository.js';
import { AppError } from '../../../src/errors/AppError.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/roles.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-roles.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/permissions.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-permissions.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/auth/create-user-acl.service.js';

describe('CreateUserAccessControlListService', () => {
    /** Reinicia os repositorios fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepository.reset();
        fakeRolesRepository.reset();
        fakePermissionsRepository.reset();
    });

    /** Verifica que roles e permissoes validas sao atribuidas corretamente ao usuario. */
    it('deve atribuir roles e permissoes a um usuario', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'hashed-password',
        });

        const role = await fakeRolesRepository.create({
            name: 'admin',
            description: 'Administrador do sistema',
        });

        const permission = await fakePermissionsRepository.create({
            name: 'manage_users',
            description: 'Gerenciar usuarios',
        });

        const result = await service.execute({
            userId: user.id,
            roles: [role.id],
            permissions: [permission.id],
        });

        expect(result).toHaveProperty('id', user.id);
        expect(result).toHaveProperty('roles');
        expect(result).toHaveProperty('permissions');
    });

    /** Verifica que um AppError e lancado quando o usuario nao existe. */
    it('deve lancar erro para usuario inexistente', async () => {
        await expect(
            service.execute({
                userId: 'non-existent-id',
                roles: [],
                permissions: [],
            }),
        ).rejects.toThrow('Usuário não encontrado');
    });

    /** Verifica que um AppError e lancado quando IDs de roles inexistentes sao informados. */
    it('deve lancar erro para roles inexistentes', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Maria Souza',
            email: 'maria@test.com',
            password: 'hashed-password',
        });

        const role = await fakeRolesRepository.create({
            name: 'editor',
            description: 'Editor de conteudo',
        });

        await expect(
            service.execute({
                userId: user.id,
                roles: [role.id, 'non-existent-role-id'],
                permissions: [],
            }),
        ).rejects.toThrow('Roles não encontradas');
    });

    /** Verifica que um AppError e lancado quando IDs de permissoes inexistentes sao informados. */
    it('deve lancar erro para permissoes inexistentes', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Carlos Lima',
            email: 'carlos@test.com',
            password: 'hashed-password',
        });

        const permission = await fakePermissionsRepository.create({
            name: 'edit_content',
            description: 'Editar conteudo',
        });

        await expect(
            service.execute({
                userId: user.id,
                roles: [],
                permissions: [permission.id, 'non-existent-permission-id'],
            }),
        ).rejects.toThrow('Permissões não encontradas');
    });
});
