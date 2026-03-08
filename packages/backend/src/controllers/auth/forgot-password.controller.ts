import { Request, Response } from 'express';
import sendForgotPasswordEmailService from '../../services/auth/send-forgot-password-email.service.js';

/**
 * Controller responsável pelo fluxo de esquecimento de senha.
 * Envia um e-mail de recuperação sem revelar se o endereço existe no sistema.
 */
class ForgotPasswordController {
    /**
     * Solicita o envio de e-mail para recuperação de senha.
     * Sempre retorna 204 independentemente de o e-mail existir ou não,
     * para não revelar informações sobre contas cadastradas.
     * @param req - Requisição contendo `email` no body.
     * @param res - Resposta vazia com status 204 (No Content).
     */
    async create(req: Request, res: Response): Promise<void> {
        const { email } = req.body;
        await sendForgotPasswordEmailService.execute(email);
        res.status(204).send();
    }
}

export default new ForgotPasswordController();
