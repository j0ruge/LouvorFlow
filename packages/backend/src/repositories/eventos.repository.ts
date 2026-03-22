import { Prisma } from '@prisma/client';
import prisma, { getPrisma } from '../../prisma/cliente.js';
import { EVENTO_INDEX_SELECT, EVENTO_SHOW_SELECT } from '../types/index.js';

class EventosRepository {
    async findAll() {
        return getPrisma().eventos.findMany({
            select: EVENTO_INDEX_SELECT,
            orderBy: { data: 'desc' }
        });
    }

    async findById(id: string) {
        return getPrisma().eventos.findUnique({
            where: { id },
            select: EVENTO_SHOW_SELECT
        });
    }

    async findByIdSimple(id: string) {
        return getPrisma().eventos.findUnique({ where: { id } });
    }

    async create(data: { data: Date; fk_tipo_evento: string; descricao: string }) {
        return getPrisma().eventos.create({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id é injetado pelo interceptor forTenant em runtime
            data: { ...data, tenant_id: '' as any },
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
        return getPrisma().eventos.update({
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
        return getPrisma().eventos.delete({ where: { id } });
    }

    async findByIdForDelete(id: string) {
        return getPrisma().eventos.findUnique({
            where: { id },
            select: { id: true, data: true, descricao: true }
        });
    }

    // --- Musicas (eventos_musicas) ---

    async findMusicas(eventoId: string) {
        return getPrisma().eventos_Musicas.findMany({
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
        return getPrisma().eventos_Musicas.create({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id é injetado pelo interceptor forTenant em runtime
            data: { evento_id: eventoId, musicas_id: musicasId, tenant_id: '' as any }
        });
    }

    async deleteMusica(id: string) {
        return getPrisma().eventos_Musicas.delete({ where: { id } });
    }

    async findMusicaDuplicate(eventoId: string, musicasId: string) {
        return getPrisma().eventos_Musicas.findFirst({
            where: { evento_id: eventoId, musicas_id: musicasId }
        });
    }

    async findMusicaById(musicasId: string) {
        return getPrisma().musicas.findUnique({ where: { id: musicasId } });
    }

    // --- Integrantes (eventos_users) ---

    /**
     * Retorna os users vinculados a um evento com as funções selecionadas para o evento.
     *
     * Opera sobre `Eventos_Users` → `Eventos_Users_Funcoes` → `Funcoes`.
     *
     * @param eventoId - ID do evento
     * @returns Lista de registros com user e funções selecionadas para o evento
     */
    async findIntegrantes(eventoId: string) {
        return getPrisma().eventos_Users.findMany({
            where: { evento_id: eventoId },
            select: {
                eventos_users_fk_user_id_fkey: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                Eventos_Users_Funcoes: {
                    select: {
                        eventos_users_funcoes_funcao_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
    }

    /**
     * Cria a associação entre um evento e um user, incluindo as funções selecionadas.
     *
     * Usa transação para criar o registro em `Eventos_Users` e os registros
     * correspondentes em `Eventos_Users_Funcoes`.
     *
     * @param eventoId - ID do evento
     * @param userId - ID do user a ser vinculado
     * @param funcaoIds - IDs das funções selecionadas para o evento
     * @returns Registro criado na tabela Eventos_Users
     */
    async createIntegrante(eventoId: string, userId: string, funcaoIds: string[]) {
        return getPrisma().$transaction(async (tx) => {
            const eventoUser = await tx.eventos_Users.create({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id é injetado pelo interceptor forTenant em runtime
                data: { evento_id: eventoId, fk_user_id: userId, tenant_id: '' as any }
            });

            if (funcaoIds.length > 0) {
                await Promise.all(
                    funcaoIds.map(funcaoId =>
                        tx.eventos_Users_Funcoes.create({
                            data: {
                                evento_user_id: eventoUser.id,
                                funcao_id: funcaoId,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id é injetado pelo interceptor forTenant em runtime
                                tenant_id: '' as any,
                            }
                        })
                    )
                );
            }

            return eventoUser;
        });
    }

    /**
     * Busca as funções globais (Users_Funcoes) de um user.
     *
     * @param userId - ID do user
     * @returns Lista de IDs de funções do user
     */
    async findUserFuncoes(userId: string) {
        return getPrisma().users_Funcoes.findMany({
            where: { fk_user_id: userId },
            select: { funcao_id: true }
        });
    }

    /**
     * Remove a associação entre um evento e um user pelo ID do registro.
     *
     * @param id - ID do registro em Eventos_Users
     * @returns Registro removido
     */
    async deleteIntegrante(id: string) {
        return getPrisma().eventos_Users.delete({ where: { id } });
    }

    /**
     * Verifica se já existe um vínculo entre o evento e o user informados.
     *
     * @param eventoId - ID do evento
     * @param userId - ID do user
     * @returns Registro existente ou `null` se não houver duplicata
     */
    async findIntegranteDuplicate(eventoId: string, userId: string) {
        return getPrisma().eventos_Users.findFirst({
            where: { evento_id: eventoId, fk_user_id: userId }
        });
    }

    /**
     * Busca um user pelo ID (valida existência antes de vincular a evento).
     * Usa o client base pois `users` é um modelo global (não filtrado por tenant).
     *
     * @param userId - ID do user
     * @returns User encontrado ou `null` se não existir
     */
    async findIntegranteById(userId: string) {
        return prisma.users.findUnique({ where: { id: userId } });
    }
}

export default new EventosRepository();
