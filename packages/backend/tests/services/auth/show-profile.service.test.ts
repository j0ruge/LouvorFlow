/**
 * Testes unitarios do servico ShowProfileService.
 *
 * Valida a exibicao do perfil de um usuario autenticado,
 * incluindo cenario de usuario inexistente.
 */

import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import { AppError } from '../../../src/errors/AppError.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/auth/show-profile.service.js';

describe('ShowProfileService', () => {
    /** Reinicia o repositorio fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepository.reset();
    });

    /** Verifica que os dados publicos do perfil do usuario sao retornados corretamente. */
    it('deve retornar o perfil do usuario', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'hashed-password',
        });

        const result = await service.execute({ user_id: user.id });

        expect(result).toHaveProperty('id', user.id);
        expect(result).toHaveProperty('name', 'Joao Silva');
        expect(result).toHaveProperty('email', 'joao@test.com');
        expect(result).not.toHaveProperty('password');
    });

    /** Verifica que um AppError e lancado quando o usuario nao existe. */
    it('deve lancar erro para usuario inexistente', async () => {
        await expect(
            service.execute({ user_id: 'bad-id' }),
        ).rejects.toThrow('User not found');
    });
});
