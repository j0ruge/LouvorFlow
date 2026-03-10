/**
 * Testes unitarios do servico ListUserAccessControlListService.
 *
 * Valida a listagem da ACL (roles e permissoes) de um usuario,
 * incluindo cenario de usuario inexistente.
 */

import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import { AppError } from '../../../src/errors/AppError.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/auth/list-user-acl.service.js';

describe('ListUserAccessControlListService', () => {
    /** Reinicia o repositorio fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepository.reset();
    });

    /** Verifica que a ACL do usuario e retornada com userId, name, roles e permissions. */
    it('deve retornar a ACL do usuario', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'hashed-password',
        });

        const result = await service.execute(user.id);

        expect(result).toHaveProperty('userId', user.id);
        expect(result).toHaveProperty('name', 'Joao Silva');
        expect(result).toHaveProperty('roles');
        expect(result).toHaveProperty('permissions');
        expect(Array.isArray(result.roles)).toBe(true);
        expect(Array.isArray(result.permissions)).toBe(true);
    });

    /** Verifica que um AppError e lancado quando o usuario nao existe. */
    it('deve lancar erro para usuario inexistente', async () => {
        await expect(
            service.execute('non-existent-id'),
        ).rejects.toThrow('Usuário não encontrado');
    });
});
