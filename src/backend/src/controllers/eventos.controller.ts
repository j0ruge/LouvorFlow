import { Request, Response } from 'express';
import eventosService from '../services/eventos.service.js';
import { AppError } from '../errors/AppError.js';

class EventosController {
    // --- Base CRUD ---

    async index(_req: Request, res: Response): Promise<void> {
        try {
            const eventos = await eventosService.listAll();
            res.status(200).json(eventos);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.errors ? error.errors.join('; ') : error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar eventos", codigo: 500 });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const evento = await eventosService.getById(req.params.id);
            res.status(200).json(evento);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar evento", codigo: 500 });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const evento = await eventosService.create(req.body);
            res.status(201).json({ msg: "Evento criado com sucesso", evento });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar evento", codigo: 500 });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const evento = await eventosService.update(req.params.id, req.body);
            res.status(200).json({ msg: "Evento editado com sucesso", evento });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar evento", codigo: 500 });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const evento = await eventosService.delete(req.params.id);
            res.status(200).json({ msg: "Evento deletado com sucesso", evento });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao deletar evento", codigo: 500 });
        }
    }

    // --- Junction: Musicas ---

    async listMusicas(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        try {
            const musicas = await eventosService.listMusicas(req.params.eventoId);
            res.status(200).json(musicas);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar músicas do evento", codigo: 500 });
        }
    }

    async addMusica(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        try {
            await eventosService.addMusica(req.params.eventoId, req.body.musicas_id);
            res.status(201).json({ msg: "Música adicionada ao evento com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao adicionar música ao evento", codigo: 500 });
        }
    }

    async removeMusica(req: Request<{ eventoId: string; musicaId: string }>, res: Response): Promise<void> {
        try {
            await eventosService.removeMusica(req.params.eventoId, req.params.musicaId);
            res.status(200).json({ msg: "Música removida do evento com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao remover música do evento", codigo: 500 });
        }
    }

    // --- Junction: Integrantes ---

    async listIntegrantes(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        try {
            const integrantes = await eventosService.listIntegrantes(req.params.eventoId);
            res.status(200).json(integrantes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar integrantes do evento", codigo: 500 });
        }
    }

    /**
     * Adiciona um integrante a um evento existente.
     *
     * @param req - Requisição com `eventoId` nos params e `fk_integrante_id` no body.
     * @param res - Resposta HTTP (201 em caso de sucesso).
     * @returns Promise resolvida após envio da resposta.
     * @throws AppError quando o evento ou integrante não é encontrado.
     */
    async addIntegrante(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
        try {
            await eventosService.addIntegrante(req.params.eventoId, req.body.fk_integrante_id);
            res.status(201).json({ msg: "Integrante adicionado ao evento com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao adicionar integrante ao evento", codigo: 500 });
        }
    }

    async removeIntegrante(req: Request<{ eventoId: string; integranteId: string }>, res: Response): Promise<void> {
        try {
            await eventosService.removeIntegrante(req.params.eventoId, req.params.integranteId);
            res.status(200).json({ msg: "Integrante removido do evento com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao remover integrante do evento", codigo: 500 });
        }
    }
}

export default new EventosController();
