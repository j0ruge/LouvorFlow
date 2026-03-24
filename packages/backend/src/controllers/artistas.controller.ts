import { Request, Response } from 'express';
import artistasService from '../services/artistas.service.js';

/**
 * Controller de artistas.
 * Express 5 async error handling — sem try-catch.
 */
class ArtistasController {
    /**
     * Lista todos os artistas cadastrados.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const artistas = await artistasService.listAll();
        res.status(200).json(artistas);
    }

    /**
     * Retorna um artista pelo ID com suas versões de músicas.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const artista = await artistasService.getById(req.params.id);
        res.status(200).json(artista);
    }

    /**
     * Cria um novo artista no tenant ativo.
     */
    async create(req: Request, res: Response): Promise<void> {
        const artista = await artistasService.create(req.body.nome, req.user!.tenantId!);
        res.status(201).json({ msg: "Artista criado com sucesso", artista });
    }

    /**
     * Atualiza o nome de um artista existente.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const artista = await artistasService.update(req.params.id, req.body.nome);
        res.status(200).json({ msg: "Artista editado com sucesso", artista });
    }

    /**
     * Remove um artista pelo ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const artista = await artistasService.delete(req.params.id);
        res.status(200).json({ msg: "Artista deletado com sucesso", artista });
    }
}

export default new ArtistasController();
