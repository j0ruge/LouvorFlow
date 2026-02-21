import { Request, Response } from 'express';
import integrantesService from '../services/integrantes.service.js';
import { AppError } from '../errors/AppError.js';

class IntegrantesController {
    async index(_req: Request, res: Response): Promise<void> {
        try {
            const integrantes = await integrantesService.listAll();
            res.status(200).json(integrantes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.errors ? error.errors.join('; ') : error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar integrantes", codigo: 500 });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const integrante = await integrantesService.getById(req.params.id);
            res.status(200).json(integrante);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar integrante", codigo: 500 });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const integrante = await integrantesService.create(req.body);
            res.status(201).json({ msg: "Integrante criado com sucesso", integrante });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar integrante", codigo: 500 });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const integrante = await integrantesService.update(req.params.id, req.body);
            res.status(200).json({ msg: "Integrante editado com sucesso", integrante });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar integrante", codigo: 500 });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const integrante = await integrantesService.delete(req.params.id);
            res.status(200).json({ msg: "Integrante deletado com sucesso", integrante });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao deletar integrante", codigo: 500 });
        }
    }

    async listFuncoes(req: Request<{ integranteId: string }>, res: Response): Promise<void> {
        try {
            const funcoes = await integrantesService.listFuncoes(req.params.integranteId);
            res.status(200).json(funcoes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar funções do integrante", codigo: 500 });
        }
    }

    async addFuncao(req: Request<{ integranteId: string }>, res: Response): Promise<void> {
        try {
            await integrantesService.addFuncao(req.params.integranteId, req.body.funcao_id);
            res.status(201).json({ msg: "Função adicionada ao integrante com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao adicionar função ao integrante", codigo: 500 });
        }
    }

    async removeFuncao(req: Request<{ integranteId: string; funcaoId: string }>, res: Response): Promise<void> {
        try {
            await integrantesService.removeFuncao(req.params.integranteId, req.params.funcaoId);
            res.status(200).json({ msg: "Função removida do integrante com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao remover função do integrante", codigo: 500 });
        }
    }
}

export default new IntegrantesController();
