import { Prisma } from '@prisma/client';
import prisma from '../../prisma/cliente.js';
import tagsRepository from './tags.repository.js';
import { MUSICA_SELECT } from '../types/index.js';

class MusicasRepository {
    async findAll(skip: number, take: number) {
        return prisma.musicas.findMany({
            select: MUSICA_SELECT,
            skip,
            take,
            orderBy: { nome: 'asc' }
        });
    }

    async count() {
        return prisma.musicas.count();
    }

    async findById(id: string) {
        return prisma.musicas.findUnique({
            where: { id },
            select: MUSICA_SELECT
        });
    }

    async findByIdSimple(id: string) {
        return prisma.musicas.findUnique({ where: { id } });
    }

    async findByIdNameOnly(id: string) {
        return prisma.musicas.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async create(data: { nome: string; fk_tonalidade: string }) {
        return prisma.musicas.create({
            data,
            select: {
                id: true,
                nome: true,
                musicas_fk_tonalidade_fkey: {
                    select: { id: true, tom: true }
                }
            }
        });
    }

    async update(id: string, data: Prisma.MusicasUpdateInput) {
        return prisma.musicas.update({
            where: { id },
            data,
            select: {
                id: true,
                nome: true,
                musicas_fk_tonalidade_fkey: {
                    select: { id: true, tom: true }
                }
            }
        });
    }

    async delete(id: string) {
        return prisma.musicas.delete({ where: { id } });
    }

    // --- Versoes (artistas_musicas) ---

    async findVersoes(musicaId: string) {
        return prisma.artistas_Musicas.findMany({
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
    }

    async findVersaoById(versaoId: string) {
        return prisma.artistas_Musicas.findUnique({ where: { id: versaoId } });
    }

    async createVersao(data: { artista_id: string; musica_id: string; bpm?: number; cifras?: string; lyrics?: string; link_versao?: string }) {
        return prisma.artistas_Musicas.create({
            data,
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
    }

    async updateVersao(versaoId: string, data: Prisma.Artistas_MusicasUpdateInput) {
        return prisma.artistas_Musicas.update({
            where: { id: versaoId },
            data,
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
    }

    async deleteVersao(versaoId: string) {
        return prisma.artistas_Musicas.delete({ where: { id: versaoId } });
    }

    async findVersaoDuplicate(musicaId: string, artistaId: string) {
        return prisma.artistas_Musicas.findUnique({
            where: { artista_id_musica_id: { artista_id: artistaId, musica_id: musicaId } }
        });
    }

    async findArtistaById(artistaId: string) {
        return prisma.artistas.findUnique({ where: { id: artistaId } });
    }

    // --- Tags (musicas_tags) ---

    async findTags(musicaId: string) {
        return prisma.musicas_Tags.findMany({
            where: { musica_id: musicaId },
            select: {
                musicas_tags_tag_id_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    async createTag(musicaId: string, tagId: string) {
        return prisma.musicas_Tags.create({
            data: { musica_id: musicaId, tag_id: tagId }
        });
    }

    async deleteTag(id: string) {
        return prisma.musicas_Tags.delete({ where: { id } });
    }

    async findTagDuplicate(musicaId: string, tagId: string) {
        return prisma.musicas_Tags.findUnique({
            where: { musica_id_tag_id: { musica_id: musicaId, tag_id: tagId } }
        });
    }

    async findTagById(tagId: string) {
        return tagsRepository.findById(tagId);
    }

    // --- Funcoes (musicas_funcoes) ---

    async findFuncoes(musicaId: string) {
        return prisma.musicas_Funcoes.findMany({
            where: { musica_id: musicaId },
            select: {
                musicas_funcoes_funcao_id_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    async createFuncao(musicaId: string, funcaoId: string) {
        return prisma.musicas_Funcoes.create({
            data: { musica_id: musicaId, funcao_id: funcaoId }
        });
    }

    async deleteFuncao(id: string) {
        return prisma.musicas_Funcoes.delete({ where: { id } });
    }

    async findFuncaoDuplicate(musicaId: string, funcaoId: string) {
        return prisma.musicas_Funcoes.findUnique({
            where: { musica_id_funcao_id: { musica_id: musicaId, funcao_id: funcaoId } }
        });
    }

    async findFuncaoById(funcaoId: string) {
        return prisma.funcoes.findUnique({ where: { id: funcaoId } });
    }
}

export default new MusicasRepository();
