import { Request, Response } from 'express';
import userRefreshTokenService from '../../services/auth/refresh-token.service.js';
import { AppError } from '../../errors/AppError.js';

/**
 * Controller responsável pela renovação de tokens de acesso.
 * Permite ao usuário obter um novo token sem precisar autenticar novamente.
 */
class UsersRefreshTokensController {
    /**
     * Cria um novo par de tokens a partir de um refresh token válido.
     * O token pode ser enviado via body ou header `x-access-token`.
     * @param req - Requisição contendo o refresh token.
     * @param res - Resposta com o novo token de acesso e refresh token.
     */
    async create(req: Request, res: Response): Promise<void> {
        const token = req.body.token ?? req.headers['x-access-token'];

        if (!token) {
            throw new AppError('Refresh token é obrigatório', 400);
        }

        const result = await userRefreshTokenService.execute(token as string);
        res.status(200).json(result);
    }
}

export default new UsersRefreshTokensController();
