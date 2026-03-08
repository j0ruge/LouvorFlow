/**
 * Testes unitários do serviço de autenticação de usuários.
 *
 * Valida os cenários de login com credenciais válidas, email inexistente
 * e senha incorreta, garantindo que tokens são gerados corretamente
 * e que erros adequados são lançados.
 */

import { AppError } from '../../../src/errors/AppError.js';

import fakeUsersRepo from '../../fakes/auth/fake-users.repository.js';
import fakeHashProvider from '../../fakes/auth/fake-hash.provider.js';
import fakeTokenProvider from '../../fakes/auth/fake-token.provider.js';
import fakeRefreshTokensRepo from '../../fakes/auth/fake-refresh-tokens.repository.js';
import fakeDateProvider from '../../fakes/auth/fake-date.provider.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/hash.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-hash.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/token.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-token.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/refresh-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-refresh-tokens.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/date.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-date.provider.js');
    return { default: fake.default };
});

const { default: authenticateUserService } = await import(
    '../../../src/services/auth/authenticate-user.service.js'
);

/** @group AuthenticateUserService */
describe('AuthenticateUserService', () => {
    /** Reinicia os repositórios fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepo.reset();
        fakeRefreshTokensRepo.reset();
    });

    /** Deve autenticar com credenciais válidas e retornar usuário, token e refresh token. */
    it('deve autenticar com credenciais válidas', async () => {
        await fakeUsersRepo.create({
            name: 'Test',
            email: 'test@test.com',
            password: 'password123',
        });

        const result = await authenticateUserService.execute({
            email: 'test@test.com',
            password: 'password123',
        });

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('refresh_token');
        expect(result.user.email).toBe('test@test.com');
        expect(result.token).toEqual(expect.any(String));
        expect(result.refresh_token).toEqual(expect.any(String));
    });

    /** Deve lançar AppError 401 quando o email fornecido não existe no repositório. */
    it('deve lançar erro para email inexistente', async () => {
        await fakeUsersRepo.create({
            name: 'Test',
            email: 'test@test.com',
            password: 'password123',
        });

        await expect(
            authenticateUserService.execute({
                email: 'wrong@test.com',
                password: 'any',
            }),
        ).rejects.toMatchObject({
            message: 'Incorrect email/password combination',
            statusCode: 401,
        });
    });

    /** Deve lançar AppError 401 quando a senha fornecida não corresponde ao hash armazenado. */
    it('deve lançar erro para senha incorreta', async () => {
        await fakeUsersRepo.create({
            name: 'Test',
            email: 'test@test.com',
            password: 'password123',
        });

        await expect(
            authenticateUserService.execute({
                email: 'test@test.com',
                password: 'wrong',
            }),
        ).rejects.toMatchObject({
            message: 'Incorrect email/password combination',
            statusCode: 401,
        });
    });
});
