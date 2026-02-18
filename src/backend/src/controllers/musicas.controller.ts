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
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.errors ? error.errors.join('; ') : error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar músicas", codigo: 500 });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const musica = await musicasService.getById(req.params.id);
            res.status(200).json(musica);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar música", codigo: 500 });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const musica = await musicasService.create(req.body);
            res.status(201).json({ msg: "Música criada com sucesso", musica });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao criar música", codigo: 500 });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const musica = await musicasService.update(req.params.id, req.body);
            res.status(200).json({ msg: "Música editada com sucesso", musica });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar música", codigo: 500 });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const musica = await musicasService.delete(req.params.id);
            res.status(200).json({ msg: "Música deletada com sucesso", musica });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao deletar música", codigo: 500 });
        }
    }

    // --- Junction: Versoes ---

    async listVersoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const versoes = await musicasService.listVersoes(req.params.musicaId);
            res.status(200).json(versoes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar versões", codigo: 500 });
        }
    }

    async addVersao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const versao = await musicasService.addVersao(req.params.musicaId, req.body);
            res.status(201).json({ msg: "Versão adicionada com sucesso", versao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao adicionar versão", codigo: 500 });
        }
    }

    async updateVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        try {
            const versao = await musicasService.updateVersao(req.params.versaoId, req.body);
            res.status(200).json({ msg: "Versão editada com sucesso", versao });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao editar versão", codigo: 500 });
        }
    }

    async removeVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.removeVersao(req.params.versaoId);
            res.status(200).json({ msg: "Versão removida com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao remover versão", codigo: 500 });
        }
    }

    // --- Junction: Categorias ---

    async listCategorias(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const categorias = await musicasService.listCategorias(req.params.musicaId);
            res.status(200).json(categorias);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar categorias", codigo: 500 });
        }
    }

    async addCategoria(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.addCategoria(req.params.musicaId, req.body.categoria_id);
            res.status(201).json({ msg: "Categoria adicionada com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao adicionar categoria", codigo: 500 });
        }
    }

    async removeCategoria(req: Request<{ musicaId: string; categoriaId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.removeCategoria(req.params.musicaId, req.params.categoriaId);
            res.status(200).json({ msg: "Categoria removida com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao remover categoria", codigo: 500 });
        }
    }

    // --- Junction: Funcoes ---

    async listFuncoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const funcoes = await musicasService.listFuncoes(req.params.musicaId);
            res.status(200).json(funcoes);
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao buscar funções", codigo: 500 });
        }
    }

    async addFuncao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.addFuncao(req.params.musicaId, req.body.funcao_id);
            res.status(201).json({ msg: "Função adicionada com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao adicionar função", codigo: 500 });
        }
    }

    async removeFuncao(req: Request<{ musicaId: string; funcaoId: string }>, res: Response): Promise<void> {
        try {
            await musicasService.removeFuncao(req.params.musicaId, req.params.funcaoId);
            res.status(200).json({ msg: "Função removida com sucesso" });
        } catch (error) {
            if (error instanceof AppError) { res.status(error.statusCode).json({ erro: error.message, codigo: error.statusCode }); return; }
            res.status(500).json({ erro: "Erro ao remover função", codigo: 500 });
        }
    }
}

export default new MusicasController();
