import { Request, Response } from 'express';
import integrantesService from '../services/integrantes.service.js';

/**
 * Controller de integrantes — opera sobre o model Users unificado.
 * Endpoints mantêm retrocompatibilidade com naming em português.
 * Express 5 async error handling — sem try-catch.
 */
class IntegrantesController {
    /**
     * Lista todos os integrantes (users com funções mapeadas).
     */
    async index(_req: Request, res: Response): Promise<void> {
        const integrantes = await integrantesService.listAll();
        res.status(200).json(integrantes);
    }

    /**
     * Retorna um integrante (user) pelo ID com funções.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const integrante = await integrantesService.getById(req.params.id);
        res.status(200).json(integrante);
    }

    /**
     * Cria um novo integrante (user com capacidade de login).
     */
    async create(req: Request, res: Response): Promise<void> {
        const integrante = await integrantesService.create(req.body);
        res.status(201).json({ msg: "Integrante criado com sucesso", integrante });
    }

    /**
     * Atualiza os dados de um integrante (user).
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const integrante = await integrantesService.update(req.params.id, req.body);
        res.status(200).json({ msg: "Integrante editado com sucesso", integrante });
    }

    /**
     * Remove um integrante (user) pelo ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const integrante = await integrantesService.delete(req.params.id);
        res.status(200).json({ msg: "Integrante deletado com sucesso", integrante });
    }

    /**
     * Lista as funções musicais de um integrante (user).
     */
    async listFuncoes(req: Request<{ integranteId: string }>, res: Response): Promise<void> {
        const funcoes = await integrantesService.listFuncoes(req.params.integranteId);
        res.status(200).json(funcoes);
    }

    /**
     * Vincula uma função musical a um integrante (user).
     */
    async addFuncao(req: Request<{ integranteId: string }>, res: Response): Promise<void> {
        await integrantesService.addFuncao(req.params.integranteId, req.body.funcao_id);
        res.status(201).json({ msg: "Função adicionada ao integrante com sucesso" });
    }

    /**
     * Remove o vínculo entre integrante (user) e função musical.
     */
    async removeFuncao(req: Request<{ integranteId: string; funcaoId: string }>, res: Response): Promise<void> {
        await integrantesService.removeFuncao(req.params.integranteId, req.params.funcaoId);
        res.status(200).json({ msg: "Função removida do integrante com sucesso" });
    }
}

export default new IntegrantesController();
