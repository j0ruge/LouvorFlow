import { Request, Response } from 'express';
import funcoesGruposService from '../services/funcoes-grupos.service.js';

/**
 * Controller de grupos de funções.
 * Express 5 async error handling — sem try-catch.
 */
class FuncoesGruposController {
    /**
     * Lista todos os grupos com suas funções, na ordem de exibição.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const grupos = await funcoesGruposService.listAll();
        res.status(200).json(grupos);
    }

    /**
     * Cria um novo grupo no fim da sequência.
     */
    async create(req: Request, res: Response): Promise<void> {
        const grupo = await funcoesGruposService.create(req.body.nome, req.user!.tenantId!);
        res.status(201).json({ msg: "Grupo criado com sucesso", grupo });
    }

    /**
     * Renomeia um grupo existente.
     */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const grupo = await funcoesGruposService.update(req.params.id, req.body.nome);
        res.status(200).json({ msg: "Grupo editado com sucesso", grupo });
    }

    /**
     * Remove um grupo; suas funções ficam sem grupo.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const grupo = await funcoesGruposService.delete(req.params.id);
        res.status(200).json({ msg: "Grupo deletado com sucesso", grupo });
    }

    /**
     * Reordena todos os grupos conforme a lista de IDs recebida.
     */
    async reorder(req: Request, res: Response): Promise<void> {
        await funcoesGruposService.reorder(req.body.grupos_ids);
        res.status(200).json({ msg: "Grupos reordenados com sucesso" });
    }

    /**
     * Define quais funções pertencem ao grupo, substituindo o conjunto atual.
     */
    async setFuncoes(req: Request<{ id: string }>, res: Response): Promise<void> {
        const grupo = await funcoesGruposService.setFuncoes(req.params.id, req.body.funcoes_ids);
        res.status(200).json({ msg: "Funções do grupo atualizadas com sucesso", grupo });
    }
}

export default new FuncoesGruposController();
