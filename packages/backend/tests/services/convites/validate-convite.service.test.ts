/**
 * Testes unitários do serviço ValidateInviteService.
 *
 * Valida os 5 estados do token: válido, expirado, usado,
 * revogado e inexistente, com mensagens de erro específicas.
 */

import fakeConvitesRepository from '../../fakes/fake-convites.repository.js';
import {
    TENANT_A_ID,
    MOCK_INVITE_ACTIVE,
    MOCK_INVITE_EXPIRED,
    MOCK_INVITE_USED,
    MOCK_INVITE_REVOKED,
} from '../../fakes/mock-data.js';

vi.mock('../../../src/repositories/convites.repository.js', async () => {
    const fake = await import('../../fakes/fake-convites.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/convites/validate-convite.service.js';

describe('ValidateInviteService', () => {
    /** Reinicia o repositório e configura referências antes de cada teste. */
    beforeEach(() => {
        fakeConvitesRepository.reset();
        fakeConvitesRepository.setTenantRef({ id: TENANT_A_ID, name: 'Igreja Central' });
    });

    /** Verifica que um token válido retorna valid: true com nome do tenant. */
    it('deve retornar valid: true e nome do tenant para token válido', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        const result = await service.execute(MOCK_INVITE_ACTIVE.token);

        expect(result).toEqual({
            valid: true,
            tenant: { name: 'Igreja Central' },
        });
    });

    /** Verifica que token expirado lança AppError 400. */
    it('deve lançar erro 400 para token expirado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_EXPIRED]);

        await expect(
            service.execute(MOCK_INVITE_EXPIRED.token),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('expirou'),
        });
    });

    /** Verifica que token já utilizado lança AppError 400. */
    it('deve lançar erro 400 para token já utilizado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_USED]);

        await expect(
            service.execute(MOCK_INVITE_USED.token),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('utilizado'),
        });
    });

    /** Verifica que token revogado lança AppError 400. */
    it('deve lançar erro 400 para token revogado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_REVOKED]);

        await expect(
            service.execute(MOCK_INVITE_REVOKED.token),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('cancelado'),
        });
    });

    /** Verifica que token inexistente lança AppError 404. */
    it('deve lançar erro 404 para token inexistente', async () => {
        await expect(
            service.execute('nonexistent-token-uuid'),
        ).rejects.toMatchObject({
            statusCode: 404,
            message: expect.stringContaining('não encontrado'),
        });
    });
});
