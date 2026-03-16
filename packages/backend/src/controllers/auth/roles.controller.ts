import { Request, Response } from 'express';
import createRoleService from '../../services/auth/create-role.service.js';
import rolesRepository from '../../repositories/auth/roles.repository.js';
import { flattenRolePermissions } from '../../types/auth.types.js';

/**
 * Controller responsável pelo gerenciamento de papéis (roles).
 * Permite a criação e listagem de papéis no sistema de controle de acesso.
 */
class RolesController {
    /**
     * Lista os papéis (roles) do sistema com suas permissões.
     * Suporta paginação via query params `page` e `limit`.
     *
     * @param req - Requisição com query params opcionais `page` e `limit`.
     * @param res - Resposta com a lista paginada de roles (status 200).
     * @returns Promise<void> — envia HTTP 200 com objeto `{ data, total, page, limit }`.
     */
    async list(req: Request, res: Response): Promise<void> {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await rolesRepository.findAll({ page, limit });
        res.json({
            ...result,
            data: result.data.map(flattenRolePermissions),
        });
    }

    /**
     * Cria um novo papel (role) no sistema.
     * @param req - Requisição contendo `name` e `description` no body.
     * @param res - Resposta com os dados do papel criado (status 201).
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name, description } = req.body;
        const role = await createRoleService.execute({ name, description });
        res.status(201).json(flattenRolePermissions(role));
    }
}

export default new RolesController();
