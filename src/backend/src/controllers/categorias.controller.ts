import { Request, Response } from 'express';
import categoriasService from '../services/categorias.service.js';
import { AppError } from '../errors/AppError.js';

/**
 * Controller responsável pelo gerenciamento de categorias.
 * Recebe requisições HTTP e delega a lógica ao CategoriasService.
 */
class CategoriasController {
    /**
     * Lista todas as categorias cadastradas.
     * @param _req - Objeto de requisição (não utilizado).
     * @param res - Resposta HTTP com status 200 e array de categorias.
     */
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const categorias = await categoriasService.listAll();
            res.status(200).json(categorias);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.errors ? error.errors.join('; ') : error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar categorias", codigo: 500 });
        }
    }

    /**
     * Retorna uma categoria pelo ID.
     * @param req - Requisição com `req.params.id` identificando a categoria.
     * @param res - Resposta HTTP com status 200 e a categoria encontrada.
     * @throws AppError 400 se o ID não for enviado; 404 se não encontrada.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.getById(req.params.id);
            res.status(200).json(categoria);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar categoria", codigo: 500 });
        }
    }

    /**
     * Cria uma nova categoria.
     * @param req - Requisição com `req.body.nome` contendo o nome da categoria.
     * @param res - Resposta HTTP com status 201 e a categoria criada.
     * @throws AppError 400 se o nome não for enviado; 409 se já existir.
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.create(req.body.nome);
            res.status(201).json({ msg: "Categoria criada com sucesso", categoria });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar categoria", codigo: 500 });
        }
    }

    /**
     * Atualiza o nome de uma categoria existente.
     * @param req - Requisição com `req.params.id` e `req.body.nome`.
     * @param res - Resposta HTTP com status 200 e a categoria atualizada.
     * @throws AppError 400 se ID ou nome ausente; 404 se não encontrada; 409 se nome duplicado.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const categoria = await categoriasService.update(req.params.id, req.body.nome);
            res.status(200).json({ msg: "Categoria editada com sucesso", categoria });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar categoria", codigo: 500 });
        }
    }

    /**
     * Remove uma categoria pelo ID.
     * @param req - Requisição com `req.params.id` identificando a categoria.
     * @param res - Resposta HTTP com status 200 e a categoria removida.
     * @throws AppError 400 se o ID não for enviado; 404 se não encontrada.
     */
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
