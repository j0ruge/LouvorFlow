import { Request, Response } from 'express';
import showProfileService from '../../services/auth/show-profile.service.js';
import updateProfileService from '../../services/auth/update-profile.service.js';
import { flattenUserRelations } from '../../types/auth.types.js';

/**
 * Controller responsável pelo gerenciamento do perfil do usuário autenticado.
 * Permite visualizar e atualizar os dados do próprio perfil.
 */
class ProfileController {
    /**
     * Exibe os dados do perfil do usuário autenticado.
     * @param req - Requisição contendo o usuário autenticado em `req.user`.
     * @param res - Resposta com os dados do perfil do usuário.
     */
    async show(req: Request, res: Response): Promise<void> {
        const user_id = req.user!.id;
        const user = await showProfileService.execute({ user_id });
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        res.status(200).json({
            ...flattenUserRelations(user),
            avatar_url: user.avatar ? `${appApiUrl}/files/${user.avatar}` : null,
        });
    }

    /**
     * Atualiza os dados do perfil do usuário autenticado.
     * @param req - Requisição contendo o usuário autenticado em `req.user` e os campos
     *              `name`, `email`, `old_password` e `password` no body.
     * @param res - Resposta com os dados atualizados do perfil do usuário.
     */
    async update(req: Request, res: Response): Promise<void> {
        const user_id = req.user!.id;
        const { name, email, old_password, password } = req.body;
        const user = await updateProfileService.execute({ user_id, name, email, old_password, password });
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        res.status(200).json({
            ...flattenUserRelations(user),
            avatar_url: user.avatar ? `${appApiUrl}/files/${user.avatar}` : null,
        });
    }
}

export default new ProfileController();
