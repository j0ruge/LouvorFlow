import { Request, Response } from 'express';
import tiposEventosService from '../services/tipos-eventos.service.js';
import { AppError } from '../errors/AppError.js';

class TiposEventosController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const tiposEventos = await tiposEventosService.listAll();
            res.status(200).json(tiposEventos);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar tipos de eventos", codigo: 500 });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tipoEvento = await tiposEventosService.getById(req.params.id);
            res.status(200).json(tipoEvento);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar tipo de evento", codigo: 500 });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const tipoEvento = await tiposEventosService.create(req.body.nome);
            res.status(201).json({ msg: "Tipo de evento criado com sucesso", tipoEvento });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar tipo de evento", codigo: 500 });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tipoEvento = await tiposEventosService.update(req.params.id, req.body.nome);
            res.status(200).json({ msg: "Tipo de evento editado com sucesso", tipoEvento });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar tipo de evento", codigo: 500 });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tipoEvento = await tiposEventosService.delete(req.params.id);
            res.status(200).json({ msg: "Tipo de evento deletado com sucesso", tipoEvento });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao deletar tipo de evento", codigo: 500 });
        }
    }
}

export default new TiposEventosController();
