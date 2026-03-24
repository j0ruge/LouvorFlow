import { Request, Response } from 'express';
import createRoleService from '../../services/auth/create-role.service.js';
import rolesRepository from '../../repositories/auth/roles.repository.js';
import { flattenRolePermissions } from '../../types/auth.types.js';
import { PROTECTED_ROLE_NAMES } from '../../config/rbac.js';
import { isSuperAdmin } from '../../helpers/is-super-admin.js';

/**
 * Controller responsável pelo gerenciamento de papéis (roles).
 * Permite a criação e listagem de papéis no sistema de controle de acesso.
 *
 * A listagem filtra roles protegidas (super-admin) para admins regulares,
 * impedindo que visualizem ou tentem atribuir roles de nível superior.
 */
class RolesController {
    /**
     * Lista os papéis (roles) do sistema com suas permissões.
     * Suporta paginação via query params `page` e `limit`.
     *
     * Admins regulares não veem roles protegidas (super-admin).
     * Super-admins veem todas as roles.
     *
     * @param req - Requisição com query params opcionais `page` e `limit`.
     * @param res - Resposta com a lista paginada de roles (status 200).
     */
    async list(req: Request, res: Response): Promise<void> {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await rolesRepository.findAll({ page, limit });

        const callerIsSuperAdmin = await isSuperAdmin(req.user!.id);

        /** Filtra roles protegidas para admins regulares. */
        const filteredData = callerIsSuperAdmin
            ? result.data
            : result.data.filter((role: { name: string }) => !PROTECTED_ROLE_NAMES.includes(role.name));

        /** Ajusta o total subtraindo as roles protegidas filtradas desta página. */
        const protectedCount = callerIsSuperAdmin
            ? 0
            : result.data.filter((role: { name: string }) => PROTECTED_ROLE_NAMES.includes(role.name)).length;

        res.json({
            ...result,
            data: filteredData.map(flattenRolePermissions),
            total: result.total - protectedCount,
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
