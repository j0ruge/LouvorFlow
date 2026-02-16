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

    async update(id: string, data: Record<string, unknown>) {
        return prisma.eventos.update({
            where: { id },
            data: data as any,
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

    async findIntegrantes(eventoId: string) {
        return prisma.eventos_Integrantes.findMany({
            where: { evento_id: eventoId },
            select: {
                eventos_integrantes_musico_id_fkey: {
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

    async createIntegrante(eventoId: string, musicoId: string) {
        return prisma.eventos_Integrantes.create({
            data: { evento_id: eventoId, musico_id: musicoId }
        });
    }

    async deleteIntegrante(id: string) {
        return prisma.eventos_Integrantes.delete({ where: { id } });
    }

    async findIntegranteDuplicate(eventoId: string, musicoId: string) {
        return prisma.eventos_Integrantes.findUnique({
            where: { evento_id_musico_id: { evento_id: eventoId, musico_id: musicoId } }
        });
    }

    async findIntegranteById(musicoId: string) {
        return prisma.integrantes.findUnique({ where: { id: musicoId } });
    }
}

export default new EventosRepository();
