import { Request, Response } from 'express';
import tonalidadesService from '../services/tonalidades.service.js';

/**
 * Controller de tonalidades.
 * Express 5 async error handling — sem try-catch.
 */
class TonalidadesController {
    /**
     * Lista todas as tonalidades cadastradas.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const tonalidades = await tonalidadesService.listAll();
        res.status(200).json(tonalidades);
    }

    /**
     * Retorna uma tonalidade pelo ID.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const tonalidade = await tonalidadesService.getById(req.params.id);
        res.status(200).json(tonalidade);
    }

    /**
     * Cria uma nova tonalidade no tenant ativo.
     */
    async create(req: Request, res: Response): Promise<void> {
        const tonalidade = await tonalidadesService.create(req.body.tom, req.user!.tenantId!);
        res.status(201).json({ msg: "Tonalidade criada com sucesso", tonalidade });
    }

    /**
     * Atualiza o tom de uma tonalidade existente.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const tonalidade = await tonalidadesService.update(req.params.id, req.body.tom);
        res.status(200).json({ msg: "Tonalidade editada com sucesso", tonalidade });
    }

    /**
     * Remove uma tonalidade pelo ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const tonalidade = await tonalidadesService.delete(req.params.id);
        res.status(200).json({ msg: "Tonalidade deletada com sucesso", tonalidade });
    }
}

export default new TonalidadesController();
