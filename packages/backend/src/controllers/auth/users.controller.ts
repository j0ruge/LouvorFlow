import { Request, Response } from 'express';
import createUserService from '../../services/auth/create-user.service.js';

/**
 * Controller responsável pelo gerenciamento de usuários.
 * Permite a criação de novos usuários no sistema.
 */
class UsersController {
    /**
     * Cria um novo usuário no sistema.
     * @param req - Requisição contendo `name`, `email` e `password` no body.
     * @param res - Resposta com os dados do usuário criado (status 201).
     * @returns Promise<void> — envia HTTP 201 com os dados do usuário criado (sem o campo senha). Retorna 409 se o email já estiver em uso.
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name, email, password } = req.body;
        const user = await createUserService.execute({ name, email, password });
        res.status(201).json(user);
    }
}

export default new UsersController();
