import { Request, Response } from 'express';
import createPermissionService from '../../services/auth/create-permission.service.js';
import permissionsRepository from '../../repositories/auth/permissions.repository.js';
import { PROTECTED_PERMISSION_NAMES } from '../../config/rbac.js';

/**
 * Controller responsável pelo gerenciamento de permissões.
 * Permite a criação e listagem de permissões no sistema de controle de acesso.
 *
 * A listagem filtra permissions protegidas (super_admin_access) para admins regulares,
 * impedindo que visualizem ou tentem atribuir permissões de nível superior.
 */
class PermissionsController {
    /**
     * Lista as permissões do sistema.
     * Suporta paginação via query params `page` e `limit`.
     *
     * Admins regulares não veem permissions protegidas (super_admin_access).
     * Super-admins veem todas as permissions.
     *
     * @param req - Requisição com query params opcionais `page` e `limit`.
     * @param res - Resposta com a lista paginada de permissões (status 200).
     */
    async list(req: Request, res: Response): Promise<void> {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await permissionsRepository.findAll({ page, limit });

        const callerIsSuperAdmin = req.user?.roles?.some((r) => r.name === 'super-admin') ?? false;

        /** Filtra permissions protegidas para admins regulares. */
        const filteredData = callerIsSuperAdmin
            ? result.data
            : result.data.filter((perm) => !PROTECTED_PERMISSION_NAMES.includes(perm.name));

        res.json({
            ...result,
            data: filteredData,
            total: filteredData.length,
        });
    }

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
