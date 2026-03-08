import { Request, Response } from 'express';
import createRoleService from '../../services/auth/create-role.service.js';

/**
 * Controller responsável pelo gerenciamento de papéis (roles).
 * Permite a criação de novos papéis no sistema de controle de acesso.
 */
class RolesController {
    /**
     * Cria um novo papel (role) no sistema.
     * @param req - Requisição contendo `name` e `description` no body.
     * @param res - Resposta com os dados do papel criado (status 201).
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name, description } = req.body;
        const role = await createRoleService.execute({ name, description });
        res.status(201).json(role);
    }
}

export default new RolesController();
