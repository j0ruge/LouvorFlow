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
            link_versao: v.link_versao,
            intensidade: v.intensidade
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

    /**
     * Cria uma nova música com nome e tonalidade.
     *
     * @param body - Dados da música (nome e tonalidade)
     * @param tenantId - ID do tenant proprietário
     * @returns Música criada com id, nome e tonalidade
     * @throws {AppError} 400 se nome ou tonalidade ausentes; 404 se tonalidade não existir
     */
    async create(body: { nome?: string; fk_tonalidade?: string }, tenantId: string) {
        const { nome, fk_tonalidade } = body;
        const errors: string[] = [];

        if (!nome) errors.push("Nome da música é obrigatório");
        if (!fk_tonalidade) errors.push("Tonalidade é obrigatória");

        if (errors.length > 0) throw new AppError(errors[0], 400, errors);

        const tonalidade = await tonalidadesRepository.findById(fk_tonalidade!);
        if (!tonalidade) throw new AppError("Tonalidade não encontrada", 404);

        const musica = await musicasRepository.create({ nome: nome!, fk_tonalidade: fk_tonalidade! }, tenantId);

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
     * Versão é criada quando artista_id ou qualquer campo de versão é fornecido.
     * Artista é opcional — versão pode existir sem artista vinculado.
     *
     * @param body - Dados de criação completa
     * @param tenantId - ID do tenant proprietário
     * @returns Música criada formatada com todos os relacionamentos
     * @throws {AppError} 400 se nome ausente; 404 se tonalidade/artista/categoria/função não existir
     */
    async createComplete(body: CreateMusicaCompleteInput, tenantId: string): Promise<Musica> {
        const { nome, fk_tonalidade, artista_id, bpm, cifras, lyrics, link_versao, intensidade, categoria_ids, funcao_ids } = body;

        if (!nome) throw new AppError("Nome da música é obrigatório", 400);

        if (fk_tonalidade) {
            const tonalidade = await tonalidadesRepository.findById(fk_tonalidade);
            if (!tonalidade) throw new AppError("Tonalidade não encontrada", 404);
        }

        if (artista_id) {
            const artista = await musicasRepository.findArtistaById(artista_id);
            if (!artista) throw new AppError("Artista não encontrado", 404);
        }

        await this.validarCategoriaIds(categoria_ids);
        await this.validarFuncaoIds(funcao_ids);

        const result = await musicasRepository.createWithVersao(body, tenantId);
        return formatMusica(result);
    }

    /**
     * Atualiza uma música e opcionalmente sua versão de forma atômica.
     * Valida existência de categorias e funções quando fornecidas.
     *
     * @param id - UUID da música
     * @param body - Dados de atualização completa
     * @param tenantId - ID do tenant proprietário
     * @returns Música atualizada formatada com todos os relacionamentos
     * @throws {AppError} 400 se nome ausente; 404 se música/tonalidade/versão/categoria/função não existir
     */
    async updateComplete(id: string, body: UpdateMusicaCompleteInput, tenantId: string): Promise<Musica> {
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

        const result = await musicasRepository.updateWithVersao(id, body, tenantId);
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
            link_versao: v.link_versao,
            intensidade: v.intensidade
        }));
    }

    /**
     * Vincula uma versão (artista_musicas) a uma música existente. Artista é opcional.
     * Quando artista_id é fornecido, valida existência e duplicata normal.
     * Quando artista_id é ausente/null, permite max 1 versão sem artista por música (FR-004).
     *
     * @param musicaId - ID da música
     * @param body - Dados da versão (artista_id opcional, bpm, cifras, lyrics, link_versao, intensidade)
     * @param tenantId - ID do tenant proprietário
     * @returns Versão criada com dados do artista (ou null se sem artista)
     * @throws {AppError} 404 se música ou artista não existir; 409 se duplicado
     */
    async addVersao(musicaId: string, body: { artista_id?: string; bpm?: number; cifras?: string; lyrics?: string; link_versao?: string; intensidade?: string }, tenantId: string) {
        const { artista_id, bpm, cifras, lyrics, link_versao, intensidade } = body;

        const temAlgumCampo = artista_id || bpm !== undefined || cifras || lyrics || link_versao || intensidade;
        if (!temAlgumCampo) throw new AppError("Informe ao menos um campo da versão", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        if (artista_id) {
            const artistaExiste = await musicasRepository.findArtistaById(artista_id);
            if (!artistaExiste) throw new AppError("Artista não encontrado", 404);

            const existente = await musicasRepository.findVersaoDuplicate(musicaId, artista_id);
            if (existente) throw new AppError("Registro duplicado", 409);
        } else {
            const versaoSemArtista = await musicasRepository.findVersaoWithoutArtist(musicaId);
            if (versaoSemArtista) throw new AppError("Registro duplicado", 409);
        }

        const versao = await musicasRepository.createVersao({
            artista_id: artista_id ?? null, musica_id: musicaId, bpm, cifras, lyrics, link_versao, intensidade
        }, tenantId);

        return {
            id: versao.id,
            artista: versao.artistas_musicas_artista_id_fkey,
            bpm: versao.bpm,
            cifras: versao.cifras,
            lyrics: versao.lyrics,
            link_versao: versao.link_versao,
            intensidade: versao.intensidade
        };
    }

    /**
     * Atualiza uma versão existente. Aceita artista_id apenas quando a versão não tem artista vinculado (null → artista).
     * Rejeita artista_id quando a versão já possui artista (400).
     *
     * @param versaoId - UUID da versão
     * @param body - Dados de atualização (artista_id opcional, bpm, cifras, lyrics, link_versao, intensidade)
     * @returns Versão atualizada com dados do artista
     * @throws {AppError} 400 se nenhum campo enviado ou artista_id enviado para versão com artista; 404 se versão ou artista não existir
     */
    async updateVersao(versaoId: string, body: { artista_id?: string; bpm?: number; cifras?: string; lyrics?: string; link_versao?: string; intensidade?: string }) {
        const existente = await musicasRepository.findVersaoById(versaoId);
        if (!existente) throw new AppError("Versão não encontrada", 404);

        const { artista_id, bpm, cifras, lyrics, link_versao, intensidade } = body;
        const updateData: Record<string, unknown> = {};

        if (artista_id !== undefined) {
            if (existente.artista_id && existente.artista_id !== artista_id) {
                throw new AppError("Não é permitido alterar artista já vinculado", 400);
            }
            const artistaExiste = await musicasRepository.findArtistaById(artista_id);
            if (!artistaExiste) throw new AppError("Artista não encontrado", 404);

            const duplicata = await musicasRepository.findVersaoDuplicate(existente.musica_id, artista_id);
            if (duplicata && duplicata.id !== versaoId) throw new AppError("Registro duplicado", 409);

            updateData.artista_id = artista_id;
        }

        if (bpm !== undefined) updateData.bpm = bpm;
        if (cifras !== undefined) updateData.cifras = cifras;
        if (lyrics !== undefined) updateData.lyrics = lyrics;
        if (link_versao !== undefined) updateData.link_versao = link_versao;
        if (intensidade !== undefined) updateData.intensidade = intensidade;

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
            link_versao: versao.link_versao,
            intensidade: versao.intensidade
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
     * @param tenantId - ID do tenant proprietário
     * @throws {AppError} 400 se `categoria_id` não informado, 404 se música ou categoria não existir, 409 se duplicado
     */
    async addCategoria(musicaId: string, categoria_id: string | undefined, tenantId: string) {
        if (!categoria_id) throw new AppError("ID da categoria é obrigatório", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        const categoriaExiste = await musicasRepository.findCategoriaById(categoria_id);
        if (!categoriaExiste) throw new AppError("Categoria não encontrada", 404);

        const existente = await musicasRepository.findCategoriaDuplicate(musicaId, categoria_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await musicasRepository.createCategoria(musicaId, categoria_id, tenantId);
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

    /**
     * Vincula uma função a uma música, validando existência e duplicidade.
     *
     * @param musicaId - ID da música
     * @param funcao_id - ID da função a vincular
     * @param tenantId - ID do tenant proprietário
     * @throws {AppError} 400 se `funcao_id` não informado, 404 se música ou função não existir, 409 se duplicado
     */
    async addFuncao(musicaId: string, funcao_id: string | undefined, tenantId: string) {
        if (!funcao_id) throw new AppError("ID da função é obrigatório", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        const funcaoExiste = await musicasRepository.findFuncaoById(funcao_id);
        if (!funcaoExiste) throw new AppError("Função não encontrada", 404);

        const existente = await musicasRepository.findFuncaoDuplicate(musicaId, funcao_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await musicasRepository.createFuncao(musicaId, funcao_id, tenantId);
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