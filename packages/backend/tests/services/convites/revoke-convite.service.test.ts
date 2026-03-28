/**
 * Testes unitários do serviço RevokeInviteService.
 *
 * Valida a revogação de convites ativos e os cenários de erro:
 * convite não encontrado, de outro tenant, já usado e já revogado.
 */

import fakeConvitesRepository from '../../fakes/fake-convites.repository.js';
import {
    TENANT_A_ID,
    TENANT_B_ID,
    MOCK_INVITE_ACTIVE,
    MOCK_INVITE_USED,
    MOCK_INVITE_REVOKED,
} from '../../fakes/mock-data.js';

vi.mock('../../../src/repositories/convites.repository.js', async () => {
    const fake = await import('../../fakes/fake-convites.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/convites/revoke-convite.service.js';

describe('RevokeInviteService', () => {
    /** Reinicia o repositório antes de cada teste. */
    beforeEach(() => {
        fakeConvitesRepository.reset();
    });

    /** Verifica que um convite ativo é revogado com sucesso. */
    it('deve revogar convite ativo com sucesso', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.id, TENANT_A_ID),
        ).resolves.toBeUndefined();

        const revoked = await fakeConvitesRepository.findById(MOCK_INVITE_ACTIVE.id);
        expect(revoked?.revoked_at).not.toBeNull();
    });

    /** Verifica que convite inexistente lança AppError 404. */
    it('deve lançar erro 404 para convite inexistente', async () => {
        await expect(
            service.execute('nonexistent-id', TENANT_A_ID),
        ).rejects.toMatchObject({
            statusCode: 404,
            message: expect.stringContaining('não encontrado'),
        });
    });

    /** Verifica que convite de outro tenant lança AppError 404. */
    it('deve lançar erro 404 para convite de outro tenant', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.id, TENANT_B_ID),
        ).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    /** Verifica que convite já utilizado não pode ser revogado. */
    it('deve lançar erro 400 para convite já utilizado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_USED]);

        await expect(
            service.execute(MOCK_INVITE_USED.id, TENANT_A_ID),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('utilizado'),
        });
    });

    /** Verifica que convite já revogado não pode ser revogado novamente. */
    it('deve lançar erro 400 para convite já revogado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_REVOKED]);

        await expect(
            service.execute(MOCK_INVITE_REVOKED.id, TENANT_A_ID),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('revogado'),
        });
    });
});
