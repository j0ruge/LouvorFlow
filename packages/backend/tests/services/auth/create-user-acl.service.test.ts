/**
 * Testes unitarios do servico CreateUserAccessControlListService.
 *
 * Valida a atribuicao de roles e permissoes a um usuario,
 * incluindo cenarios de usuario inexistente e IDs invalidos.
 */

import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import fakeRolesRepository from '../../fakes/auth/fake-roles.repository.js';
import fakePermissionsRepository from '../../fakes/auth/fake-permissions.repository.js';
import { HASH_TESTE } from '../../fakes/mock-data.js';

/** Mock hoisted do `prisma.tenantUsers.findFirst` para controlar a verificação de pertencimento ao tenant. */
const { mockTenantUsersFindFirst } = vi.hoisted(() => ({
    mockTenantUsersFindFirst: vi.fn(),
}));

vi.mock('../../../prisma/cliente.js', () => ({
    default: {
        tenantUsers: {
            findFirst: (...args: unknown[]) => mockTenantUsersFindFirst(...args),
        },
    },
}));

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
        /** Por padrão, o usuário-alvo pertence ao tenant (vínculo encontrado). */
        mockTenantUsersFindFirst.mockReset();
        mockTenantUsersFindFirst.mockResolvedValue({ id: 'link-id' });
    });

    /** Verifica que roles e permissoes validas sao atribuidas corretamente ao usuario. */
    it('deve atribuir roles e permissoes a um usuario', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: HASH_TESTE,
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
            tenantId: 'tenant-test-id',
            callerId: 'caller-test-id',
            callerIsSuperAdmin: true,
        });

        expect(result).toHaveProperty('id', user.id);
        expect(result).toHaveProperty('roles');
        expect(result).toHaveProperty('permissions');
    });

    /** Verifica que um AppError 403 e lancado quando o usuario-alvo nao pertence ao tenant ativo. */
    it('deve lancar erro 403 quando usuario nao pertence ao tenant', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Forasteiro',
            email: 'forasteiro@test.com',
            password: HASH_TESTE,
        });
        mockTenantUsersFindFirst.mockResolvedValueOnce(null);

        await expect(
            service.execute({
                userId: user.id,
                roles: [],
                permissions: [],
                tenantId: 'tenant-test-id',
                callerId: 'caller-test-id',
                callerIsSuperAdmin: false,
            }),
        ).rejects.toMatchObject({
            statusCode: 403,
            message: 'Usuário não pertence a esta igreja',
        });
    });

    /** Verifica que um AppError e lancado quando o usuario nao existe. */
    it('deve lancar erro para usuario inexistente', async () => {
        await expect(
            service.execute({
                userId: 'non-existent-id',
                roles: [],
                permissions: [],
                tenantId: 'tenant-test-id',
                callerId: 'caller-test-id',
                callerIsSuperAdmin: false,
            }),
        ).rejects.toThrow('Usuário não encontrado');
    });

    /** Verifica que um AppError e lancado quando IDs de roles inexistentes sao informados. */
    it('deve lancar erro para roles inexistentes', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Maria Souza',
            email: 'maria@test.com',
            password: HASH_TESTE,
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
                tenantId: 'tenant-test-id',
                callerId: 'caller-test-id',
                callerIsSuperAdmin: false,
            }),
        ).rejects.toThrow('Roles não encontradas');
    });

    /** Verifica que um AppError e lancado quando IDs de permissoes inexistentes sao informados. */
    it('deve lancar erro para permissoes inexistentes', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Carlos Lima',
            email: 'carlos@test.com',
            password: HASH_TESTE,
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
                tenantId: 'tenant-test-id',
                callerId: 'caller-test-id',
                callerIsSuperAdmin: false,
            }),
        ).rejects.toThrow('Permissões não encontradas');
    });
});
