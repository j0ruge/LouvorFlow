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

    // --- Integrantes (eventos_users) ---

    /**
     * Retorna os users vinculados a um evento, incluindo suas funções musicais.
     *
     * Opera sobre `Eventos_Users` → `Users` → `Users_Funcoes`.
     *
     * @param eventoId - ID do evento
     * @returns Lista de registros de `Eventos_Users` com relações aninhadas de user e funções
     */
    async findIntegrantes(eventoId: string) {
        return prisma.eventos_Users.findMany({
            where: { evento_id: eventoId },
            select: {
                eventos_users_fk_user_id_fkey: {
                    select: {
                        id: true,
                        name: true,
                        Users_Funcoes: {
                            select: {
                                users_funcoes_funcao_id_fkey: {
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
     * Cria a associação entre um evento e um user.
     *
     * @param eventoId - ID do evento
     * @param userId - ID do user a ser vinculado
     * @returns Registro criado na tabela Eventos_Users
     */
    async createIntegrante(eventoId: string, userId: string) {
        return prisma.eventos_Users.create({
            data: { evento_id: eventoId, fk_user_id: userId }
        });
    }

    /**
     * Remove a associação entre um evento e um user pelo ID do registro.
     *
     * @param id - ID do registro em Eventos_Users
     * @returns Registro removido
     */
    async deleteIntegrante(id: string) {
        return prisma.eventos_Users.delete({ where: { id } });
    }

    /**
     * Verifica se já existe um vínculo entre o evento e o user informados.
     *
     * @param eventoId - ID do evento
     * @param userId - ID do user
     * @returns Registro existente ou `null` se não houver duplicata
     */
    async findIntegranteDuplicate(eventoId: string, userId: string) {
        return prisma.eventos_Users.findUnique({
            where: { evento_id_fk_user_id: { evento_id: eventoId, fk_user_id: userId } }
        });
    }

    /**
     * Busca um user pelo ID (valida existência antes de vincular a evento).
     *
     * @param userId - ID do user
     * @returns User encontrado ou `null` se não existir
     */
    async findIntegranteById(userId: string) {
        return prisma.users.findUnique({ where: { id: userId } });
    }
}

export default new EventosRepository();
