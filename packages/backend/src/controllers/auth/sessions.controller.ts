import { Request, Response } from 'express';
import authenticateUserService from '../../services/auth/authenticate-user.service.js';

/**
 * Controller responsável pela autenticação de usuários.
 * Gerencia a criação de sessões (login).
 */
class SessionsController {
    /**
     * Cria uma nova sessão autenticando o usuário com email e senha.
     * @param req - Requisição contendo `email` e `password` no body.
     * @param res - Resposta com os dados da sessão (token, usuário).
     */
    async create(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        const result = await authenticateUserService.execute({ email, password });
        res.status(200).json(result);
    }
}

export default new SessionsController();
