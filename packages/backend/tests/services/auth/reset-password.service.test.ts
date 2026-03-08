/**
 * Testes unitarios do servico ResetPasswordService.
 *
 * Valida a redefinicao de senha via token de recuperacao,
 * incluindo cenarios de token expirado e token inexistente.
 */

import fakeRecoveryTokensRepository from '../../fakes/auth/fake-recovery-tokens.repository.js';
import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import fakeDateProvider from '../../fakes/auth/fake-date.provider.js';
import { AppError } from '../../../src/errors/AppError.js';

vi.mock('../../../src/repositories/auth/recovery-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-recovery-tokens.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/hash.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-hash.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/date.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-date.provider.js');
    return { default: fake.default };
});

import service from '../../../src/services/auth/reset-password.service.js';

describe('ResetPasswordService', () => {
    /** Reinicia os repositorios e o provedor de data antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeRecoveryTokensRepository.reset();
        fakeUsersRepository.reset();
        fakeDateProvider.setCurrentDate(new Date());
    });

    /** Verifica que a senha do usuario e atualizada com um token valido dentro do prazo. */
    it('deve redefinir a senha com token valido', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'old-password',
        });

        fakeRecoveryTokensRepository.setUserRef({
            id: user.id,
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'old-password',
            avatar: null,
            created_at: new Date(),
            updated_at: new Date(),
        });

        const recoveryToken = await fakeRecoveryTokensRepository.generate(user.id);

        fakeDateProvider.setCurrentDate(new Date());

        await service.execute(recoveryToken.token, 'new-password');

        const fullUser = await fakeUsersRepository.findByEmail('joao@test.com');
        expect(fullUser).not.toBeNull();
        expect(fullUser!.password).toBe('new-password');
    });

    /** Verifica que um AppError e lancado quando o token esta expirado (mais de 2 horas). */
    it('deve lancar erro para token expirado', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Maria Souza',
            email: 'maria@test.com',
            password: 'old-password',
        });

        fakeRecoveryTokensRepository.setUserRef({
            id: user.id,
            name: 'Maria Souza',
            email: 'maria@test.com',
            password: 'old-password',
            avatar: null,
            created_at: new Date(),
            updated_at: new Date(),
        });

        const recoveryToken = await fakeRecoveryTokensRepository.generate(user.id);

        const threeHoursLater = new Date(recoveryToken.created_at);
        threeHoursLater.setHours(threeHoursLater.getHours() + 3);
        fakeDateProvider.setCurrentDate(threeHoursLater);

        await expect(
            service.execute(recoveryToken.token, 'new-password'),
        ).rejects.toThrow('Token expired');
    });

    /** Verifica que um AppError e lancado quando o token nao existe. */
    it('deve lancar erro para token inexistente', async () => {
        await expect(
            service.execute('nonexistent-token', 'newpass'),
        ).rejects.toThrow('Token does not exist');
    });
});
