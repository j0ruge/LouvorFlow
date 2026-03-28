/**
 * Testes unitários do serviço CreateInviteService.
 *
 * Valida a geração de links de convite com expiração de 2h,
 * construção de URL e status inicial.
 */

import fakeConvitesRepository from '../../fakes/fake-convites.repository.js';
import { TENANT_A_ID, INVITE_CREATOR_ID } from '../../fakes/mock-data.js';

vi.mock('../../../src/repositories/convites.repository.js', async () => {
    const fake = await import('../../fakes/fake-convites.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/convites/create-convite.service.js';

describe('CreateInviteService', () => {
    /** Reinicia o repositório antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeConvitesRepository.reset();
    });

    /** Verifica que um convite é gerado com token, URL e expiração de 2h. */
    it('deve gerar convite com token UUID e expiração de 2h', async () => {
        const result = await service.execute(TENANT_A_ID, INVITE_CREATOR_ID);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('expires_at');
        expect(result).toHaveProperty('status', 'active');

        const expiresAt = new Date(result.expires_at);
        const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;
        const diff = Math.abs(expiresAt.getTime() - twoHoursFromNow);
        expect(diff).toBeLessThan(5000);
    });

    /** Verifica que a URL contém o token e o prefixo correto. */
    it('deve construir URL com APP_WEB_URL e token', async () => {
        const result = await service.execute(TENANT_A_ID, INVITE_CREATOR_ID);

        expect(result.url).toContain('/convite/');
        expect(result.url).toContain(result.token);
    });

    /** Verifica que convites gerados sequencialmente possuem tokens distintos. */
    it('deve gerar tokens únicos para cada convite', async () => {
        const result1 = await service.execute(TENANT_A_ID, INVITE_CREATOR_ID);
        const result2 = await service.execute(TENANT_A_ID, INVITE_CREATOR_ID);

        expect(result1.token).not.toBe(result2.token);
        expect(result1.id).not.toBe(result2.id);
    });
});
