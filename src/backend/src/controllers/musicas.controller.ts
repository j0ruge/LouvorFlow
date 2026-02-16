import { Request, Response } from 'express';
import musicasService from '../services/musicas.service.js';
import { AppError } from '../errors/AppError.js';

class MusicasController {
    // --- Base CRUD ---

    async index(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const result = await musicasService.listAll(page, limit);
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar músicas"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const musica = await musicasService.getById(req.params.id);
            res.status(200).json(musica);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar música"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const musica = await musicasService.create(req.body);
            res.status(201).json({ msg: "Música criada com sucesso", musica });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao criar música"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const musica = await musicasService.update(req.params.id, req.body);
            res.status(200).json({ msg: "Música editada com sucesso", musica });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao editar música"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const musica = await musicasService.delete(req.params.id);
            res.status(200).json({ msg: "Música deletada com sucesso", musica });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao deletar música"] });
        }
    }

    // --- Junction: Versoes ---

    async listVersoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const versoes = await musicasService.listVersoes(req.params.musicaId);
            res.status(200).json(versoes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar versões"] });
        }
    }

    async addVersao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const versao = await musicasService.addVersao(req.params.musicaId, req.body);
            res.status(201).json({ msg: "Versão adicionada com sucesso", versao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao adicionar versão"] });
        }
    }

    async updateVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        try {
            const versao = await musicasService.updateVersao(req.params.versaoId, req.body);
            res.status(200).json({ msg: "Versão editada com sucesso", versao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao editar versão"] });
        }
    }

    async removeVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.removeVersao(req.params.versaoId);
            res.status(200).json({ msg: "Versão removida com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao remover versão"] });
        }
    }

    // --- Junction: Tags ---

    async listTags(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const tags = await musicasService.listTags(req.params.musicaId);
            res.status(200).json(tags);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar tags"] });
        }
    }

    async addTag(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.addTag(req.params.musicaId, req.body.tag_id);
            res.status(201).json({ msg: "Tag adicionada com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao adicionar tag"] });
        }
    }

    async removeTag(req: Request<{ musicaId: string; tagId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.removeTag(req.params.musicaId, req.params.tagId);
            res.status(200).json({ msg: "Tag removida com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao remover tag"] });
        }
    }

    // --- Junction: Funcoes ---

    async listFuncoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const funcoes = await musicasService.listFuncoes(req.params.musicaId);
            res.status(200).json(funcoes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao buscar funções"] });
        }
    }

    async addFuncao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.addFuncao(req.params.musicaId, req.body.funcao_id);
            res.status(201).json({ msg: "Função adicionada com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao adicionar função"] });
        }
    }

    async removeFuncao(req: Request<{ musicaId: string; funcaoId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.removeFuncao(req.params.musicaId, req.params.funcaoId);
            res.status(200).json({ msg: "Função removida com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ errors: error.errors || [error.message] }); return; }
            res.status(500).json({ errors: ["Erro ao remover função"] });
        }
    }
}

export default new MusicasController();
