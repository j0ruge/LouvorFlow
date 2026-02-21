import { Prisma } from '@prisma/client';
import prisma from '../../prisma/cliente.js';
import categoriasRepository from './categorias.repository.js';
import { MUSICA_SELECT } from '../types/index.js';
import type { CreateMusicaCompleteInput, UpdateMusicaCompleteInput, MusicaRaw } from '../types/index.js';

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

    /**
     * Cria uma música e opcionalmente uma versão (artista_musicas) em transação atômica.
     *
     * @param data - Dados de criação completa (música + versão opcional)
     * @returns Música criada com todos os relacionamentos (MUSICA_SELECT)
     */
    async createWithVersao(data: CreateMusicaCompleteInput): Promise<MusicaRaw> {
        return prisma.$transaction(async (tx) => {
            const musica = await tx.musicas.create({
                data: {
                    nome: data.nome!,
                    fk_tonalidade: data.fk_tonalidade ?? null,
                },
            });

            if (data.artista_id) {
                await tx.artistas_Musicas.create({
                    data: {
                        artista_id: data.artista_id,
                        musica_id: musica.id,
                        bpm: data.bpm ?? null,
                        cifras: data.cifras ?? null,
                        lyrics: data.lyrics ?? null,
                        link_versao: data.link_versao ?? null,
                    },
                });
            }

            return tx.musicas.findUniqueOrThrow({
                where: { id: musica.id },
                select: MUSICA_SELECT,
            });
        });
    }

    /**
     * Atualiza uma música e opcionalmente uma versão existente em transação atômica.
     *
     * @param id - UUID da música a atualizar
     * @param data - Dados de atualização completa (música + versão opcional)
     * @returns Música atualizada com todos os relacionamentos (MUSICA_SELECT)
     */
    async updateWithVersao(id: string, data: UpdateMusicaCompleteInput): Promise<MusicaRaw> {
        return prisma.$transaction(async (tx) => {
            const updateData: Record<string, unknown> = {};
            if (data.nome !== undefined) updateData.nome = data.nome;
            if (data.fk_tonalidade !== undefined) updateData.fk_tonalidade = data.fk_tonalidade;

            await tx.musicas.update({
                where: { id },
                data: updateData,
            });

            if (data.versao_id) {
                const versaoUpdate: Record<string, unknown> = {};
                if (data.bpm !== undefined) versaoUpdate.bpm = data.bpm;
                if (data.cifras !== undefined) versaoUpdate.cifras = data.cifras;
                if (data.lyrics !== undefined) versaoUpdate.lyrics = data.lyrics;
                if (data.link_versao !== undefined) versaoUpdate.link_versao = data.link_versao;

                if (Object.keys(versaoUpdate).length > 0) {
                    await tx.artistas_Musicas.update({
                        where: { id: data.versao_id },
                        data: versaoUpdate,
                    });
                }
            }

            return tx.musicas.findUniqueOrThrow({
                where: { id },
                select: MUSICA_SELECT,
            });
        });
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

    // --- Categorias (musicas_categorias) ---

    /**
     * Busca todas as categorias vinculadas a uma música.
     *
     * @param musicaId - ID da música
     * @returns Lista de registros contendo a categoria (id e nome) de cada vínculo
     */
    async findCategorias(musicaId: string) {
        return prisma.musicas_Categorias.findMany({
            where: { musica_id: musicaId },
            select: {
                musicas_categorias_categoria_id_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    /**
     * Cria um vínculo entre uma música e uma categoria.
     *
     * @param musicaId - ID da música
     * @param categoriaId - ID da categoria a vincular
     * @returns Registro criado na tabela intermediária
     */
    async createCategoria(musicaId: string, categoriaId: string) {
        return prisma.musicas_Categorias.create({
            data: { musica_id: musicaId, categoria_id: categoriaId }
        });
    }

    /**
     * Remove um vínculo música–categoria pelo ID do registro intermediário.
     *
     * @param id - ID do registro na tabela `musicas_categorias`
     * @returns Registro removido
     */
    async deleteCategoria(id: string) {
        return prisma.musicas_Categorias.delete({ where: { id } });
    }

    /**
     * Verifica se já existe um vínculo entre a música e a categoria (chave composta).
     *
     * @param musicaId - ID da música
     * @param categoriaId - ID da categoria
     * @returns Registro existente ou `null` se não houver duplicata
     */
    async findCategoriaDuplicate(musicaId: string, categoriaId: string) {
        return prisma.musicas_Categorias.findUnique({
            where: { musica_id_categoria_id: { musica_id: musicaId, categoria_id: categoriaId } }
        });
    }

    /**
     * Busca uma categoria pelo ID, delegando ao repositório de categorias.
     *
     * @param categoriaId - ID da categoria
     * @returns Categoria encontrada ou `null` se não existir
     */
    async findCategoriaById(categoriaId: string) {
        return categoriasRepository.findById(categoriaId);
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
