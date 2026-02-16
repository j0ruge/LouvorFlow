import { Request, Response } from 'express';
import artistasService from '../services/artistas.service.js';
import { AppError } from '../errors/AppError.js';

class ArtistasController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const artistas = await artistasService.listAll();
            res.status(200).json(artistas);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar artistas", codigo: 500 });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const artista = await artistasService.getById(req.params.id);
            res.status(200).json(artista);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar artista", codigo: 500 });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const artista = await artistasService.create(req.body.nome);
            res.status(201).json({ msg: "Artista criado com sucesso", artista });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar artista", codigo: 500 });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const artista = await artistasService.update(req.params.id, req.body.nome);
            res.status(200).json({ msg: "Artista editado com sucesso", artista });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar artista", codigo: 500 });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const artista = await artistasService.delete(req.params.id);
            res.status(200).json({ msg: "Artista deletado com sucesso", artista });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao deletar artista", codigo: 500 });
        }
    }
}

export default new ArtistasController();
