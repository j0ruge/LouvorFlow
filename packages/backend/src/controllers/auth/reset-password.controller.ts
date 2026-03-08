import { Request, Response } from 'express';
import resetPasswordService from '../../services/auth/reset-password.service.js';

/**
 * Controller responsável pela redefinição de senha.
 * Valida o token de recuperação e atualiza a senha do usuário.
 */
class ResetPasswordController {
    /**
     * Redefine a senha do usuário utilizando um token de recuperação.
     * Valida que a confirmação de senha coincide antes de prosseguir.
     * @param req - Requisição contendo `token`, `password` e `password_confirmation` no body.
     * @param res - Resposta vazia com status 204 (No Content) em caso de sucesso.
     */
    async create(req: Request, res: Response): Promise<void> {
        const { token, password } = req.body;
        await resetPasswordService.execute(token, password);
        res.status(204).send();
    }
}

export default new ResetPasswordController();
