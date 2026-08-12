import { Prisma } from '@prisma/client';
import prisma, { getPrisma } from '../../prisma/cliente.js';
import { EVENTO_INDEX_SELECT, EVENTO_SHOW_SELECT } from '../types/index.js';
import type { EventoStatus } from '../types/index.js';

/**
 * Select compartilhado das respostas de escrita de evento (create/update/duplicar):
 * campos próprios + tipo de evento populado.
 */
const EVENTO_WRITE_SELECT = {
    id: true,
    data: true,
    descricao: true,
    status: true,
    eventos_fk_tipo_evento_fkey: {
        select: { id: true, nome: true }
    }
} as const;

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
     * @param data - Dados do evento (data, tipo, descrição e status opcional — `undefined` deixa o DEFAULT `publicada` do banco agir)
     * @param tenantId - ID do tenant ao qual o evento pertence
     * @returns Evento criado com tipo de evento populado e status
     */
    async create(data: { data: Date; fk_tipo_evento: string; descricao: string; status?: EventoStatus }, tenantId: string) {
        return getPrisma().eventos.create({
            data: { ...data, tenant_id: tenantId },
            select: EVENTO_WRITE_SELECT
        });
    }

    /**
     * Atualiza um evento existente pelo ID.
     *
     * @param id - UUID do evento a atualizar.
     * @param data - Campos a atualizar (`data`, `fk_tipo_evento`, `descricao`, `status`).
     * @returns Evento atualizado com id, data, descrição, status e tipo de evento populado.
     */
    async update(id: string, data: Prisma.EventosUncheckedUpdateInput) {
        return getPrisma().eventos.update({
            where: { id },
            data,
            select: EVENTO_WRITE_SELECT
        });
    }

    /**
     * Duplica uma escala numa única transação: cria o novo evento e copia o
     * repertório (`Eventos_Musicas` com ordem, versão selecionada e tom próprio)
     * e os integrantes com as funções escolhidas **para o evento de origem**
     * (`Eventos_Users_Funcoes` copiadas direto, sem revalidar contra as funções
     * globais atuais do integrante — regra que só existe para a escolha manual).
     *
     * A transação garante atomicidade (falha no meio não deixa cópia parcial) e
     * o `tx` derivado de `getPrisma()` preserva o `$extends` de tenant — os
     * `findMany` da origem já chegam filtrados por `tenant_id`.
     *
     * Roda em `RepeatableRead`: sob Read Committed (padrão) cada statement lê um
     * snapshot próprio, então uma edição concorrente da origem entre o `findMany`
     * de músicas e o de integrantes produziria uma cópia "rasgada" — um estado
     * que a origem nunca teve. Com snapshot único, as duas leituras são coerentes.
     * O risco de retry por erro de serialização é baixo: a transação só lê a
     * origem e escreve linhas novas.
     *
     * Integrantes usam `create` por vínculo + `createMany` das funções (mesmo
     * padrão de `createIntegrante`); não usar `createManyAndReturn`, pois a
     * correspondência posicional do retorno não é contrato do Prisma.
     *
     * @param origemId - UUID do evento a copiar
     * @param dados - Dados do novo evento (data, tipo, descrição) já resolvidos pelo service
     * @param tenantId - ID do tenant ao qual os registros pertencem
     * @returns Evento criado com tipo de evento populado e status
     * @throws Error "ORIGEM_NOT_FOUND" — origem excluída entre a validação do service e a transação
     */
    async duplicarEvento(
        origemId: string,
        dados: { data: Date; fk_tipo_evento: string; descricao: string },
        tenantId: string,
    ) {
        return getPrisma().$transaction(async (tx) => {
            /**
             * Revalida a origem **dentro** da transação. A checagem do service
             * acontece antes dela abrir: se o evento for excluído nesse intervalo,
             * a cascata leva junto `Eventos_Musicas`/`Eventos_Users` e as duas
             * leituras abaixo voltariam vazias — nada na cópia aponta de volta
             * para `origemId`, então o Postgres não recusaria nada e o usuário
             * receberia 201 com uma escala vazia em vez de 404.
             */
            const origem = await tx.eventos.findUnique({
                where: { id: origemId },
                select: { id: true },
            });
            if (!origem) throw new Error('ORIGEM_NOT_FOUND');

            const musicas = await tx.eventos_Musicas.findMany({
                where: { evento_id: origemId },
                select: { musicas_id: true, ordem: true, fk_artistas_musicas: true, fk_tonalidade: true },
            });

            const integrantes = await tx.eventos_Users.findMany({
                where: { evento_id: origemId },
                select: {
                    fk_user_id: true,
                    Eventos_Users_Funcoes: { select: { funcao_id: true } },
                },
            });

            const novo = await tx.eventos.create({
                data: { ...dados, tenant_id: tenantId },
                select: EVENTO_WRITE_SELECT,
            });

            if (musicas.length > 0) {
                await tx.eventos_Musicas.createMany({
                    data: musicas.map(m => ({
                        evento_id: novo.id,
                        musicas_id: m.musicas_id,
                        ordem: m.ordem,
                        fk_artistas_musicas: m.fk_artistas_musicas,
                        fk_tonalidade: m.fk_tonalidade,
                        tenant_id: tenantId,
                    })),
                });
            }

            /**
             * Laço sequencial de propósito — `Promise.all` aqui NÃO paralelizaria
             * nada: uma transação interativa do Prisma roda todas as queries na
             * mesma conexão, então as inserções sairiam enfileiradas do mesmo
             * jeito, trocando a falha imediata do integrante problemático por uma
             * rejeição em lote (e, sob carga, pelo risco de `P2028 Transaction
             * already closed`). O par create + createMany é sequencial por
             * dependência: o `createMany` das funções precisa do `id` gerado pelo
             * `create` (ver a nota sobre `createManyAndReturn` acima).
             */
            for (const integrante of integrantes) {
                const eventoUser = await tx.eventos_Users.create({
                    data: { evento_id: novo.id, fk_user_id: integrante.fk_user_id, tenant_id: tenantId },
                });

                if (integrante.Eventos_Users_Funcoes.length > 0) {
                    await tx.eventos_Users_Funcoes.createMany({
                        data: integrante.Eventos_Users_Funcoes.map(f => ({
                            evento_user_id: eventoUser.id,
                            funcao_id: f.funcao_id,
                            tenant_id: tenantId,
                        })),
                    });
                }
            }

            return novo;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
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

    /**
     * Retorna as músicas vinculadas a um evento ordenadas pelo campo ordem,
     * projetando o tom global da música e o tom próprio da escala (override).
     */
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
                },
                eventos_musicas_fk_tonalidade_fkey: {
                    select: { id: true, tom: true }
                }
            },
            orderBy: { ordem: 'asc' }
        });
    }

    /**
     * Vincula uma música a um evento no tenant informado.
     * Atribui automaticamente a próxima posição disponível (MAX(ordem) + 1).
     *
     * O `MAX(ordem) + 1` é um read-modify-write: sob READ COMMITTED (padrão do
     * Prisma no Postgres) duas requisições concorrentes no mesmo evento leriam o
     * mesmo máximo e gravariam a mesma `ordem` — o índice `[evento_id, ordem]` não
     * é unique e portanto não barra a duplicata. Por isso a transação começa
     * travando a linha do evento com `SELECT ... FOR UPDATE`: a segunda requisição
     * fica bloqueada até a primeira concluir e só então lê o máximo já atualizado.
     *
     * @param eventoId - ID do evento
     * @param musicasId - ID da música a vincular
     * @param tenantId - ID do tenant ao qual o vínculo pertence
     * @param artistas_musicas_id - UUID da versão selecionada (opcional)
     * @returns Registro criado na tabela Eventos_Musicas
     */
    async createMusica(eventoId: string, musicasId: string, tenantId: string, artistas_musicas_id?: string | null) {
        return getPrisma().$transaction(async (tx) => {
            /** Serializa as inserções concorrentes deste evento (ver JSDoc). */
            await tx.$queryRaw`SELECT id FROM eventos WHERE id = ${eventoId}::uuid FOR UPDATE`;

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

            /**
             * Atualizações disparadas em paralelo (mesmo padrão de `createIntegrante`):
             * são linhas distintas dentro da mesma transação, então não há ordem a
             * respeitar entre elas e o sequencial custaria um round trip por música.
             */
            await Promise.all(
                restantes.map((registro, index) =>
                    tx.eventos_Musicas.update({
                        where: { id: registro.id },
                        data: { ordem: index + 1 },
                    }),
                ),
            );
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
     * Valida e persiste atomicamente o tom próprio de uma música no evento.
     *
     * Executa em transação: revalida que a `Tonalidades` alvo ainda existe no tenant
     * ativo, depois grava o FK. Protege contra TOCTOU entre uma validação prévia e a
     * gravação (ex.: tonalidade deletada por outro request nesse intervalo). Não há
     * checagem "pertence à música": tonalidade é um catálogo global do tenant.
     *
     * @param eventoMusicaId - ID do registro em `Eventos_Musicas`
     * @param fk_tonalidade - UUID da tonalidade desejada, ou `null` para voltar ao tom global
     * @throws Error "TONALIDADE_NOT_FOUND" — tonalidade inexistente no tenant ativo
     * @throws Error "EVENTO_MUSICA_NOT_FOUND" — vínculo música-evento removido durante a operação
     */
    async setMusicaTonalidadeAtomic(eventoMusicaId: string, fk_tonalidade: string | null) {
        return getPrisma().$transaction(async (tx) => {
            if (fk_tonalidade !== null) {
                const tonalidade = await tx.tonalidades.findUnique({
                    where: { id: fk_tonalidade },
                    select: { id: true }
                });
                if (!tonalidade) throw new Error('TONALIDADE_NOT_FOUND');
            }

            /**
             * `updateMany` + checagem de `count` em vez de `update`: se a música
             * for desvinculada do evento por outra requisição entre a validação e
             * esta escrita, `update` lançaria P2025 cru — que viraria um 500. Com
             * `updateMany`, a corrida vira um sentinela tratado como 404.
             */
            const { count } = await tx.eventos_Musicas.updateMany({
                where: { id: eventoMusicaId },
                data: { fk_tonalidade }
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
     * Busca um tipo de evento pelo ID **no tenant ativo** (valida existência
     * antes de gravá-lo como FK do evento).
     *
     * A FK `eventos_fk_tipo_evento_fkey` é validada pelo Postgres apenas por
     * existência do `id` — ela não conhece `tenant_id`. Sem esta checagem, um
     * usuário com `escalas.write` na igreja A que conheça o UUID de um
     * `Tipos_Eventos` da igreja B conseguiria referenciá-lo em
     * `create`/`update`/`duplicar`, e a resposta devolveria o nome do tipo da
     * igreja B. `getPrisma()` injeta o filtro de tenant, então um id de outro
     * tenant volta como `null`. Mesma guarda de `findIntegranteById`.
     *
     * @param id - UUID do tipo de evento
     * @returns Tipo de evento encontrado no tenant ativo ou `null`
     */
    async findTipoEventoById(id: string) {
        return getPrisma().tipos_Eventos.findUnique({
            where: { id },
            select: { id: true },
        });
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
                },
                eventos_musicas_fk_tonalidade_fkey: {
                    select: { id: true, tom: true }
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
