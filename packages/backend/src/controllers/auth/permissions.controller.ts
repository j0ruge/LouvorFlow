import { Request, Response } from 'express';
import createPermissionService from '../../services/auth/create-permission.service.js';

/**
 * Controller responsável pelo gerenciamento de permissões.
 * Permite a criação de novas permissões no sistema de controle de acesso.
 */
class PermissionsController {
    /**
     * Cria uma nova permissão no sistema.
     * @param req - Requisição contendo `name` e `description` no body.
     * @param res - Resposta com os dados da permissão criada (status 201).
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name, description } = req.body;
        const permission = await createPermissionService.execute({ name, description });
        res.status(201).json(permission);
    }
}

export default new PermissionsController();
