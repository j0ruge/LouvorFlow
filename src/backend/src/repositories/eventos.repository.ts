import { Prisma } from '@prisma/client';
import prisma from '../../prisma/cliente.js';
import { EVENTO_INDEX_SELECT, EVENTO_SHOW_SELECT } from '../types/index.js';

class EventosRepository {
    async findAll() {
        return prisma.eventos.findMany({
            select: EVENTO_INDEX_SELECT,
            orderBy: { data: 'desc' }
        });
    }

    async findById(id: string) {
        return prisma.eventos.findUnique({
            where: { id },
            select: EVENTO_SHOW_SELECT
        });
    }

    async findByIdSimple(id: string) {
        return prisma.eventos.findUnique({ where: { id } });
    }

    async create(data: { data: Date; fk_tipo_evento: string; descricao: string }) {
        return prisma.eventos.create({
            data,
            select: {
                id: true,
                data: true,
                descricao: true,
                eventos_fk_tipo_evento_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    async update(id: string, data: Prisma.EventosUncheckedUpdateInput) {
        return prisma.eventos.update({
            where: { id },
            data,
            select: {
                id: true,
                data: true,
                descricao: true,
                eventos_fk_tipo_evento_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    async delete(id: string) {
        return prisma.eventos.delete({ where: { id } });
    }

    async findByIdForDelete(id: string) {
        return prisma.eventos.findUnique({
            where: { id },
            select: { id: true, data: true, descricao: true }
        });
    }

    // --- Musicas (eventos_musicas) ---

    async findMusicas(eventoId: string) {
        return prisma.eventos_Musicas.findMany({
            where: { evento_id: eventoId },
            select: {
                eventos_musicas_musicas_id_fkey: {
                    select: {
                        id: true,
                        nome: true,
                        musicas_fk_tonalidade_fkey: {
                            select: { id: true, tom: true }
                        }
                    }
                }
            }
        });
    }

    async createMusica(eventoId: string, musicasId: string) {
        return prisma.eventos_Musicas.create({
            data: { evento_id: eventoId, musicas_id: musicasId }
        });
    }

    async deleteMusica(id: string) {
        return prisma.eventos_Musicas.delete({ where: { id } });
    }

    async findMusicaDuplicate(eventoId: string, musicasId: string) {
        return prisma.eventos_Musicas.findUnique({
            where: { evento_id_musicas_id: { evento_id: eventoId, musicas_id: musicasId } }
        });
    }

    async findMusicaById(musicasId: string) {
        return prisma.musicas.findUnique({ where: { id: musicasId } });
    }

    // --- Integrantes (eventos_integrantes) ---

    /**
     * Retorna os integrantes vinculados a um evento, incluindo suas funções.
     *
     * @param eventoId - ID do evento
     * @returns Lista de integrantes com id, nome e funções associadas
     */
    async findIntegrantes(eventoId: string) {
        return prisma.eventos_Integrantes.findMany({
            where: { evento_id: eventoId },
            select: {
                eventos_integrantes_fk_integrante_id_fkey: {
                    select: {
                        id: true,
                        nome: true,
                        Integrantes_Funcoes: {
                            select: {
                                integrantes_funcoes_funcao_id_fkey: {
                                    select: { id: true, nome: true }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Cria a associação entre um evento e um integrante.
     *
     * @param eventoId - ID do evento
     * @param integranteId - ID do integrante a ser vinculado
     * @returns Registro criado na tabela Eventos_Integrantes
     */
    async createIntegrante(eventoId: string, integranteId: string) {
        return prisma.eventos_Integrantes.create({
            data: { evento_id: eventoId, fk_integrante_id: integranteId }
        });
    }

    /**
     * Remove a associação entre um evento e um integrante pelo ID do registro.
     *
     * @param id - ID do registro em Eventos_Integrantes
     * @returns Registro removido
     */
    async deleteIntegrante(id: string) {
        return prisma.eventos_Integrantes.delete({ where: { id } });
    }

    /**
     * Verifica se já existe um vínculo entre o evento e o integrante informados.
     *
     * @param eventoId - ID do evento
     * @param integranteId - ID do integrante
     * @returns Registro existente ou `null` se não houver duplicata
     */
    async findIntegranteDuplicate(eventoId: string, integranteId: string) {
        return prisma.eventos_Integrantes.findUnique({
            where: { evento_id_fk_integrante_id: { evento_id: eventoId, fk_integrante_id: integranteId } }
        });
    }

    /**
     * Busca um integrante pelo seu ID na tabela de integrantes.
     *
     * @param integranteId - ID do integrante
     * @returns Integrante encontrado ou `null` se não existir
     */
    async findIntegranteById(integranteId: string) {
        return prisma.integrantes.findUnique({ where: { id: integranteId } });
    }
}

export default new EventosRepository();
