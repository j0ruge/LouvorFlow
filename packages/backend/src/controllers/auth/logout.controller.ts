import { Request, Response } from 'express';
import logoutUserService from '../../services/auth/logout-user.service.js';

/**
 * Controller responsável pelo logout do usuário.
 * Invalida a sessão atual do usuário autenticado.
 */
class LogoutController {
    /**
     * Realiza o logout do usuário, invalidando sua sessão e tokens associados.
     * @param req - Requisição contendo o usuário autenticado em `req.user`.
     * @param res - Resposta vazia com status 204 (No Content).
     */
    async create(req: Request, res: Response): Promise<void> {
        const user_id = req.user!.id;
        await logoutUserService.execute({ user_id });
        res.status(204).send();
    }
}

export default new LogoutController();
