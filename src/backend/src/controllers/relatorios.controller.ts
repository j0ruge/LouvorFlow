/**
 * Controller de relatórios — manipulador de requisições HTTP.
 *
 * Recebe requisições REST, delega ao service de relatórios
 * e retorna respostas JSON padronizadas.
 */

import { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import relatoriosService from '../services/relatorios.service.js';

class RelatoriosController {
    /**
     * Retorna o resumo completo de relatórios com dados agregados.
     *
     * @param _req - Objeto de requisição (não utilizado).
     * @param res - Resposta HTTP com status 200 e objeto RelatorioResumo.
     */
    async resumo(_req: Request, res: Response): Promise<void> {
        try {
            const resumo = await relatoriosService.getResumo();
            res.status(200).json(resumo);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    erro: error.errors ? error.errors.join('; ') : error.message,
                    codigo: error.statusCode,
                });
                return;
            }
            res.status(500).json({ erro: 'Erro ao buscar relatórios', codigo: 500 });
        }
    }
}

export default new RelatoriosController();
