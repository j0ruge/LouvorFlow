import { Request, Response } from 'express';
import tonalidadesService from '../services/tonalidades.service.js';
import { AppError } from '../errors/AppError.js';

class TonalidadesController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const tonalidades = await tonalidadesService.listAll();
            res.status(200).json(tonalidades);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar tonalidades"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tonalidade = await tonalidadesService.getById(req.params.id);
            res.status(200).json(tonalidade);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar tonalidade"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const tonalidade = await tonalidadesService.create(req.body.tom);
            res.status(201).json({ msg: "Tonalidade criada com sucesso", tonalidade });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao criar tonalidade"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tonalidade = await tonalidadesService.update(req.params.id, req.body.tom);
            res.status(200).json({ msg: "Tonalidade editada com sucesso", tonalidade });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao editar tonalidade"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tonalidade = await tonalidadesService.delete(req.params.id);
            res.status(200).json({ msg: "Tonalidade deletada com sucesso", tonalidade });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao deletar tonalidade"] });
        }
    }
}

export default new TonalidadesController();
