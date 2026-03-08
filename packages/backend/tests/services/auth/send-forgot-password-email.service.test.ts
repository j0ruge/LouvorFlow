/**
 * Testes unitarios do servico SendForgotPasswordEmailService.
 *
 * Valida a geracao de token e envio de email de recuperacao de senha,
 * incluindo o cenario de email nao registrado que deve completar silenciosamente.
 */

import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import fakeMailProvider from '../../fakes/auth/fake-mail.provider.js';
import fakeRecoveryTokensRepository from '../../fakes/auth/fake-recovery-tokens.repository.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/mail.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-mail.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/recovery-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-recovery-tokens.repository.js');
    return { default: fake.default };
});

import service from '../../../src/services/auth/send-forgot-password-email.service.js';

describe('SendForgotPasswordEmailService', () => {
    /** Reinicia os repositorios e o provedor fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepository.reset();
        fakeRecoveryTokensRepository.reset();
        fakeMailProvider.sentMails = [];
    });

    /** Verifica que um token e gerado e um email e enviado para um email registrado. */
    it('deve gerar token e enviar email para email registrado', async () => {
        await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'hashed-password',
        });

        await service.execute('joao@test.com');

        expect(fakeMailProvider.sentMails).toHaveLength(1);
        expect(fakeMailProvider.sentMails[0].to).toBe('joao@test.com');
        expect(fakeMailProvider.sentMails[0].subject).toContain('Recuperação de Senha');
    });

    /** Verifica que nenhum erro e lancado e nenhum email e enviado para um email nao registrado. */
    it('deve completar silenciosamente para email nao registrado', async () => {
        await expect(service.execute('unknown@test.com')).resolves.toBeUndefined();

        expect(fakeMailProvider.sentMails).toHaveLength(0);
    });
});
