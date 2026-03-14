import { Request, Response } from 'express';
import createUserService from '../../services/auth/create-user.service.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import { flattenUserRelations } from '../../types/auth.types.js';

/**
 * Controller responsável pelo gerenciamento de usuários.
 * Permite a criação e listagem de usuários no sistema.
 */
class UsersController {
    /**
     * Lista os usuários do sistema (sem campo senha).
     * Suporta paginação via query params `page` e `limit`.
     *
     * @param req - Requisição com query params opcionais `page` e `limit`.
     * @param res - Resposta com a lista paginada de usuários (status 200).
     * @returns Promise<void> — envia HTTP 200 com objeto `{ data, total, page, limit }`.
     */
    async list(req: Request, res: Response): Promise<void> {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await usersRepository.findAll({ page, limit });
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        res.json({
            ...result,
            data: result.data.map((u) => ({
                ...flattenUserRelations(u),
                avatar_url: u.avatar ? `${appApiUrl}/files/${u.avatar}` : null,
            })),
        });
    }

    /**
     * Cria um novo usuário no sistema.
     * @param req - Requisição contendo `name`, `email` e `password` no body.
     * @param res - Resposta com os dados do usuário criado (status 201).
     * @returns Promise<void> — envia HTTP 201 com os dados do usuário criado (sem o campo senha). Retorna 409 se o email já estiver em uso.
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name, email, password } = req.body;
        const user = await createUserService.execute({ name, email, password });
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        res.status(201).json({
            ...flattenUserRelations(user),
            avatar_url: user.avatar ? `${appApiUrl}/files/${user.avatar}` : null,
        });
    }
}

export default new UsersController();
