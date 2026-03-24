import { Request, Response } from 'express';
import tiposEventosService from '../services/tipos-eventos.service.js';

/**
 * Controller de tipos de eventos.
 * Express 5 async error handling — sem try-catch.
 */
class TiposEventosController {
    /**
     * Lista todos os tipos de eventos cadastrados.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const tiposEventos = await tiposEventosService.listAll();
        res.status(200).json(tiposEventos);
    }

    /**
     * Retorna um tipo de evento pelo ID.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const tipoEvento = await tiposEventosService.getById(req.params.id);
        res.status(200).json(tipoEvento);
    }

    /**
     * Cria um novo tipo de evento no tenant ativo.
     */
    async create(req: Request, res: Response): Promise<void> {
        const tipoEvento = await tiposEventosService.create(req.body.nome, req.user!.tenantId!);
        res.status(201).json({ msg: "Tipo de evento criado com sucesso", tipoEvento });
    }

    /**
     * Atualiza o nome de um tipo de evento existente.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const tipoEvento = await tiposEventosService.update(req.params.id, req.body.nome);
        res.status(200).json({ msg: "Tipo de evento editado com sucesso", tipoEvento });
    }

    /**
     * Remove um tipo de evento pelo ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const tipoEvento = await tiposEventosService.delete(req.params.id);
        res.status(200).json({ msg: "Tipo de evento deletado com sucesso", tipoEvento });
    }
}

export default new TiposEventosController();
