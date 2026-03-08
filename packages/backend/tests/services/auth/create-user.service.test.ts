/**
 * Testes unitários do serviço de criação de usuários.
 *
 * Valida a criação bem-sucedida de usuário com senha hasheada
 * e a rejeição de email duplicado.
 */

import { AppError } from '../../../src/errors/AppError.js';

import fakeUsersRepo from '../../fakes/auth/fake-users.repository.js';
import fakeHashProvider from '../../fakes/auth/fake-hash.provider.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/hash.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-hash.provider.js');
    return { default: fake.default };
});

const { default: createUserService } = await import(
    '../../../src/services/auth/create-user.service.js'
);

/** @group CreateUserService */
describe('CreateUserService', () => {
    /** Reinicia o repositório fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepo.reset();
    });

    /** Deve criar um usuário com senha hasheada e retornar os dados públicos. */
    it('deve criar um usuário com senha hasheada', async () => {
        const result = await createUserService.execute({
            name: 'Novo Usuário',
            email: 'novo@test.com',
            password: 'senha123',
        });

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name', 'Novo Usuário');
        expect(result).toHaveProperty('email', 'novo@test.com');
        expect(result).not.toHaveProperty('password');
    });

    /** Deve lançar AppError 400 quando o email já está em uso por outro usuário. */
    it('deve lançar erro para email duplicado', async () => {
        await createUserService.execute({
            name: 'Primeiro',
            email: 'duplicado@test.com',
            password: 'senha123',
        });

        await expect(
            createUserService.execute({
                name: 'Segundo',
                email: 'duplicado@test.com',
                password: 'outrasenha',
            }),
        ).rejects.toMatchObject({
            message: 'Email address already used',
            statusCode: 400,
        });
    });
});
