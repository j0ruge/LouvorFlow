import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';

const MUSICA_SELECT = {
    id: true,
    nome: true,
    musicas_fk_tonalidade_fkey: {
        select: { id: true, tom: true }
    },
    Musicas_Tags: {
        select: {
            musicas_tags_tag_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    },
    Artistas_Musicas: {
        select: {
            id: true,
            bpm: true,
            cifras: true,
            lyrics: true,
            link_versao: true,
            artistas_musicas_artista_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    },
    Musicas_Funcoes: {
        select: {
            musicas_funcoes_funcao_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    }
} as const;

interface IdNome {
    id: string;
    nome: string;
}

interface IdTom {
    id: string;
    tom: string;
}

interface VersaoRaw {
    id: string;
    bpm: number | null;
    cifras: string | null;
    lyrics: string | null;
    link_versao: string | null;
    artistas_musicas_artista_id_fkey: IdNome;
}

interface MusicaRaw {
    id: string;
    nome: string;
    musicas_fk_tonalidade_fkey: IdTom | null;
    Musicas_Tags: { musicas_tags_tag_id_fkey: IdNome }[];
    Artistas_Musicas: VersaoRaw[];
    Musicas_Funcoes: { musicas_funcoes_funcao_id_fkey: IdNome }[];
}

function formatMusica(m: MusicaRaw) {
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

class musicaController {
    // --- Base CRUD ---

    async index(req: Request, res: Response): Promise<void> {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
            const skip = (page - 1) * limit;

            const [musicas, total] = await Promise.all([
                prisma.musicas.findMany({
                    select: MUSICA_SELECT,
                    skip,
                    take: limit,
                    orderBy: { nome: 'asc' }
                }),
                prisma.musicas.count()
            ]);

            res.status(200).json({
                items: musicas.map(formatMusica),
                meta: {
                    total,
                    page,
                    per_page: limit,
                    total_pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar músicas"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de música não enviado"] });
                return;
            }

            const musica = await prisma.musicas.findUnique({
                where: { id },
                select: MUSICA_SELECT
            });

            if (!musica) {
                res.status(404).json({ errors: ["A música não foi encontrada ou não existe"] });
                return;
            }

            res.status(200).json(formatMusica(musica));
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar música"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nome, fk_tonalidade } = req.body;
            const errors: string[] = [];

            if (!nome) errors.push("Nome da música é obrigatório");
            if (!fk_tonalidade) errors.push("Tonalidade é obrigatória");

            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }

            const musica = await prisma.musicas.create({
                data: { nome, fk_tonalidade },
                select: {
                    id: true,
                    nome: true,
                    musicas_fk_tonalidade_fkey: {
                        select: { id: true, tom: true }
                    }
                }
            });

            res.status(201).json({
                msg: "Música criada com sucesso",
                musica: {
                    id: musica.id,
                    nome: musica.nome,
                    tonalidade: musica.musicas_fk_tonalidade_fkey
                }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar música"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de música não enviado"] });
                return;
            }

            const existente = await prisma.musicas.findUnique({ where: { id } });

            if (!existente) {
                res.status(404).json({ errors: ["A música não foi encontrada ou não existe"] });
                return;
            }

            const { nome, fk_tonalidade } = req.body;
            const updateData: Record<string, unknown> = {};
            if (nome !== undefined) updateData.nome = nome;
            if (fk_tonalidade !== undefined) updateData.fk_tonalidade = fk_tonalidade;

            const musica = await prisma.musicas.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    nome: true,
                    musicas_fk_tonalidade_fkey: {
                        select: { id: true, tom: true }
                    }
                }
            });

            res.status(200).json({
                msg: "Música editada com sucesso",
                musica: {
                    id: musica.id,
                    nome: musica.nome,
                    tonalidade: musica.musicas_fk_tonalidade_fkey
                }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar música"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de música não enviado"] });
                return;
            }

            const musica = await prisma.musicas.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!musica) {
                res.status(404).json({ errors: ["A música não foi encontrada ou não existe"] });
                return;
            }

            await prisma.musicas.delete({ where: { id } });
            res.status(200).json({
                msg: "Música deletada com sucesso",
                musica
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar música"] });
        }
    }

    // --- Junction: Versoes (artistas_musicas) ---

    async listVersoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId } = req.params;

            const versoes = await prisma.artistas_Musicas.findMany({
                where: { musica_id: musicaId },
                select: {
                    id: true,
                    bpm: true,
                    cifras: true,
                    lyrics: true,
                    link_versao: true,
                    artistas_musicas_artista_id_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            res.status(200).json(versoes.map(v => ({
                id: v.id,
                artista: v.artistas_musicas_artista_id_fkey,
                bpm: v.bpm,
                cifras: v.cifras,
                lyrics: v.lyrics,
                link_versao: v.link_versao
            })));
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar versões"] });
        }
    }

    async addVersao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId } = req.params;
            const { artista_id, bpm, cifras, lyrics, link_versao } = req.body;

            if (!artista_id) {
                res.status(400).json({ errors: ["ID do artista é obrigatório"] });
                return;
            }

            const existente = await prisma.artistas_Musicas.findUnique({
                where: { artista_id_musica_id: { artista_id, musica_id: musicaId } }
            });

            if (existente) {
                res.status(409).json({ errors: ["Registro duplicado"] });
                return;
            }

            const versao = await prisma.artistas_Musicas.create({
                data: { artista_id, musica_id: musicaId, bpm, cifras, lyrics, link_versao },
                select: {
                    id: true,
                    bpm: true,
                    cifras: true,
                    lyrics: true,
                    link_versao: true,
                    artistas_musicas_artista_id_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            res.status(201).json({
                msg: "Versão adicionada com sucesso",
                versao: {
                    id: versao.id,
                    artista: versao.artistas_musicas_artista_id_fkey,
                    bpm: versao.bpm,
                    cifras: versao.cifras,
                    lyrics: versao.lyrics,
                    link_versao: versao.link_versao
                }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao adicionar versão"] });
        }
    }

    async updateVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        try {
            const { versaoId } = req.params;
            const { bpm, cifras, lyrics, link_versao } = req.body;

            const existente = await prisma.artistas_Musicas.findUnique({ where: { id: versaoId } });

            if (!existente) {
                res.status(404).json({ errors: ["Versão não encontrada"] });
                return;
            }

            const updateData: Record<string, unknown> = {};
            if (bpm !== undefined) updateData.bpm = bpm;
            if (cifras !== undefined) updateData.cifras = cifras;
            if (lyrics !== undefined) updateData.lyrics = lyrics;
            if (link_versao !== undefined) updateData.link_versao = link_versao;

            const versao = await prisma.artistas_Musicas.update({
                where: { id: versaoId },
                data: updateData,
                select: {
                    id: true,
                    bpm: true,
                    cifras: true,
                    lyrics: true,
                    link_versao: true,
                    artistas_musicas_artista_id_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            res.status(200).json({
                msg: "Versão editada com sucesso",
                versao: {
                    id: versao.id,
                    artista: versao.artistas_musicas_artista_id_fkey,
                    bpm: versao.bpm,
                    cifras: versao.cifras,
                    lyrics: versao.lyrics,
                    link_versao: versao.link_versao
                }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar versão"] });
        }
    }

    async removeVersao(req: Request<{ versaoId: string }>, res: Response): Promise<void> {
        try {
            const { versaoId } = req.params;

            const versao = await prisma.artistas_Musicas.findUnique({ where: { id: versaoId } });

            if (!versao) {
                res.status(404).json({ errors: ["Versão não encontrada"] });
                return;
            }

            await prisma.artistas_Musicas.delete({ where: { id: versaoId } });
            res.status(200).json({ msg: "Versão removida com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao remover versão"] });
        }
    }

    // --- Junction: Tags (musicas_tags) ---

    async listTags(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId } = req.params;

            const tags = await prisma.musicas_Tags.findMany({
                where: { musica_id: musicaId },
                select: {
                    musicas_tags_tag_id_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            res.status(200).json(tags.map(t => t.musicas_tags_tag_id_fkey));
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tags"] });
        }
    }

    async addTag(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId } = req.params;
            const { tag_id } = req.body;

            if (!tag_id) {
                res.status(400).json({ errors: ["ID da tag é obrigatório"] });
                return;
            }

            const existente = await prisma.musicas_Tags.findUnique({
                where: { musica_id_tag_id: { musica_id: musicaId, tag_id } }
            });

            if (existente) {
                res.status(409).json({ errors: ["Registro duplicado"] });
                return;
            }

            await prisma.musicas_Tags.create({
                data: { musica_id: musicaId, tag_id }
            });

            res.status(201).json({ msg: "Tag adicionada com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao adicionar tag"] });
        }
    }

    async removeTag(req: Request<{ musicaId: string; tagId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId, tagId } = req.params;

            const registro = await prisma.musicas_Tags.findUnique({
                where: { musica_id_tag_id: { musica_id: musicaId, tag_id: tagId } }
            });

            if (!registro) {
                res.status(404).json({ errors: ["Registro não encontrado"] });
                return;
            }

            await prisma.musicas_Tags.delete({ where: { id: registro.id } });
            res.status(200).json({ msg: "Tag removida com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao remover tag"] });
        }
    }

    // --- Junction: Funcoes (musicas_funcoes) ---

    async listFuncoes(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId } = req.params;

            const funcoes = await prisma.musicas_Funcoes.findMany({
                where: { musica_id: musicaId },
                select: {
                    musicas_funcoes_funcao_id_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            res.status(200).json(funcoes.map(f => f.musicas_funcoes_funcao_id_fkey));
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar funções"] });
        }
    }

    async addFuncao(req: Request<{ musicaId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId } = req.params;
            const { funcao_id } = req.body;

            if (!funcao_id) {
                res.status(400).json({ errors: ["ID da função é obrigatório"] });
                return;
            }

            const existente = await prisma.musicas_Funcoes.findUnique({
                where: { musica_id_funcao_id: { musica_id: musicaId, funcao_id } }
            });

            if (existente) {
                res.status(409).json({ errors: ["Registro duplicado"] });
                return;
            }

            await prisma.musicas_Funcoes.create({
                data: { musica_id: musicaId, funcao_id }
            });

            res.status(201).json({ msg: "Função adicionada com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao adicionar função"] });
        }
    }

    async removeFuncao(req: Request<{ musicaId: string; funcaoId: string }>, res: Response): Promise<void> {
        try {
            const { musicaId, funcaoId } = req.params;

            const registro = await prisma.musicas_Funcoes.findUnique({
                where: { musica_id_funcao_id: { musica_id: musicaId, funcao_id: funcaoId } }
            });

            if (!registro) {
                res.status(404).json({ errors: ["Registro não encontrado"] });
                return;
            }

            await prisma.musicas_Funcoes.delete({ where: { id: registro.id } });
            res.status(200).json({ msg: "Função removida com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao remover função"] });
        }
    }
}

export default new musicaController();
