/**
 * Serviço de envio de email para recuperação de senha.
 *
 * Gera um token de recuperação e envia um email ao usuário
 * com o link para redefinição de senha. Retorna silenciosamente
 * quando o email não é encontrado, evitando enumeração de contas (FR-021).
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import mailProvider from '../../providers/mail.provider.js';
import recoveryTokensRepository from '../../repositories/auth/recovery-tokens.repository.js';

class SendForgotPasswordEmailService {
    /**
     * Envia email de recuperação de senha para o usuário.
     *
     * Busca o usuário pelo email informado. Caso não exista,
     * retorna silenciosamente sem lançar erro para prevenir
     * enumeração de emails cadastrados. Caso exista, gera um
     * token de recuperação e envia o email com o link de redefinição.
     *
     * @param email - Endereço de email do usuário que solicitou a recuperação.
     */
    async execute(email: string): Promise<void> {
        const user = await usersRepository.findByEmail(email);

        if (!user) {
            return;
        }

        await recoveryTokensRepository.deleteAllByUserId(user.id);

        const recoveryToken = await recoveryTokensRepository.generate(user.id);

        const appWebUrl = process.env.APP_WEB_URL;

        if (!appWebUrl && process.env.NODE_ENV === 'production') {
            throw new AppError('APP_WEB_URL é obrigatória em ambiente de produção', 500);
        }

        const resetLink = `${appWebUrl ?? 'http://localhost:3000'}/reset?token=${recoveryToken.token}`;

        await mailProvider.sendMail({
            to: email,
            subject: 'LouvorFlow — Recuperação de Senha',
            templateData: {
                template: 'forgot-password',
                variables: {
                    name: user.name,
                    link: resetLink,
                },
            },
        });
    }
}

export default new SendForgotPasswordEmailService();
