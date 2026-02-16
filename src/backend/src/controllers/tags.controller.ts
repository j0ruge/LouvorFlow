import { Request, Response } from 'express';
import tagsService from '../services/tags.service.js';
import { AppError } from '../errors/AppError.js';

class TagsController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const tags = await tagsService.listAll();
            res.status(200).json(tags);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar tags"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tag = await tagsService.getById(req.params.id);
            res.status(200).json(tag);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar tag"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const tag = await tagsService.create(req.body.nome);
            res.status(201).json({ msg: "Tag criada com sucesso", tag });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao criar tag"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tag = await tagsService.update(req.params.id, req.body.nome);
            res.status(200).json({ msg: "Tag editada com sucesso", tag });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao editar tag"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const tag = await tagsService.delete(req.params.id);
            res.status(200).json({ msg: "Tag deletada com sucesso", tag });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao deletar tag"] });
        }
    }
}

export default new TagsController();
