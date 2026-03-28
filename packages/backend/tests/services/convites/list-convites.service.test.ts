/**
 * Testes unitários do serviço ListInvitesService.
 *
 * Valida a listagem de convites com status derivado,
 * construção de URL e cenário de lista vazia.
 */

import fakeConvitesRepository from '../../fakes/fake-convites.repository.js';
import {
    TENANT_A_ID,
    TENANT_B_ID,
    MOCK_INVITE_ACTIVE,
    MOCK_INVITE_EXPIRED,
    MOCK_INVITE_USED,
    MOCK_INVITE_REVOKED,
} from '../../fakes/mock-data.js';

vi.mock('../../../src/repositories/convites.repository.js', async () => {
    const fake = await import('../../fakes/fake-convites.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/convites/list-convites.service.js';

describe('ListInvitesService', () => {
    /** Reinicia o repositório antes de cada teste. */
    beforeEach(() => {
        fakeConvitesRepository.reset();
    });

    /** Verifica que lista retorna convites com status derivado correto. */
    it('deve listar convites com status derivado', async () => {
        fakeConvitesRepository.seed([
            MOCK_INVITE_ACTIVE,
            MOCK_INVITE_EXPIRED,
            MOCK_INVITE_USED,
            MOCK_INVITE_REVOKED,
        ]);

        const result = await service.execute(TENANT_A_ID);

        expect(result).toHaveLength(4);

        const statuses = result.map((i) => i.status);
        expect(statuses).toContain('active');
        expect(statuses).toContain('expired');
        expect(statuses).toContain('used');
        expect(statuses).toContain('revoked');
    });

    /** Verifica que cada convite tem URL construída corretamente. */
    it('deve incluir URL com token em cada convite', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        const result = await service.execute(TENANT_A_ID);

        expect(result[0].url).toContain('/convite/');
        expect(result[0].url).toContain(result[0].token);
    });

    /** Verifica que retorna array vazio quando não há convites. */
    it('deve retornar array vazio se não há convites', async () => {
        const result = await service.execute(TENANT_A_ID);
        expect(result).toEqual([]);
    });

    /** Verifica que lista é filtrada por tenant. */
    it('deve retornar apenas convites do tenant solicitado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        const resultA = await service.execute(TENANT_A_ID);
        const resultB = await service.execute(TENANT_B_ID);

        expect(resultA).toHaveLength(1);
        expect(resultB).toHaveLength(0);
    });
});
