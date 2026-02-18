import { Request, Response } from 'express';
import categoriasService from '../services/categorias.service.js';
import { AppError } from '../errors/AppError.js';

class CategoriasController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const categorias = await categoriasService.listAll();
            res.status(200).json(categorias);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.errors ? error.errors.join('; ') : error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar categorias", codigo: 500 });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.getById(req.params.id);
            res.status(200).json(categoria);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar categoria", codigo: 500 });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.create(req.body.nome);
            res.status(201).json({ msg: "Categoria criada com sucesso", categoria });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar categoria", codigo: 500 });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.update(req.params.id, req.body.nome);
            res.status(200).json({ msg: "Categoria editada com sucesso", categoria });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar categoria", codigo: 500 });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.delete(req.params.id);
            res.status(200).json({ msg: "Categoria deletada com sucesso", categoria });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao deletar categoria", codigo: 500 });
        }
    }
}

export default new CategoriasController();
