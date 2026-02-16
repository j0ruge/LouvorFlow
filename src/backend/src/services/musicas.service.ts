import { AppError } from '../errors/AppError.js';
import musicasRepository from '../repositories/musicas.repository.js';
import tonalidadesRepository from '../repositories/tonalidades.repository.js';
import type { MusicaRaw, Musica } from '../types/index.js';

function formatMusica(m: MusicaRaw): Musica {
    return {
        id: m.id,
        nome: m.nome,
        tonalidade: m.musicas_fk_tonalidade_fkey,
        tags: m.Musicas_Tags.map(t => t.musicas_tags_tag_id_fkey),
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

    // --- Tags ---

    async listTags(musicaId: string) {
        const tags = await musicasRepository.findTags(musicaId);
        return tags.map(t => t.musicas_tags_tag_id_fkey);
    }

    async addTag(musicaId: string, tag_id?: string) {
        if (!tag_id) throw new AppError("ID da tag é obrigatório", 400);

        const musicaExiste = await musicasRepository.findByIdSimple(musicaId);
        if (!musicaExiste) throw new AppError("Música não encontrada", 404);

        const tagExiste = await musicasRepository.findTagById(tag_id);
        if (!tagExiste) throw new AppError("Tag não encontrada", 404);

        const existente = await musicasRepository.findTagDuplicate(musicaId, tag_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await musicasRepository.createTag(musicaId, tag_id);
    }

    async removeTag(musicaId: string, tagId: string) {
        const registro = await musicasRepository.findTagDuplicate(musicaId, tagId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await musicasRepository.deleteTag(registro.id);
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
}

export default new MusicasService();
