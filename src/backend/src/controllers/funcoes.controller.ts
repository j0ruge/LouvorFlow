import { Request, Response } from 'express';
import funcoesService from '../services/funcoes.service.js';
import { AppError } from '../errors/AppError.js';

class FuncoesController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const funcoes = await funcoesService.listAll();
            res.status(200).json(funcoes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar funções"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const funcao = await funcoesService.getById(req.params.id);
            res.status(200).json(funcao);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar função"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const funcao = await funcoesService.create(req.body.nome);
            res.status(201).json({ msg: "Função criada com sucesso", funcao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao criar função"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const funcao = await funcoesService.update(req.params.id, req.body.nome);
            res.status(200).json({ msg: "Função editada com sucesso", funcao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao editar função"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const funcao = await funcoesService.delete(req.params.id);
            res.status(200).json({ msg: "Função deletada com sucesso", funcao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao deletar função"] });
        }
    }
}

export default new FuncoesController();
