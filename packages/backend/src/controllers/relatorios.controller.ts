/**
 * Controller de relatórios — manipulador de requisições HTTP.
 *
 * Recebe requisições REST, delega ao service de relatórios
 * e retorna respostas JSON padronizadas.
 * Express 5 async error handling — sem try-catch.
 */

import { Request, Response } from 'express';
import relatoriosService from '../services/relatorios.service.js';

class RelatoriosController {
    /**
     * Retorna o resumo completo de relatórios com dados agregados.
     *
     * @param _req - Objeto de requisição (não utilizado).
     * @param res - Resposta HTTP com status 200 e objeto RelatorioResumo.
     */
    async resumo(_req: Request, res: Response): Promise<void> {
        const resumo = await relatoriosService.getResumo();
        res.status(200).json(resumo);
    }
}

export default new RelatoriosController();
