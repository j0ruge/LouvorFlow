import { Request, Response } from 'express';
import categoriasService from '../services/categorias.service.js';

/**
 * Controller de categorias.
 * Express 5 async error handling — sem try-catch.
 */
class CategoriasController {
    /**
     * Lista todas as categorias cadastradas.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const categorias = await categoriasService.listAll();
        res.status(200).json(categorias);
    }

    /**
     * Retorna uma categoria pelo ID.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const categoria = await categoriasService.getById(req.params.id);
        res.status(200).json(categoria);
    }

    /**
     * Cria uma nova categoria no tenant ativo.
     */
    async create(req: Request, res: Response): Promise<void> {
        const categoria = await categoriasService.create(req.body.nome, req.user.tenantId!);
        res.status(201).json({ msg: "Categoria criada com sucesso", categoria });
    }

    /**
     * Atualiza o nome de uma categoria existente.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const categoria = await categoriasService.update(req.params.id, req.body.nome);
        res.status(200).json({ msg: "Categoria editada com sucesso", categoria });
    }

    /**
     * Remove uma categoria pelo ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const categoria = await categoriasService.delete(req.params.id);
        res.status(200).json({ msg: "Categoria deletada com sucesso", categoria });
    }
}

export default new CategoriasController();
