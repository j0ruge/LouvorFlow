import { Request, Response } from 'express';
import funcoesService from '../services/funcoes.service.js';

/**
 * Controller de funções musicais.
 * Express 5 async error handling — sem try-catch.
 */
class FuncoesController {
    /**
     * Lista todas as funções cadastradas.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const funcoes = await funcoesService.listAll();
        res.status(200).json(funcoes);
    }

    /**
     * Retorna uma função pelo ID.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const funcao = await funcoesService.getById(req.params.id);
        res.status(200).json(funcao);
    }

    /**
     * Cria uma nova função no tenant ativo.
     */
    async create(req: Request, res: Response): Promise<void> {
        const funcao = await funcoesService.create(req.body.nome, req.user.tenantId!);
        res.status(201).json({ msg: "Função criada com sucesso", funcao });
    }

    /**
     * Atualiza o nome de uma função existente.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const funcao = await funcoesService.update(req.params.id, req.body.nome);
        res.status(200).json({ msg: "Função editada com sucesso", funcao });
    }

    /**
     * Remove uma função pelo ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const funcao = await funcoesService.delete(req.params.id);
        res.status(200).json({ msg: "Função deletada com sucesso", funcao });
    }
}

export default new FuncoesController();
