import { Request, Response } from 'express';
import createPermissionService from '../../services/auth/create-permission.service.js';
import permissionsRepository from '../../repositories/auth/permissions.repository.js';

/**
 * Controller responsável pelo gerenciamento de permissões.
 * Permite a criação e listagem de permissões no sistema de controle de acesso.
 */
class PermissionsController {
    /**
     * Lista as permissões do sistema.
     * Suporta paginação via query params `page` e `limit`.
     *
     * @param req - Requisição com query params opcionais `page` e `limit`.
     * @param res - Resposta com a lista paginada de permissões (status 200).
     * @returns Promise<void> — envia HTTP 200 com objeto `{ data, total, page, limit }`.
     */
    async list(req: Request, res: Response): Promise<void> {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await permissionsRepository.findAll({ page, limit });
        res.json(result);
    }

    /**
     * Cria uma nova permissão no sistema.
     * @param req - Requisição contendo `name` e `description` no body.
     * @param res - Resposta com os dados da permissão criada (status 201).
     * @returns Promise<void> — envia HTTP 201 com o objeto da permissão criada no body.
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name, description } = req.body;
        const permission = await createPermissionService.execute({ name, description });
        res.status(201).json(permission);
    }
}

export default new PermissionsController();
