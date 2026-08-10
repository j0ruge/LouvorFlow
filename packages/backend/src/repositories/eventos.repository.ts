import { Prisma } from '@prisma/client';
import prisma, { getPrisma } from '../../prisma/cliente.js';
import { EVENTO_INDEX_SELECT, EVENTO_SHOW_SELECT } from '../types/index.js';

class EventosRepository {
    /** Retorna todos os eventos ordenados por data decrescente. */
    async findAll() {
        return getPrisma().eventos.findMany({
            select: EVENTO_INDEX_SELECT,
            orderBy: { data: 'desc' }
        });
    }

    /** Busca um evento pelo ID com todas as relações (músicas, integrantes, funções). */
    async findById(id: string) {
        return getPrisma().eventos.findUnique({
            where: { id },
            select: EVENTO_SHOW_SELECT
        });
    }

    /** Busca um evento pelo ID sem incluir relações (validação de existência). */
    async findByIdSimple(id: string) {
        return getPrisma().eventos.findUnique({ where: { id } });
    }

    /**
     * Cria um novo evento vinculado ao tenant informado.
     *
     * @param data - Dados do evento (data, tipo, descrição)
     * @param tenantId - ID do tenant ao qual o evento pertence
     * @returns Evento criado com tipo de evento populado
     */
    async create(data: { data: Date; fk_tipo_evento: string; descricao: string }, tenantId: string) {
        return getPrisma().eventos.create({
            data: { ...data, tenant_id: tenantId },
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

    /**
     * Atualiza um evento existente pelo ID.
     *
     * @param id - UUID do evento a atualizar.
     * @param data - Campos a atualizar (`data`, `fk_tipo_evento`, `descricao`).
     * @returns Evento atualizado com id, data, descrição e tipo de evento populado.
     */
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

    /** Remove um evento pelo ID. */
    async delete(id: string) {
        return getPrisma().eventos.delete({ where: { id } });
    }

    /** Busca um evento pelo ID retornando apenas campos básicos (para resposta de deleção). */
    async findByIdForDelete(id: string) {
        return getPrisma().eventos.findUnique({
            where: { id },
            select: { id: true, data: true, descricao: true }
        });
    }

    // --- Musicas (eventos_musicas) ---

    /** Retorna as músicas vinculadas a um evento com tonalidade, ordenadas pelo campo ordem. */
    async findMusicas(eventoId: string) {
        return getPrisma().eventos_Musicas.findMany({
            where: { evento_id: eventoId },
            select: {
                id: true,
                ordem: true,
                eventos_musicas_musicas_id_fkey: {
                    select: {
                        id: true,
                        nome: true,
                        musicas_fk_tonalidade_fkey: {
                            select: { id: true, tom: true }
                        }
                    }
                }
            },
            orderBy: { ordem: 'asc' }
        });
    }

    /**
     * Vincula uma música a um evento no tenant informado.
     * Atribui automaticamente a próxima posição disponível (MAX(ordem) + 1).
     *
     * @param eventoId - ID do evento
     * @param musicasId - ID da música a vincular
     * @param tenantId - ID do tenant ao qual o vínculo pertence
     * @param artistas_musicas_id - UUID da versão selecionada (opcional)
     * @returns Registro criado na tabela Eventos_Musicas
     */
    async createMusica(eventoId: string, musicasId: string, tenantId: string, artistas_musicas_id?: string | null) {
        return getPrisma().$transaction(async (tx) => {
            if (artistas_musicas_id != null) {
                const versao = await tx.artistas_Musicas.findUnique({
                    where: { id: artistas_musicas_id },
                    select: { id: true, musica_id: true }
                });
                if (!versao) throw new Error('VERSAO_NOT_FOUND');
                if (versao.musica_id !== musicasId) throw new Error('VERSAO_WRONG_MUSICA');
            }

            const maxRecord = await tx.eventos_Musicas.findFirst({
                where: { evento_id: eventoId },
                orderBy: { ordem: 'desc' },
                select: { ordem: true }
            });
            const nextOrdem = (maxRecord?.ordem ?? 0) + 1;

            return tx.eventos_Musicas.create({
                data: {
                    evento_id: eventoId,
                    musicas_id: musicasId,
                    tenant_id: tenantId,
                    ordem: nextOrdem,
                    ...(artistas_musicas_id != null ? { fk_artistas_musicas: artistas_musicas_id } : {}),
                }
            });
        });
    }

    /** Remove o vínculo entre evento e música pelo ID do registro. */
    /**
     * Remove o vínculo música-evento e reindexa a ordem das restantes (1..N)
     * numa única transação.
     *
     * Fazer os três passos (delete → reler → reordenar) soltos deixaria a
     * sequência de `ordem` com buracos ou posições duplicadas caso uma falha
     * ocorresse no meio, ou caso outra remoção/reordenação intercalasse.
     *
     * @param eventoMusicaId - ID do registro em `Eventos_Musicas` a remover
     * @param eventoId - ID do evento cujas músicas serão reindexadas
     */
    async deleteMusicaEReindexar(eventoMusicaId: string, eventoId: string) {
        const prismaClient = getPrisma();
        await prismaClient.$transaction(async (tx) => {
            await tx.eventos_Musicas.delete({ where: { id: eventoMusicaId } });

            const restantes = await tx.eventos_Musicas.findMany({
                where: { evento_id: eventoId },
                select: { id: true },
                orderBy: { ordem: 'asc' },
            });

            for (const [index, registro] of restantes.entries()) {
                await tx.eventos_Musicas.update({
                    where: { id: registro.id },
                    data: { ordem: index + 1 },
                });
            }
        });
    }

    /**
     * Valida e persiste atomicamente a versão selecionada de uma música no evento.
     *
     * Executa em transação: revalida que a `Artistas_Musicas` alvo ainda existe e pertence
     * à música certa, depois atualiza o FK. Protege contra TOCTOU entre uma validação prévia
     * e a gravação (ex.: versão deletada por outro request nesse intervalo).
     *
     * @param eventoMusicaId - ID do registro em `Eventos_Musicas`
     * @param musicaId - ID da música esperada (para validação de coerência)
     * @param artistas_musicas_id - UUID da versão desejada, ou `null` para limpar
     * @throws Error "VERSAO_NOT_FOUND" — versão inexistente no tenant ativo
     * @throws Error "VERSAO_WRONG_MUSICA" — versão existe mas pertence a outra música
     * @throws Error "EVENTO_MUSICA_NOT_FOUND" — vínculo música-evento removido durante a operação
     */
    async setMusicaVersaoAtomic(
        eventoMusicaId: string,
        musicaId: string,
        artistas_musicas_id: string | null,
    ) {
        return getPrisma().$transaction(async (tx) => {
            if (artistas_musicas_id !== null) {
                const versao = await tx.artistas_Musicas.findUnique({
                    where: { id: artistas_musicas_id },
                    select: { id: true, musica_id: true }
                });
                if (!versao) throw new Error('VERSAO_NOT_FOUND');
                if (versao.musica_id !== musicaId) throw new Error('VERSAO_WRONG_MUSICA');
            }

            /**
             * `updateMany` + checagem de `count` em vez de `update`: se a música
             * for desvinculada do evento por outra requisição entre a validação e
             * esta escrita, `update` lançaria P2025 cru — que `handleVersaoSentinel`
             * não traduz e viraria um 500. Com `updateMany`, a corrida vira um
             * sentinela tratado como 404.
             */
            const { count } = await tx.eventos_Musicas.updateMany({
                where: { id: eventoMusicaId },
                data: { fk_artistas_musicas: artistas_musicas_id }
            });

            if (count === 0) throw new Error('EVENTO_MUSICA_NOT_FOUND');
        });
    }

    /**
     * Reordena as músicas de um evento atribuindo posições sequenciais (1..N)
     * conforme a ordem dos IDs recebidos. Executa em transação para garantir atomicidade.
     *
     * @param eventoId - ID do evento
     * @param musicasIds - Array de IDs de músicas na nova ordem desejada
     */
    async reorderMusicas(eventoId: string, musicasIds: string[]) {
        const prismaClient = getPrisma();
        await prismaClient.$transaction(
            musicasIds.map((musicaId, index) =>
                prismaClient.eventos_Musicas.updateMany({
                    where: { evento_id: eventoId, musicas_id: musicaId },
                    data: { ordem: index + 1 }
                })
            )
        );
    }

    /** Verifica se já existe vínculo entre o evento e a música informados. */
    async findMusicaDuplicate(eventoId: string, musicasId: string) {
        return getPrisma().eventos_Musicas.findFirst({
            where: { evento_id: eventoId, musicas_id: musicasId }
        });
    }

    /**
     * Atualiza a versão selecionada de uma música no evento.
     *
     * @param id - ID do registro em Eventos_Musicas
     * @param artistas_musicas_id - UUID da versão ou `null` para limpar
     * @returns Registro atualizado
     */
    async setMusicaVersao(id: string, artistas_musicas_id: string | null) {
        return getPrisma().eventos_Musicas.update({
            where: { id },
            data: { fk_artistas_musicas: artistas_musicas_id }
        });
    }

    /** Busca uma música pelo ID (valida existência antes de vincular). */
    async findMusicaById(musicasId: string) {
        return getPrisma().musicas.findUnique({ where: { id: musicasId } });
    }

    /**
     * Busca uma versão (Artistas_Musicas) pelo ID, projetando apenas id e musica_id.
     * Usa getPrisma() para respeitar o filtro de tenant.
     *
     * @param id - UUID da versão
     * @returns Objeto com id e musica_id, ou `null` se não encontrada no tenant ativo
     */
    async findArtistaMusicaById(id: string) {
        return getPrisma().artistas_Musicas.findUnique({
            where: { id },
            select: { id: true, musica_id: true }
        });
    }

    /**
     * Projeta uma única música no formato de detalhe de evento — inclui `versao_selecionada`
     * do FK atual + todas as `versoes_disponiveis` da música, sem recarregar o evento inteiro.
     * Usado por `addMusica`/`setMusicaVersao` para responder com apenas a música afetada.
     *
     * @param eventoId - ID do evento
     * @param musicasId - ID da música
     * @returns Registro projetado em formato cru (pronto para achatamento no service) ou `null`
     */
    async findEventoMusicaDetail(eventoId: string, musicasId: string) {
        return getPrisma().eventos_Musicas.findFirst({
            where: { evento_id: eventoId, musicas_id: musicasId },
            select: {
                id: true,
                ordem: true,
                eventos_musicas_musicas_id_fkey: {
                    select: {
                        id: true,
                        nome: true,
                        musicas_fk_tonalidade_fkey: {
                            select: { id: true, tom: true }
                        },
                        Artistas_Musicas: {
                            select: {
                                id: true,
                                link_versao: true,
                                cifraclub_url: true,
                                artistas_musicas_artista_id_fkey: {
                                    select: { id: true, nome: true }
                                }
                            },
                            orderBy: { created_at: 'asc' as const }
                        }
                    }
                },
                eventos_musicas_artistas_musicas_fkey: {
                    select: {
                        id: true,
                        link_versao: true,
                        cifraclub_url: true,
                        artistas_musicas_artista_id_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
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
     * @param tenantId - ID do tenant ao qual os registros pertencem
     * @returns Registro criado na tabela Eventos_Users
     */
    async createIntegrante(eventoId: string, userId: string, funcaoIds: string[], tenantId: string) {
        return getPrisma().$transaction(async (tx) => {
            const eventoUser = await tx.eventos_Users.create({
                data: { evento_id: eventoId, fk_user_id: userId, tenant_id: tenantId }
            });

            if (funcaoIds.length > 0) {
                await Promise.all(
                    funcaoIds.map(funcaoId =>
                        tx.eventos_Users_Funcoes.create({
                            data: {
                                evento_user_id: eventoUser.id,
                                funcao_id: funcaoId,
                                tenant_id: tenantId,
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
     * Busca um user pelo ID **restrito aos membros do tenant informado**
     * (valida existência antes de vincular a evento).
     *
     * Usa o client base porque `users` é um modelo global (compartilhado entre
     * igrejas), mas o filtro `tenant_users` é obrigatório: sem ele, um usuário
     * com `escalas.write` na igreja A conseguiria vincular à escala um usuário
     * que pertence apenas à igreja B, vazando o nome dele para a igreja A.
     * Mesmo guarda aplicada em `integrantes.repository.findAll`.
     *
     * @param userId - ID do user
     * @param tenantId - UUID do tenant ativo (escopo obrigatório)
     * @returns User encontrado no tenant ou `null` se não existir/não for membro
     */
    async findIntegranteById(userId: string, tenantId: string) {
        return prisma.users.findFirst({
            where: {
                id: userId,
                tenant_users: { some: { tenant_id: tenantId } },
            },
        });
    }
}

export default new EventosRepository();
