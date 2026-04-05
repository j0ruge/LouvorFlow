import { Request, Response } from 'express';
import eventosService from '../services/eventos.service.js';

/**
 * Controller de eventos — gerencia CRUD de eventos e sub-recursos (músicas e integrantes).
 * Express 5 async error handling — sem try-catch.
 */
class EventosController {
    // --- Base CRUD ---

    /** Lista todos os eventos com músicas e integrantes resumidos. */
    async index(_req: Request, res: Response): Promise<void> {
        const eventos = await eventosService.listAll();
        res.status(200).json(eventos);
    }

    /** Retorna um evento detalhado pelo ID. */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const evento = await eventosService.getById(req.params.id);
        res.status(200).json(evento);
    }

    /** Cria um novo evento vinculado ao tenant do usuário autenticado. */
    async create(req: Request, res: Response): Promise<void> {
        const evento = await eventosService.create(req.body, req.user!.tenantId!);
        res.status(201).json({ msg: "Evento criado com sucesso", evento });
    }

    /** Atualiza um evento existente pelo ID. */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const evento = await eventosService.update(req.params.id, req.body);
        res.status(200).json({ msg: "Evento editado com sucesso", evento });
    }

    /** Remove um evento pelo ID. */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const evento = await eventosService.delete(req.params.id);
        res.status(200).json({ msg: "Evento deletado com sucesso", evento });
    }

    // --- Junction: Musicas ---

    /** Lista as músicas vinculadas a um evento. */
    async listMusicas(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        const musicas = await eventosService.listMusicas(req.params.eventoId);
        res.status(200).json(musicas);
    }

    /** Vincula uma música a um evento no tenant do usuário autenticado. */
    async addMusica(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        await eventosService.addMusica(req.params.eventoId, req.body.musicas_id, req.user!.tenantId!);
        res.status(201).json({ msg: "Música adicionada ao evento com sucesso" });
    }

    /** Remove o vínculo entre um evento e uma música. */
    async removeMusica(req: Request<{ eventoId: string; musicaId: string }>, res: Response): Promise<void> {
        await eventosService.removeMusica(req.params.eventoId, req.params.musicaId);
        res.status(200).json({ msg: "Música removida do evento com sucesso" });
    }

    /** Reordena as músicas de um evento conforme a ordem dos IDs recebidos. */
    async reorderMusicas(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        await eventosService.reorderMusicas(req.params.eventoId, req.body.musicas_ids);
        res.status(200).json({ msg: "Ordem das músicas atualizada com sucesso" });
    }

    // --- Junction: Integrantes ---

    /** Lista os integrantes vinculados a um evento com funções. */
    async listIntegrantes(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        const integrantes = await eventosService.listIntegrantes(req.params.eventoId);
        res.status(200).json(integrantes);
    }

    /** Adiciona um integrante a um evento no tenant do usuário autenticado. */
    async addIntegrante(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        await eventosService.addIntegrante(req.params.eventoId, req.body.fk_integrante_id, req.body.funcao_ids, req.user!.tenantId!);
        res.status(201).json({ msg: "Integrante adicionado ao evento com sucesso" });
    }

    /** Remove o vínculo entre um evento e um integrante. */
    async removeIntegrante(req: Request<{ eventoId: string; integranteId: string }>, res: Response): Promise<void> {
        await eventosService.removeIntegrante(req.params.eventoId, req.params.integranteId);
        res.status(200).json({ msg: "Integrante removido do evento com sucesso" });
    }
}

export default new EventosController();
