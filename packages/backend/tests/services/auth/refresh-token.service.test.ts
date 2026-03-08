/**
 * Testes unitários do serviço de renovação de tokens.
 *
 * Valida os cenários de renovação com refresh token válido,
 * token inválido (formato incorreto) e token já revogado (removido do banco).
 */

import { AppError } from '../../../src/errors/AppError.js';

import fakeRefreshTokensRepo from '../../fakes/auth/fake-refresh-tokens.repository.js';
import fakeTokenProvider from '../../fakes/auth/fake-token.provider.js';
import fakeDateProvider from '../../fakes/auth/fake-date.provider.js';

vi.mock('../../../src/repositories/auth/refresh-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-refresh-tokens.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/token.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-token.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/date.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-date.provider.js');
    return { default: fake.default };
});

const { default: userRefreshTokenService } = await import(
    '../../../src/services/auth/refresh-token.service.js'
);

/** @group UserRefreshTokenService */
describe('UserRefreshTokenService', () => {
    /** ID de usuário utilizado nos testes. */
    const userId = 'user-id-123';

    /** Reinicia o repositório fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeRefreshTokensRepo.reset();
    });

    /** Deve renovar tokens com refresh token válido, deletar o antigo e retornar novo par. */
    it('deve renovar tokens com refresh token válido', async () => {
        const fakeToken = `fake-token-${userId}`;

        await fakeRefreshTokensRepo.create({
            user_id: userId,
            refresh_token: fakeToken,
            expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        const result = await userRefreshTokenService.execute(fakeToken);

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('refresh_token');
        expect(result.token).toEqual(expect.any(String));
        expect(result.refresh_token).toEqual(expect.any(String));
    });

    /** Deve lançar AppError quando o refresh token não está no formato esperado. */
    it('deve lançar erro para refresh token inválido', async () => {
        await expect(
            userRefreshTokenService.execute('invalid-token'),
        ).rejects.toMatchObject({
            message: 'Refresh token does not exist',
        });
    });

    /** Deve lançar AppError quando o token foi revogado (removido do repositório). */
    it('deve lançar erro para token já revogado', async () => {
        const fakeToken = `fake-token-${userId}`;

        const record = await fakeRefreshTokensRepo.create({
            user_id: userId,
            refresh_token: fakeToken,
            expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        await fakeRefreshTokensRepo.deleteById(record.id);

        await expect(
            userRefreshTokenService.execute(fakeToken),
        ).rejects.toMatchObject({
            message: 'Refresh token does not exist',
        });
    });
});
