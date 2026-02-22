import { Prisma } from '@prisma/client';
import prisma from '../../prisma/cliente.js';
import categoriasRepository from './categorias.repository.js';
import { MUSICA_SELECT } from '../types/index.js';
import type { CreateMusicaCompleteInput, UpdateMusicaCompleteInput, MusicaRaw } from '../types/index.js';

/**
 * Subconjunto mínimo de um delegate Prisma para tabelas de junção.
 * Usado pelo método `syncJunction` para operar de forma genérica.
 */
interface JunctionDelegate {
    findMany(args: { where: Record<string, unknown>; select: Record<string, boolean> }): Promise<Record<string, string>[]>;
    deleteMany(args: { where: Record<string, unknown> }): Promise<unknown>;
    createMany(args: { data: Record<string, unknown>[] }): Promise<unknown>;
}

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
     * Também cria junções de categorias e funções requeridas se fornecidas.
     *
     * @param data - Dados de criação completa (música + versão opcional + categorias/funções)
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

            const categoriaIds = [...new Set(data.categoria_ids ?? [])];
            if (categoriaIds.length > 0) {
                await tx.musicas_Categorias.createMany({
                    data: categoriaIds.map(id => ({ musica_id: musica.id, categoria_id: id })),
                });
            }

            const funcaoIds = [...new Set(data.funcao_ids ?? [])];
            if (funcaoIds.length > 0) {
                await tx.musicas_Funcoes.createMany({
                    data: funcaoIds.map(id => ({ musica_id: musica.id, funcao_id: id })),
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
     * Sincroniza junções de categorias e funções via diff (adiciona novos, remove ausentes).
     *
     * @param id - UUID da música a atualizar
     * @param data - Dados de atualização completa (música + versão + categorias/funções)
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

            if (data.categoria_ids !== undefined) {
                await this.syncJunction(tx, id, data.categoria_ids, {
                    model: tx.musicas_Categorias,
                    parentKey: 'musica_id',
                    childKey: 'categoria_id',
                });
            }

            if (data.funcao_ids !== undefined) {
                await this.syncJunction(tx, id, data.funcao_ids, {
                    model: tx.musicas_Funcoes,
                    parentKey: 'musica_id',
                    childKey: 'funcao_id',
                });
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

    /**
     * Conta quantas categorias existem dentre os IDs fornecidos.
     *
     * @param ids - Array de UUIDs de categorias
     * @returns Quantidade de categorias encontradas
     */
    async countCategoriasByIds(ids: string[]) {
        return prisma.categorias.count({ where: { id: { in: ids } } });
    }

    /**
     * Conta quantas funções existem dentre os IDs fornecidos.
     *
     * @param ids - Array de UUIDs de funções
     * @returns Quantidade de funções encontradas
     */
    async countFuncoesByIds(ids: string[]) {
        return prisma.funcoes.count({ where: { id: { in: ids } } });
    }

    // --- Helpers ---

    /**
     * Sincroniza registros de uma tabela de junção via diff.
     * Compara IDs desejados com existentes, remove os ausentes e adiciona os novos.
     *
     * @param tx - Transação Prisma ativa
     * @param parentId - ID do registro pai (música)
     * @param desejadosRaw - Array de IDs desejados
     * @param config - Configuração do modelo de junção (model, parentKey, childKey)
     */
    private async syncJunction(
        tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
        parentId: string,
        desejadosRaw: string[],
        config: { model: JunctionDelegate; parentKey: string; childKey: string },
    ) {
        const desejados = [...new Set(desejadosRaw)];
        const existentes = await config.model.findMany({
            where: { [config.parentKey]: parentId },
            select: { [config.childKey]: true },
        });
        const atuais = existentes.map((e: Record<string, string>) => e[config.childKey]);

        const adicionar = desejados.filter((id: string) => !atuais.includes(id));
        const remover = atuais.filter((id: string) => !desejados.includes(id));

        if (remover.length > 0) {
            await config.model.deleteMany({
                where: { [config.parentKey]: parentId, [config.childKey]: { in: remover } },
            });
        }
        if (adicionar.length > 0) {
            await config.model.createMany({
                data: adicionar.map((id: string) => ({ [config.parentKey]: parentId, [config.childKey]: id })),
            });
        }
    }
}

export default new MusicasRepository();
