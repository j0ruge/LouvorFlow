import { AppError } from '../errors/AppError.js';
import musicasRepository from '../repositories/musicas.repository.js';
import tonalidadesRepository from '../repositories/tonalidades.repository.js';
import type { MusicaRaw, Musica, CreateMusicaCompleteInput, UpdateMusicaCompleteInput } from '../types/index.js';

/**
 * Converte um registro bruto `MusicaRaw` do banco em um objeto `Musica` normalizado.
 *
 * @param m - Registro bruto da música incluindo campos relacionados e arrays de junção
 * @returns Objeto `Musica` normalizado com `id`, `nome`, `tonalidade`, `categorias`, `versoes` e `funcoes`
 */
function formatMusica(m: MusicaRaw): Musica {
    return {
        id: m.id,
        nome: m.nome,
        tonalidade: m.musicas_fk_tonalidade_fkey,
        categorias: m.Musicas_Categorias.map(t => t.musicas_categorias_categoria_id_fkey),
        versoes: m.Artistas_Musicas.map(v => ({
            id: v.id,
            artista: v.artistas_musicas_artista_id_fkey,
            bpm: v.bpm,
            cifras: v.cifras,
            lyrics: v.lyrics,
            link_versao: v.link_versao
        })),
        funcoes: m.Musicas_Funcoes.map(f => f.musicas_funcoes_funcao_id_fkey)
    };
}

class MusicasService {
    // --- Base CRUD ---

    async listAll(page: number, limit: number) {
        page = Math.max(1, page || 1);
        limit = Math.min(100, Math.max(1, limit || 20));
        const skip = (page - 1) * limit;

        const [musicas, total] = await Promise.all([
            musicasRepository.findAll(skip, limit),
            musicasRepository.count()
        ]);

        return {
            items: musicas.map(formatMusica),
            meta: {
                total,
                page,
                per_page: limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de música não enviado", 400);

        const musica = await musicasRepository.findById(id);
        if (!musica) throw new AppError("A música não foi encontrada ou não existe", 404);

        return formatMusica(musica);
    }

    async create(body: { nome?: string; fk_tonalidade?: string }) {
        const { nome, fk_tonalidade } = body;
        const errors: string[] = [];

        if (!nome) errors.push("Nome da música é obrigatório");
        if (!fk_tonalidade) errors.push("Tonalidade é obrigatória");

        if (errors.length > 0) throw new AppError(errors[0], 400, errors);

        const tonalidade = await tonalidadesRepository.findById(fk_tonalidade!);
        if (!tonalidade) throw new AppError("Tonalidade não encontrada", 404);

        const musica = await musicasRepository.create({ nome: nome!, fk_tonalidade: fk_tonalidade! });

        return {
            id: musica.id,
            nome: musica.nome,
            tonalidade: musica.musicas_fk_tonalidade_fkey
        };
    }

    async update(id: string, body: { nome?: string; fk_tonalidade?: string }) {
        if (!id) throw new AppError("ID de música não enviado", 400);

        const existente = await musicasRepository.findByIdSimple(id);
        if (!existente) throw new AppError("A música não foi encontrada ou não existe", 404);

        const { nome, fk_tonalidade } = body;
        const updateData: Record<string, unknown> = {};
        if (nome !== undefined) updateData.nome = nome;
        if (fk_tonalidade !== undefined) {
            const tonalidade = await tonalidadesRepository.findById(fk_tonalidade);
            if (!tonalidade) throw new AppError("Tonalidade não encontrada", 404);
            updateData.fk_tonalidade = fk_tonalidade;
        }

        const musica = await musicasRepository.update(id, updateData);

        return {
            id: musica.id,
            nome: musica.nome,
            tonalidade: musica.musicas_fk_tonalidade_fkey
        };
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de música não enviado", 400);

        const musica = await musicasRepository.findByIdNameOnly(id);
        if (!musica) throw new AppError("A música não foi encontrada ou não existe", 404);

        await musicasRepository.delete(id);
        return musica;
    }

    // --- Complete (música + versão atômica) ---

    /**
     * Cria uma música com versão opcional de forma atômica.
     * Se campos de versão forem preenchidos, exige `artista_id`.
     * Valida existência de categorias e funções quando fornecidas.
     *
     * @param body - Dados de criação completa
     * @returns Música criada formatada com todos os relacionamentos
     * @throws {AppError} 400 se nome ausente ou versão sem artista; 404 se tonalidade/artista/categoria/função não existir
     */
    async createComplete(body: CreateMusicaCompleteInput): Promise<Musica> {
        const { nome, fk_tonalidade, artista_id, bpm, cifras, lyrics, link_versao, categoria_ids, funcao_ids } = body;

        if (!nome) throw new AppError("Nome da música é obrigatório", 400);

        if (fk_tonalidade) {
            const tonalidade = await tonalidadesRepository.findById(fk_tonalidade);
            if (!tonalidade) throw new AppError("Tonalidade não encontrada", 404);
        }

        const temCamposVersao = bpm !== undefined || cifras !== undefined || lyrics !== undefined || link_versao !== undefined;

        if (temCamposVersao && !artista_id) {
            throw new AppError("Artista é obrigatório para criar uma versão", 400);
        }

        if (artista_id) {
            const artista = await musicasRepository.findArtistaById(artista_id);
            if (!artista) throw new AppError("Artista não encontrado", 404);
        }

        await this.validarCategoriaIds(categoria_ids);
        await this.validarFuncaoIds(funcao_ids);

        const result = await musicasRepository.createWithVersao(body);
        return formatMusica(result);
    }

    /**
     * Atualiza uma música e opcionalmente sua versão de forma atômica.
     * Valida existência de categorias e funções quando fornecidas.
     *
     * @param id - UUID da música
     * @param body - Dados de atualização completa
     * @returns Música atualizada formatada com todos os relacionamentos
     * @throws {AppError} 400 se nome ausente; 404 se música/tonalidade/versão/categoria/função não existir
     */
    async updateComplete(id: string, body: UpdateMusicaCompleteInput): Promise<Musica> {
        if (!id) throw new AppError("ID de música não enviado", 400);

        const { nome, fk_tonalidade, versao_id, categoria_ids, funcao_ids } = body;

        if (!nome) throw new AppError("Nome da música é obrigatório", 400);

        const existente = await musicasRepository.findByIdSimple(id);
        if (!existente) throw new AppError("A música não foi encontrada ou não existe", 404);

        if (fk_tonalidade) {
            const tonalidade = await tonalidadesRepository.findById(fk_tonalidade);
            if (!tonalidade) throw new AppError("Tonalidade não encontrada", 404);
        }

        if (versao_id) {
            const versao = await musicasRepository.findVersaoById(versao_id);
            if (!versao) throw new AppError("Versão não encontrada", 404);
        }

        await this.validarCategoriaIds(categoria_ids);
        await this.validarFuncaoIds(funcao_ids);

        const result = await musicasRepository.updateWithVersao(id, body);
        return formatMusica(result);
    }

    // --- Versoes ---

    async listVersoes(musicaId: string) {
        const versoes = await musicasRepository.findVersoes(musicaId);
        return versoes.map(v => ({
            id: v.id,
            artista: v.artistas_musicas_artista_id_fkey,
            bpm: v.bpm,
            cifras: v.cifras,
            lyrics: v.lyrics,
            link_versao: v.link_versao
        }));
    }

    async addVersao(musicaId: string, body: { artista_id?: string; bpm?: number; cifras?: string; lyrics?: string; link_versao?: string }) {
        const { artista_id, bpm, cifras, lyrics, link_versao } = body;

        if (!artista_id) throw new AppError("ID do artista é obrigatório", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        const artistaExiste = await musicasRepository.findArtistaById(artista_id);
        if (!artistaExiste) throw new AppError("Artista não encontrado", 404);

        const existente = await musicasRepository.findVersaoDuplicate(musicaId, artista_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        const versao = await musicasRepository.createVersao({
            artista_id, musica_id: musicaId, bpm, cifras, lyrics, link_versao
        });

        return {
            id: versao.id,
            artista: versao.artistas_musicas_artista_id_fkey,
            bpm: versao.bpm,
            cifras: versao.cifras,
            lyrics: versao.lyrics,
            link_versao: versao.link_versao
        };
    }

    async updateVersao(versaoId: string, body: { bpm?: number; cifras?: string; lyrics?: string; link_versao?: string }) {
        const existente = await musicasRepository.findVersaoById(versaoId);
        if (!existente) throw new AppError("Versão não encontrada", 404);

        const { bpm, cifras, lyrics, link_versao } = body;
        const updateData: Record<string, unknown> = {};
        if (bpm !== undefined) updateData.bpm = bpm;
        if (cifras !== undefined) updateData.cifras = cifras;
        if (lyrics !== undefined) updateData.lyrics = lyrics;
        if (link_versao !== undefined) updateData.link_versao = link_versao;

        if (Object.keys(updateData).length === 0) {
            throw new AppError("Ao menos um campo deve ser enviado para atualização", 400);
        }

        const versao = await musicasRepository.updateVersao(versaoId, updateData);

        return {
            id: versao.id,
            artista: versao.artistas_musicas_artista_id_fkey,
            bpm: versao.bpm,
            cifras: versao.cifras,
            lyrics: versao.lyrics,
            link_versao: versao.link_versao
        };
    }

    async removeVersao(versaoId: string) {
        const versao = await musicasRepository.findVersaoById(versaoId);
        if (!versao) throw new AppError("Versão não encontrada", 404);

        await musicasRepository.deleteVersao(versaoId);
    }

    // --- Categorias ---

    /**
     * Lista todas as categorias vinculadas a uma música.
     *
     * @param musicaId - ID da música
     * @returns Array de categorias (cada uma com `id` e `nome`)
     */
    async listCategorias(musicaId: string) {
        const categorias = await musicasRepository.findCategorias(musicaId);
        return categorias.map(t => t.musicas_categorias_categoria_id_fkey);
    }

    /**
     * Vincula uma categoria a uma música, validando existência e duplicidade.
     *
     * @param musicaId - ID da música
     * @param categoria_id - ID da categoria a vincular
     * @throws {AppError} 400 se `categoria_id` não informado, 404 se música ou categoria não existir, 409 se duplicado
     */
    async addCategoria(musicaId: string, categoria_id?: string) {
        if (!categoria_id) throw new AppError("ID da categoria é obrigatório", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        const categoriaExiste = await musicasRepository.findCategoriaById(categoria_id);
        if (!categoriaExiste) throw new AppError("Categoria não encontrada", 404);

        const existente = await musicasRepository.findCategoriaDuplicate(musicaId, categoria_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await musicasRepository.createCategoria(musicaId, categoria_id);
    }

    /**
     * Remove o vínculo entre uma música e uma categoria.
     *
     * @param musicaId - ID da música
     * @param categoriaId - ID da categoria a desvincular
     * @throws {AppError} 404 se o vínculo não existir
     */
    async removeCategoria(musicaId: string, categoriaId: string) {
        const registro = await musicasRepository.findCategoriaDuplicate(musicaId, categoriaId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await musicasRepository.deleteCategoria(registro.id);
    }

    // --- Funcoes ---

    async listFuncoes(musicaId: string) {
        const funcoes = await musicasRepository.findFuncoes(musicaId);
        return funcoes.map(f => f.musicas_funcoes_funcao_id_fkey);
    }

    async addFuncao(musicaId: string, funcao_id?: string) {
        if (!funcao_id) throw new AppError("ID da função é obrigatório", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        const funcaoExiste = await musicasRepository.findFuncaoById(funcao_id);
        if (!funcaoExiste) throw new AppError("Função não encontrada", 404);

        const existente = await musicasRepository.findFuncaoDuplicate(musicaId, funcao_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await musicasRepository.createFuncao(musicaId, funcao_id);
    }

    async removeFuncao(musicaId: string, funcaoId: string) {
        const registro = await musicasRepository.findFuncaoDuplicate(musicaId, funcaoId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await musicasRepository.deleteFuncao(registro.id);
    }

    // --- Validação auxiliar ---

    /**
     * Valida que todos os IDs de categorias existem no banco via contagem batch.
     *
     * @param ids - Array de UUIDs de categorias (undefined = ignorar)
     * @throws {AppError} 404 se alguma categoria não for encontrada
     */
    private async validarCategoriaIds(ids?: string[]) {
        if (!ids || ids.length === 0) return;
        const unicos = [...new Set(ids)];
        const count = await musicasRepository.countCategoriasByIds(unicos);
        if (count !== unicos.length) throw new AppError("Categoria não encontrada", 404);
    }

    /**
     * Valida que todos os IDs de funções existem no banco via contagem batch.
     *
     * @param ids - Array de UUIDs de funções (undefined = ignorar)
     * @throws {AppError} 404 se alguma função não for encontrada
     */
    private async validarFuncaoIds(ids?: string[]) {
        if (!ids || ids.length === 0) return;
        const unicos = [...new Set(ids)];
        const count = await musicasRepository.countFuncoesByIds(unicos);
        if (count !== unicos.length) throw new AppError("Função não encontrada", 404);
    }
}

export default new MusicasService();