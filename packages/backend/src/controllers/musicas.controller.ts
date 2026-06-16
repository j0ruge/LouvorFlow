import { Request, Response } from 'express';
import { z } from 'zod';
import musicasService from '../services/musicas.service.js';
import { listMusicasQuerySchema } from '../validators/musicas.validators.js';

type ListMusicasQuery = z.infer<typeof listMusicasQuerySchema>;

class MusicasController {
    // --- Base CRUD ---

    /**
     * Lista músicas paginadas com filtros opcionais por categorias, intensidade e busca textual.
     *
     * O middleware `validateRequest({ query: listMusicasQuerySchema })` valida `req.query`
     * e expõe o resultado coercido/transformado em `res.locals.query` — evitando re-parse.
     */
    async index(_req: Request, res: Response): Promise<void> {
        const { page, limit, categorias, intensidades, q } = res.locals.query as ListMusicasQuery;
        const result = await musicasService.listAll({ page, limit, categoriaIds: categorias, intensidades, q });
        res.status(200).json(result);
    }

    /** Retorna uma música pelo ID. */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const musica = await musicasService.getById(req.params.id);
        res.status(200).json(musica);
    }

    /**
     * Cria uma música simples com nome e tonalidade.
     * Recebe `tenantId` do usuário autenticado.
     */
    async create(req: Request, res: Response): Promise<void> {
        const musica = await musicasService.create(req.body, req.user!.tenantId!);
        res.status(201).json({ msg: "Música criada com sucesso", musica });
    }

    /** Atualiza uma música existente pelo ID. */
    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const musica = await musicasService.update(req.params.id, req.body);
        res.status(200).json({ msg: "Música editada com sucesso", musica });
    }

    /** Remove uma música pelo ID. */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const musica = await musicasService.delete(req.params.id);
        res.status(200).json({ msg: "Música deletada com sucesso", musica });
    }

    // --- Complete (música + versão atômica) ---

    /**
     * Cria uma música com versão opcional de forma atômica.
     * Recebe `tenantId` do usuário autenticado.
     */
    async createComplete(req: Request, res: Response): Promise<void> {
        const musica = await musicasService.createComplete(req.body, req.user!.tenantId!);
        res.status(201).json({ msg: "Música criada com sucesso", musica });
    }

    /**
     * Atualiza uma música e opcionalmente sua versão de forma atômica.
     * Recebe `tenantId` do usuário autenticado.
     */
    async updateComplete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const musica = await musicasService.updateComplete(req.params.id, req.body, req.user!.tenantId!);
        res.status(200).json({ msg: "Música editada com sucesso", musica });
    }

    // --- Junction: Versoes ---

    /** Lista as versões de uma música. */
    async listVersoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        const versoes = await musicasService.listVersoes(req.params.musicaId);
        res.status(200).json(versoes);
    }

    /**
     * Vincula uma versão (artista) a uma música.
     * Recebe `tenantId` do usuário autenticado.
     */
    async addVersao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        const versao = await musicasService.addVersao(req.params.musicaId, req.body, req.user!.tenantId!);
        res.status(201).json({ msg: "Versão adicionada com sucesso", versao });
    }

    /**
     * Atualiza uma versão existente.
     *
     * Detecta se o usuário autenticado possui role `admin` ou `super-admin` (já carregadas
     * em `req.user.roles` pelo middleware `can(['musicas.write'])`) e propaga essa informação
     * ao service via `allowArtistChange`. Admins podem corrigir o artista de uma versão já
     * vinculada; usuários comuns continuam impedidos pela regra padrão do service.
     */
    async updateVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        const isAdmin = req.user?.roles?.some(
            (role) => role.name === "admin" || role.name === "super-admin",
        ) ?? false;

        const versao = await musicasService.updateVersao(
            req.params.versaoId,
            req.body,
            { allowArtistChange: isAdmin },
        );
        res.status(200).json({ msg: "Versão editada com sucesso", versao });
    }

    /** Remove uma versão existente. */
    async removeVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        await musicasService.removeVersao(req.params.versaoId);
        res.status(200).json({ msg: "Versão removida com sucesso" });
    }

    // --- Junction: Categorias ---

    /** Lista as categorias associadas a uma música. */
    async listCategorias(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        const categorias = await musicasService.listCategorias(req.params.musicaId);
        res.status(200).json(categorias);
    }

    /**
     * Associa uma categoria a uma música.
     * Recebe `tenantId` do usuário autenticado.
     */
    async addCategoria(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        await musicasService.addCategoria(req.params.musicaId, req.body.categoria_id, req.user!.tenantId!);
        res.status(201).json({ msg: "Categoria adicionada com sucesso" });
    }

    /** Remove a associação de uma categoria com uma música. */
    async removeCategoria(req: Request<{ musicaId: string; categoriaId: string }>, res: Response): Promise<void> {
        await musicasService.removeCategoria(req.params.musicaId, req.params.categoriaId);
        res.status(200).json({ msg: "Categoria removida com sucesso" });
    }

    // --- Junction: Funcoes ---

    /** Lista as funções associadas a uma música. */
    async listFuncoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        const funcoes = await musicasService.listFuncoes(req.params.musicaId);
        res.status(200).json(funcoes);
    }

    /**
     * Associa uma função a uma música.
     * Recebe `tenantId` do usuário autenticado.
     */
    async addFuncao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        await musicasService.addFuncao(req.params.musicaId, req.body.funcao_id, req.user!.tenantId!);
        res.status(201).json({ msg: "Função adicionada com sucesso" });
    }

    /** Remove a associação de uma função com uma música. */
    async removeFuncao(req: Request<{ musicaId: string; funcaoId: string }>, res: Response): Promise<void> {
        await musicasService.removeFuncao(req.params.musicaId, req.params.funcaoId);
        res.status(200).json({ msg: "Função removida com sucesso" });
    }
}

export default new MusicasController();
