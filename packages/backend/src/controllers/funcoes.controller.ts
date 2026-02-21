import { Request, Response } from 'express';
import funcoesService from '../services/funcoes.service.js';
import { AppError } from '../errors/AppError.js';

class FuncoesController {
    private handleAction<P = Record<string, string>>(
        handler: (req: Request<P>, res: Response) => Promise<void>,
        fallbackMessage: string
    ) {
        return async (req: Request<P>, res: Response): Promise<void> => {
            try {
                await handler(req, res);
            } catch (error) {
                if (error instanceof AppError) {
                    res.status(error.statusCode).json({ erro: error.errors ? error.errors.join('; ') : error.message, codigo: error.statusCode });
                    return;
                }
                res.status(500).json({ erro: fallbackMessage, codigo: 500 });
            }
        };
    }

    index = this.handleAction(async (_req, res) => {
        const funcoes = await funcoesService.listAll();
        res.status(200).json(funcoes);
    }, "Erro ao buscar funções");

    show = this.handleAction<{ id: string }>(async (req, res) => {
        const funcao = await funcoesService.getById(req.params.id);
        res.status(200).json(funcao);
    }, "Erro ao buscar função");

    create = this.handleAction(async (req, res) => {
        const funcao = await funcoesService.create(req.body.nome);
        res.status(201).json({ msg: "Função criada com sucesso", funcao });
    }, "Erro ao criar função");

    update = this.handleAction<{ id: string }>(async (req, res) => {
        const funcao = await funcoesService.update(req.params.id, req.body.nome);
        res.status(200).json({ msg: "Função editada com sucesso", funcao });
    }, "Erro ao editar função");

    delete = this.handleAction<{ id: string }>(async (req, res) => {
        const funcao = await funcoesService.delete(req.params.id);
        res.status(200).json({ msg: "Função deletada com sucesso", funcao });
    }, "Erro ao deletar função");
}

export default new FuncoesController();
