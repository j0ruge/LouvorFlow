import { Request, Response } from 'express';
import createUserAclService from '../../services/auth/create-user-acl.service.js';
import listUserAclService from '../../services/auth/list-user-acl.service.js';
import { flattenUserRelations } from '../../types/auth.types.js';
import { isSuperAdmin } from '../../helpers/is-super-admin.js';

/**
 * Controller responsável pelo gerenciamento da Lista de Controle de Acesso (ACL) dos usuários.
 * Permite criar e consultar as associações de papéis e permissões de um usuário.
 */
class UserAclController {
    /**
     * Associa papéis e permissões a um usuário específico.
     *
     * Inclui validações de segurança: passa dados do caller ao service
     * para prevenir escalação de privilégios (anti-self-elevation e
     * proteção de roles reservadas ao super-admin).
     *
     * @param req - Requisição contendo `userId` nos params e `roles` e `permissions` (arrays) no body.
     * @param res - Resposta com os dados do usuário atualizado com suas ACLs.
     */
    async create(req: Request<{ userId: string }>, res: Response): Promise<void> {
        const { userId } = req.params;
        const { roles, permissions } = req.body;
        /** Passa tenantId e dados do caller para validação de privilégios no service. */
        const tenantId = req.user!.tenantId!;
        const callerId = req.user!.id;
        const callerIsSuperAdmin = await isSuperAdmin(req.user!.id);
        const user = await createUserAclService.execute({
            userId,
            roles,
            permissions,
            tenantId,
            callerId,
            callerIsSuperAdmin,
        });
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        res.status(200).json({
            ...flattenUserRelations(user),
            avatar_url: user.avatar ? `${appApiUrl}/files/${user.avatar}` : null,
        });
    }

    /**
     * Exibe a lista de controle de acesso (papéis e permissões) de um usuário.
     * @param req - Requisição contendo `userId` nos params.
     * @param res - Resposta com os dados de ACL do usuário.
     */
    async show(req: Request<{ userId: string }>, res: Response): Promise<void> {
        const { userId } = req.params;
        const acl = await listUserAclService.execute(userId, req.user?.tenantId);
        res.status(200).json(acl);
    }
}

export default new UserAclController();
