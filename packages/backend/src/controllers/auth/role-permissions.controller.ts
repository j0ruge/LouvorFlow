import { Request, Response } from 'express';
import createRolePermissionService from '../../services/auth/create-role-permissions.service.js';

/**
 * Controller responsável pela associação de permissões a papéis.
 * Permite vincular uma ou mais permissões a um papel existente.
 */
class CreateRolePermissionController {
    /**
     * Associa permissões a um papel (role) específico.
     * @param req - Requisição contendo `roleId` nos params e `permissions` (array) no body.
     * @param res - Resposta com os dados do papel atualizado com as permissões.
     */
    async create(req: Request<{ roleId: string }>, res: Response): Promise<void> {
        const { roleId } = req.params;
        const { permissions } = req.body;
        const role = await createRolePermissionService.execute({ roleId, permissions });
        res.status(200).json(role);
    }
}

export default new CreateRolePermissionController();
