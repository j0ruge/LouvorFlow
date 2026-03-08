/**
 * Testes unitários do serviço de logout de usuários.
 *
 * Valida que todos os refresh tokens de um usuário são removidos
 * ao executar o logout, invalidando todas as sessões ativas.
 */

import fakeRefreshTokensRepo from '../../fakes/auth/fake-refresh-tokens.repository.js';

vi.mock('../../../src/repositories/auth/refresh-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-refresh-tokens.repository.js');
    return { default: fake.default };
});

const { default: logoutUserService } = await import(
    '../../../src/services/auth/logout-user.service.js'
);

/** @group LogoutUserService */
describe('LogoutUserService', () => {
    /** ID do usuário utilizado nos testes. */
    const userId = 'user-id-456';

    /** Reinicia o repositório fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeRefreshTokensRepo.reset();
    });

    /** Deve deletar todos os refresh tokens do usuário, invalidando suas sessões. */
    it('deve deletar todos os refresh tokens do usuário', async () => {
        await fakeRefreshTokensRepo.create({
            user_id: userId,
            refresh_token: 'token-1',
            expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        await fakeRefreshTokensRepo.create({
            user_id: userId,
            refresh_token: 'token-2',
            expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        await fakeRefreshTokensRepo.create({
            user_id: 'other-user-id',
            refresh_token: 'token-3',
            expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        await logoutUserService.execute({ user_id: userId });

        const tokenForUser = await fakeRefreshTokensRepo.findByUserIdAndRefreshToken(
            userId,
            'token-1',
        );
        const tokenForUser2 = await fakeRefreshTokensRepo.findByUserIdAndRefreshToken(
            userId,
            'token-2',
        );
        const tokenForOther = await fakeRefreshTokensRepo.findByUserIdAndRefreshToken(
            'other-user-id',
            'token-3',
        );

        expect(tokenForUser).toBeNull();
        expect(tokenForUser2).toBeNull();
        expect(tokenForOther).not.toBeNull();
    });
});
