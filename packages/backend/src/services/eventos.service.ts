import type { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import eventosRepository from '../repositories/eventos.repository.js';
import { applyKeyFragment, computeKeyFragment } from '../lib/cifraclub-key-mapping.js';
import type {
    EventoIndexRaw,
    EventoShowRaw,
    EventoMusicaDetailRaw,
    EventoStatus,
    IdTom,
    MusicaEvento,
    VersaoMusicaShowRaw,
    VersaoMusicaEvento,
    CifraclubPlaylistItem,
    CifraclubPlaylistResponse,
} from '../types/index.js';

/** Mensagem e status HTTP em que um erro conhecido de escrita é traduzido. */
interface TraducaoDeErro {
    /** Texto devolvido ao cliente no corpo do `AppError`. */
    mensagem: string;
    /** Código HTTP correspondente. */
    status: number;
}

/**
 * Tabela de tradução de um caminho de escrita: sentinelas do repositório e
 * substrings de constraint reconhecidas no `P2003`.
 */
interface MapaDeTraducao {
    /** Mensagens sentinela lançadas pelo repositório (`throw new Error('X')`) dentro da transação. */
    sentinelas?: Record<string, TraducaoDeErro>;
    /** Substrings de nome de constraint, avaliadas na ordem declarada. */
    fks?: Array<{ contem: string; mensagem: string }>;
}

/**
 * Traduz os erros de uma escrita sujeita a corrida em `AppError`.
 *
 * Regra do projeto: erro do Prisma nunca escapa cru — o handler genérico de
 * `app.ts` ecoa `err.message` fora de produção, então um `P2002`/`P2003` não
 * tratado vira 500 com detalhe interno. As três transações de eventos
 * (duplicação, versão/tom de música e vínculo de integrante) repetiam a mesma
 * estrutura variando só a tabela de mensagens; aqui a estrutura mora num lugar
 * só e cada chamador declara apenas o que é seu (DRY).
 *
 * O `P2003` é distinguido por `meta.constraint` (formato do Prisma 6 no
 * Postgres); `meta.field_name` fica como fallback defensivo para variações de
 * versão. Constraint não mapeada cai no 404 genérico para não vazar detalhe
 * interno.
 *
 * @param error - Erro capturado da transação
 * @param mapa - Sentinelas e constraints reconhecidas por este caminho de escrita
 * @throws {AppError} Erro traduzido, quando reconhecido
 * @throws {unknown} O erro original, quando não reconhecido
 */
function traduzirErroDeEscrita(error: unknown, mapa: MapaDeTraducao): never {
    if (error instanceof Error) {
        const sentinela = mapa.sentinelas?.[error.message];
        if (sentinela) throw new AppError(sentinela.mensagem, sentinela.status);
    }

    const prismaError = error as { code?: string; meta?: { constraint?: string; field_name?: string } };

    if (error instanceof Error && 'code' in error) {
        /** P2002 — colisão de unique numa corrida com outra escrita concorrente. */
        if (prismaError.code === 'P2002') {
            throw new AppError('Registro duplicado', 409);
        }

        /** P2003 — FK inválida: distingue qual referência falhou pela constraint. */
        if (prismaError.code === 'P2003') {
            const field = String(prismaError.meta?.constraint ?? prismaError.meta?.field_name ?? '');
            const conhecida = mapa.fks?.find(fk => field.includes(fk.contem));
            throw new AppError(conhecida?.mensagem ?? 'Recurso referenciado não encontrado', 404);
        }
    }

    throw error;
}

/**
 * Valida e converte a data de um evento (string ISO 8601) em `Date`.
 *
 * Regra única compartilhada por `create`, `update` e `duplicar` — o formato
 * deve ser parseável e o ano deve estar na faixa 1900–9999 (limite do
 * `timestamptz` exposto pela API).
 *
 * @param data - Data em formato ISO 8601 (ex: `2026-02-14T10:00:00Z`)
 * @returns `Date` validado
 * @throws {AppError} 400 — formato inválido ou ano fora da faixa 1900–9999
 */
function parseDataEvento(data: string): Date {
    const timestamp = Date.parse(String(data));

    if (isNaN(timestamp)) {
        throw new AppError("Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)", 400);
    }

    const parsedYear = new Date(timestamp).getFullYear();
    if (parsedYear < 1900 || parsedYear > 9999) {
        throw new AppError("Ano da data do evento deve estar entre 1900 e 9999", 400);
    }

    return new Date(timestamp);
}

/**
 * Achata uma versão crua (`Artistas_Musicas` projetada) no formato consumido pela API.
 *
 * Recebe apenas versões existentes — usada nos itens de `versoes_disponiveis`,
 * que nunca contêm `null`. Manter esta variante evita o `!` no `.map`, que
 * silenciaria um `null` real caso a projeção mudasse.
 *
 * @param raw - Versão bruta vinda do Prisma
 * @returns Objeto plano `{ id, artista_nome, link_versao, cifraclub_url }`
 */
function flattenVersaoObrigatoria(raw: VersaoMusicaShowRaw): VersaoMusicaEvento {
    return {
        id: raw.id,
        artista_nome: raw.artistas_musicas_artista_id_fkey?.nome ?? null,
        link_versao: raw.link_versao,
        cifraclub_url: raw.cifraclub_url,
    };
}

/**
 * Variante que aceita ausência de versão — usada em `versao_selecionada`,
 * que é `null` quando nenhuma versão foi escolhida para a música no evento.
 *
 * @param raw - Versão bruta vinda do Prisma ou `null`
 * @returns Objeto plano da versão, ou `null`
 */
function flattenVersao(raw: VersaoMusicaShowRaw | null): VersaoMusicaEvento | null {
    return raw ? flattenVersaoObrigatoria(raw) : null;
}

/**
 * Resolve o par de tonalidades de uma música escalada.
 *
 * `tonalidade` carrega o tom **efetivo** (override da escala ?? tom global da
 * música) e `tonalidade_musica` preserva o tom global como referência. Resolver
 * aqui mantém corretos todos os consumidores que leem `tonalidade.tom`
 * (mensagem de WhatsApp, transposição CifraClub, badge do detalhe) sem tocá-los.
 *
 * @param override - Tom próprio da escala (`eventos_musicas.fk_tonalidade`) ou `null`
 * @param global - Tom global da música (`musicas.fk_tonalidade`) ou `null`
 * @returns Objeto com `tonalidade` (efetiva) e `tonalidade_musica` (global)
 */
function flattenTonalidades(
    override: IdTom | null,
    global: IdTom | null,
): { tonalidade: IdTom | null; tonalidade_musica: IdTom | null } {
    return {
        tonalidade: override ?? global,
        tonalidade_musica: global,
    };
}

/**
 * Achata um registro `Eventos_Musicas` projetado em `findEventoMusicaDetail` no formato MusicaEvento.
 *
 * @param raw - Registro cru com a música, tonalidade e versões aninhadas
 * @returns MusicaEvento pronta para resposta da API
 */
function flattenEventoMusicaDetail(raw: EventoMusicaDetailRaw): MusicaEvento {
    const musica = raw.eventos_musicas_musicas_id_fkey;
    return {
        id: musica.id,
        nome: musica.nome,
        ...flattenTonalidades(raw.eventos_musicas_fk_tonalidade_fkey, musica.musicas_fk_tonalidade_fkey),
        ordem: raw.ordem,
        versao_selecionada: flattenVersao(raw.eventos_musicas_artistas_musicas_fkey),
        versoes_disponiveis: musica.Artistas_Musicas.map(flattenVersaoObrigatoria),
    };
}

/**
 * Converte um registro bruto de evento no formato simplificado para listagem (index).
 *
 * @param e - Registro bruto do evento (EventoIndexRaw), incluindo as relações `Eventos_Musicas` e `Eventos_Integrantes`
 * @returns Objeto com `id`, `data`, `descricao`, `tipoEvento`, `musicas` (array de objetos com id e nome) e `integrantes` (array de objetos com id e nome)
 */
function formatEventoIndex(e: EventoIndexRaw) {
    return {
        id: e.id,
        data: e.data,
        descricao: e.descricao,
        status: e.status,
        tipoEvento: e.eventos_fk_tipo_evento_fkey,
        musicas: e.Eventos_Musicas.map(m => m.eventos_musicas_musicas_id_fkey),
        integrantes: e.Eventos_Users.map(i => {
            const user = i.eventos_users_fk_user_id_fkey;
            return { id: user.id, nome: user.name };
        })
    };
}

/**
 * Converte um registro bruto de evento no formato detalhado para exibição (show).
 *
 * Funções do integrante vêm da tabela `Eventos_Users_Funcoes` (seleção por evento),
 * não mais de `Users_Funcoes` (funções globais).
 *
 * @param e - Registro bruto do evento (EventoShowRaw)
 * @returns Objeto formatado com músicas e integrantes com funções do evento
 */
function formatEventoShow(e: EventoShowRaw) {
    return {
        id: e.id,
        data: e.data,
        descricao: e.descricao,
        status: e.status,
        tipoEvento: e.eventos_fk_tipo_evento_fkey,
        musicas: e.Eventos_Musicas.map(m => {
            const musica = m.eventos_musicas_musicas_id_fkey;
            return {
                id: musica.id,
                nome: musica.nome,
                ...flattenTonalidades(m.eventos_musicas_fk_tonalidade_fkey, musica.musicas_fk_tonalidade_fkey),
                ordem: m.ordem,
                versao_selecionada: flattenVersao(m.eventos_musicas_artistas_musicas_fkey),
                versoes_disponiveis: musica.Artistas_Musicas.map(flattenVersaoObrigatoria),
            };
        }),
        integrantes: e.Eventos_Users.map(i => {
            const user = i.eventos_users_fk_user_id_fkey;
            return {
                id: user.id,
                nome: user.name,
                funcoes: i.Eventos_Users_Funcoes.map(f => f.eventos_users_funcoes_funcao_fkey)
            };
        })
    };
}

class EventosService {
    // --- Base CRUD ---

    /** Lista todos os eventos formatados para exibição em listagem. */
    async listAll() {
        const eventos = await eventosRepository.findAll();
        return eventos.map(formatEventoIndex);
    }

    /** Retorna um evento detalhado pelo ID, incluindo músicas e integrantes com funções. */
    async getById(id: string) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findById(id);
        if (!evento) throw new AppError("O evento não foi encontrado ou não existe", 404);

        return formatEventoShow(evento);
    }

    /**
     * Cria um novo evento vinculado ao tenant informado.
     *
     * @param body - Dados do evento (data, fk_tipo_evento, descricao e status opcional — omitido, o banco aplica o DEFAULT `publicada`)
     * @param tenantId - ID do tenant ao qual o evento pertence
     * @returns Evento criado com tipo de evento populado e status
     */
    async create(body: { data?: string; fk_tipo_evento?: string; descricao?: string; status?: EventoStatus }, tenantId: string) {
        const { data, fk_tipo_evento, descricao, status } = body;
        const errors: string[] = [];

        if (!data) errors.push("Data do evento é obrigatória");
        if (!fk_tipo_evento) errors.push("Tipo de evento é obrigatório");
        if (errors.length > 0) throw new AppError(errors[0], 400, errors);

        const parsedDate = parseDataEvento(data!);
        await this.assertTipoEventoDoTenant(fk_tipo_evento!);

        const evento = await eventosRepository.create({
            data: parsedDate,
            fk_tipo_evento: fk_tipo_evento!,
            descricao: descricao ?? "",
            status,
        }, tenantId);

        return {
            id: evento.id,
            data: evento.data,
            descricao: evento.descricao,
            status: evento.status,
            tipoEvento: evento.eventos_fk_tipo_evento_fkey
        };
    }

    /**
     * Atualiza um evento existente pelo ID com os campos informados.
     *
     * Publicar uma escala rascunho é este mesmo endpoint com `{ status: 'publicada' }`
     * — não há endpoint dedicado de publicação (decisão D5).
     *
     * @param id - UUID do evento a atualizar
     * @param body - Campos a atualizar (`data`, `fk_tipo_evento`, `descricao`, `status`); ausência mantém o valor atual.
     * @returns Evento atualizado com tipo de evento populado e status
     * @throws {AppError} 400 se o ID/data forem inválidos ou nenhum campo for enviado
     * @throws {AppError} 404 se o evento não existir
     */
    async update(id: string, body: { data?: string; fk_tipo_evento?: string; descricao?: string; status?: EventoStatus }) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const existente = await eventosRepository.findByIdSimple(id);
        if (!existente) throw new AppError("O evento não foi encontrado ou não existe", 404);

        const { data, fk_tipo_evento, descricao, status } = body;

        const updateData: Prisma.EventosUncheckedUpdateInput = {};
        if (data !== undefined) updateData.data = parseDataEvento(data);
        if (fk_tipo_evento !== undefined) {
            await this.assertTipoEventoDoTenant(fk_tipo_evento);
            updateData.fk_tipo_evento = fk_tipo_evento;
        }
        if (descricao !== undefined) updateData.descricao = descricao;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length === 0) {
            throw new AppError("Ao menos um campo deve ser enviado para atualização", 400);
        }

        const evento = await eventosRepository.update(id, updateData);

        return {
            id: evento.id,
            data: evento.data,
            descricao: evento.descricao,
            status: evento.status,
            tipoEvento: evento.eventos_fk_tipo_evento_fkey
        };
    }

    /**
     * Garante que o tipo de evento informado existe **no tenant ativo**.
     *
     * A FK do banco só valida existência do `id`, sem conhecer `tenant_id`: sem
     * esta checagem, um id de `Tipos_Eventos` de outra igreja seria aceito por
     * `create`/`update`/`duplicar` e o nome dele voltaria na resposta. Mesma
     * revalidação que `setMusicaTonalidadeAtomic` já faz para `fk_tonalidade`.
     *
     * @param fkTipoEvento - UUID do tipo de evento informado no body
     * @throws {AppError} 404 — tipo de evento inexistente no tenant ativo
     */
    private async assertTipoEventoDoTenant(fkTipoEvento: string) {
        const tipo = await eventosRepository.findTipoEventoById(fkTipoEvento);
        if (!tipo) throw new AppError("Tipo de evento não encontrado", 404);
    }

    /** Remove um evento existente pelo ID. */
    async delete(id: string) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findByIdForDelete(id);
        if (!evento) throw new AppError("O evento não foi encontrado ou não existe", 404);

        await eventosRepository.delete(id);
        return evento;
    }

    /**
     * Duplica uma escala existente para uma nova data.
     *
     * A cópia é server-side (endpoint dedicado, não composição no cliente) por
     * três razões: atomicidade (a transação do repositório evita cópia parcial),
     * fidelidade das funções (copia `Eventos_Users_Funcoes` do evento de origem
     * direto, sem a revalidação contra funções globais que `addIntegrante` faz
     * — um integrante que trocou de função desde a escala original não vira 400)
     * e custo (sem N round-trips serializados no `MAX(ordem)+1` de `createMusica`).
     *
     * `fk_tipo_evento` e `descricao` omitidos herdam os valores da origem; o
     * `status` do novo evento fica com o DEFAULT `publicada` do banco.
     *
     * @param origemId - UUID do evento a duplicar
     * @param body - `data` obrigatória (ISO 8601) e sobrescritas opcionais de `fk_tipo_evento`/`descricao`
     * @param tenantId - ID do tenant ao qual a cópia pertence
     * @returns Evento criado com tipo de evento populado e status
     * @throws {AppError} 400 — data ausente/inválida ou ano fora de 1900–9999
     * @throws {AppError} 404 — evento de origem inexistente no tenant (inclusive se for excluído durante a cópia), ou tipo de evento sobrescrito inexistente no tenant
     */
    async duplicar(origemId: string, body: { data?: string; fk_tipo_evento?: string; descricao?: string }, tenantId: string) {
        if (!body.data) throw new AppError("Data do evento é obrigatória", 400);
        const parsedDate = parseDataEvento(body.data);

        const origem = await eventosRepository.findByIdSimple(origemId);
        if (!origem) throw new AppError("Evento não encontrado", 404);

        if (body.fk_tipo_evento !== undefined) {
            await this.assertTipoEventoDoTenant(body.fk_tipo_evento);
        }

        /**
         * O catch traduz erros Prisma da transação de cópia (ex.: `fk_tipo_evento`
         * sobrescrito inexistente, ou origem alterada por outra requisição entre a
         * leitura e a gravação) — sem ele escapariam como 500 cru.
         */
        try {
            const evento = await eventosRepository.duplicarEvento(origemId, {
                data: parsedDate,
                fk_tipo_evento: body.fk_tipo_evento ?? origem.fk_tipo_evento,
                descricao: body.descricao ?? origem.descricao,
            }, tenantId);

            return {
                id: evento.id,
                data: evento.data,
                descricao: evento.descricao,
                status: evento.status,
                tipoEvento: evento.eventos_fk_tipo_evento_fkey
            };
        } catch (error) {
            this.handleDuplicarSentinel(error);
        }
    }

    /**
     * Converte erros Prisma conhecidos da transação de duplicação em `AppError`.
     *
     * O P2003 distingue qual referência falhou pelos nomes reais das constraints
     * no banco (verificados via `pg_constraint`): `eventos_fk_tipo_evento_fkey`,
     * `eventos_musicas_fk_artistas_musicas_fkey`, `eventos_musicas_fk_tonalidade_fkey`,
     * `eventos_musicas_musicas_id_fkey`, `eventos_users_fk_user_id_fkey` e
     * `eventos_users_funcoes_funcao_id_fkey`. Constraints não mapeadas (ex.:
     * `tenant_id`) caem no 404 genérico para não vazar detalhe interno.
     *
     * @param error - Erro capturado de `duplicarEvento`
     * @throws {AppError} Sempre — re-lança convertido ou propaga o desconhecido
     */
    private handleDuplicarSentinel(error: unknown): never {
        traduzirErroDeEscrita(error, {
            sentinelas: {
                ORIGEM_NOT_FOUND: { mensagem: 'Evento não encontrado', status: 404 },
            },
            fks: [
                { contem: 'fk_tipo_evento', mensagem: 'Tipo de evento não encontrado' },
                { contem: 'fk_artistas_musicas', mensagem: 'Versão não encontrada' },
                { contem: 'fk_tonalidade', mensagem: 'Tonalidade não encontrada' },
                { contem: 'musicas_id', mensagem: 'Música não encontrada' },
                { contem: 'fk_user_id', mensagem: 'Integrante não encontrado' },
                { contem: 'funcao_id', mensagem: 'Função não encontrada' },
            ],
        });
    }

    // --- CifraClub Playlist ---

    /**
     * Monta a playlist CifraClub de um evento com URLs enriquecidas com #key=N.
     * Resolve a versão de cada música (selecionada → fallback primeira com cifraclub_url → null).
     * Aplica transposição automática para URLs do CifraClub.
     *
     * @param eventoId - UUID do evento
     * @returns Playlist ordenada com stats e URL de lista do evento
     * @throws {AppError} 404 se o evento não existir
     */
    async getCifraclubPlaylist(eventoId: string): Promise<CifraclubPlaylistResponse> {
        if (!eventoId) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findById(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const playlist: CifraclubPlaylistItem[] = evento.Eventos_Musicas.map(em => {
            const musica = em.eventos_musicas_musicas_id_fkey;
            /** Tom efetivo da escala (override do evento ?? tom global da música). */
            const { tonalidade } = flattenTonalidades(
                em.eventos_musicas_fk_tonalidade_fkey,
                musica.musicas_fk_tonalidade_fkey,
            );
            const tom = tonalidade?.tom ?? null;

            let cifraclubUrl: string | null = null;
            let artistaNome = '';

            const versaoSelecionada = em.eventos_musicas_artistas_musicas_fkey;
            if (versaoSelecionada?.cifraclub_url) {
                cifraclubUrl = versaoSelecionada.cifraclub_url;
                artistaNome = versaoSelecionada.artistas_musicas_artista_id_fkey?.nome ?? '';
            } else {
                const fallback = musica.Artistas_Musicas.find(v => v.cifraclub_url);
                if (fallback) {
                    cifraclubUrl = fallback.cifraclub_url;
                    artistaNome = fallback.artistas_musicas_artista_id_fkey?.nome ?? '';
                } else if (versaoSelecionada) {
                    artistaNome = versaoSelecionada.artistas_musicas_artista_id_fkey?.nome ?? '';
                } else if (musica.Artistas_Musicas.length > 0) {
                    artistaNome = musica.Artistas_Musicas[0].artistas_musicas_artista_id_fkey?.nome ?? '';
                }
            }

            // O tom final independe de haver URL; calcula uma única vez.
            const keyResult = computeKeyFragment(tom);
            const tomFinal: string | null = keyResult ? keyResult.tomFinal : null;

            let tomAjustado = false;
            let urlFinal = cifraclubUrl;

            if (cifraclubUrl) {
                const applied = applyKeyFragment(cifraclubUrl, tom);
                urlFinal = applied.url;
                tomAjustado = applied.tomAjustado;
            }

            return {
                ordem: em.ordem,
                musica_id: musica.id,
                nome: musica.nome,
                tom,
                tom_final: tomFinal,
                tom_ajustado: tomAjustado,
                artista_nome: artistaNome,
                cifraclub_url: urlFinal,
            };
        });

        const comLink = playlist.filter(p => p.cifraclub_url !== null).length;

        return {
            evento: {
                id: evento.id,
                data: evento.data.toISOString(),
                descricao: evento.descricao,
                tipo_evento: evento.eventos_fk_tipo_evento_fkey?.nome ?? '',
            },
            playlist,
            stats: {
                total: playlist.length,
                com_link: comLink,
                sem_link: playlist.length - comLink,
            },
        };
    }

    // --- Musicas ---

    /**
     * Lista as músicas vinculadas a um evento com tom efetivo e posição, ordenadas por ordem.
     * `tonalidade` carrega o tom efetivo da escala e `tonalidade_musica` o tom global.
     */
    async listMusicas(eventoId: string) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musicas = await eventosRepository.findMusicas(eventoId);
        return musicas.map(m => {
            const musica = m.eventos_musicas_musicas_id_fkey;
            return {
                id: musica.id,
                nome: musica.nome,
                ...flattenTonalidades(m.eventos_musicas_fk_tonalidade_fkey, musica.musicas_fk_tonalidade_fkey),
                ordem: m.ordem
            };
        });
    }

    /**
     * Converte erros sentinela lançados pelo repositório (dentro das transações atômicas)
     * e erros Prisma de constraint violation para `AppError` com o statusCode correto.
     *
     * Trata erros sentinela (`VERSAO_NOT_FOUND`, `VERSAO_WRONG_MUSICA`,
     * `TONALIDADE_NOT_FOUND`), erros de FK (`P2003`) distinguindo qual FK falhou via
     * `error.meta.constraint` (formato real do Prisma 6 no Postgres, ex.:
     * `"eventos_musicas_fk_tonalidade_fkey"`; `error.meta.field_name` é mantido
     * apenas como fallback defensivo para variações de versão do Prisma), e erros
     * de unique constraint (`P2002`) para corridas de duplicação concorrente.
     *
     * @param error - Erro capturado de uma operação atômica
     * @throws {AppError} Sempre — re-lança o erro convertido ou propaga desconhecidos
     */
    private handleVersaoSentinel(error: unknown): never {
        traduzirErroDeEscrita(error, {
            sentinelas: {
                VERSAO_NOT_FOUND: { mensagem: 'Versão não encontrada', status: 404 },
                VERSAO_WRONG_MUSICA: { mensagem: 'A versão informada não pertence a esta música', status: 400 },
                TONALIDADE_NOT_FOUND: { mensagem: 'Tonalidade não encontrada', status: 404 },
                EVENTO_MUSICA_NOT_FOUND: { mensagem: 'Música não encontrada neste evento', status: 404 },
            },
            fks: [
                { contem: 'fk_artistas_musicas', mensagem: 'Versão não encontrada' },
                { contem: 'fk_tonalidade', mensagem: 'Tonalidade não encontrada' },
                { contem: 'evento_id', mensagem: 'Evento não encontrado' },
                { contem: 'musicas_id', mensagem: 'Música não encontrada' },
            ],
        });
    }

    /**
     * Vincula uma música a um evento no tenant informado, opcionalmente com uma versão selecionada.
     *
     * A validação da versão (quando fornecida) roda dentro da transação do repositório
     * para evitar TOCTOU entre a checagem de existência e a gravação do FK.
     *
     * @param eventoId - ID do evento
     * @param musicas_id - ID da música a vincular
     * @param tenantId - ID do tenant ao qual o vínculo pertence
     * @param artistas_musicas_id - UUID da versão selecionada (opcional)
     * @returns MusicaEvento formatada com versão e versões disponíveis
     * @throws {AppError} 400 — ID da música ausente
     * @throws {AppError} 404 — Evento, música ou versão não encontrada
     * @throws {AppError} 409 — Vínculo duplicado
     */
    async addMusica(eventoId: string, musicas_id: string | undefined, tenantId: string, artistas_musicas_id?: string | null) {
        if (!musicas_id) throw new AppError("ID da música é obrigatório", 400);

        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musica = await eventosRepository.findMusicaById(musicas_id);
        if (!musica) throw new AppError("Música não encontrada", 404);

        const existente = await eventosRepository.findMusicaDuplicate(eventoId, musicas_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        try {
            await eventosRepository.createMusica(eventoId, musicas_id, tenantId, artistas_musicas_id);
        } catch (error) {
            this.handleVersaoSentinel(error);
        }

        const detail = await eventosRepository.findEventoMusicaDetail(eventoId, musicas_id);
        if (!detail) throw new AppError("Falha ao recuperar música criada", 500);
        return flattenEventoMusicaDetail(detail);
    }

    /**
     * Atualiza ou limpa a versão selecionada de uma música em um evento.
     *
     * A validação + escrita rodam dentro de uma única transação para eliminar o TOCTOU
     * entre "versão existe" e "FK gravado". Versão inexistente retorna 404 (convenção
     * REST do projeto); versão pertencendo a outra música retorna 400 (entrada inválida).
     *
     * @param eventoId - ID do evento
     * @param musicaId - ID da música no evento
     * @param artistas_musicas_id - UUID da versão desejada, ou `null` para limpar
     * @returns MusicaEvento formatada com a versão atualizada
     * @throws {AppError} 404 — Se o evento, o vínculo evento-música ou a versão não existir
     * @throws {AppError} 400 — Se a versão pertencer a outra música
     */
    async setMusicaVersao(eventoId: string, musicaId: string, artistas_musicas_id: string | null) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const eventoMusica = await eventosRepository.findMusicaDuplicate(eventoId, musicaId);
        if (!eventoMusica) throw new AppError("Música não encontrada no evento", 404);

        try {
            await eventosRepository.setMusicaVersaoAtomic(eventoMusica.id, musicaId, artistas_musicas_id);
        } catch (error) {
            this.handleVersaoSentinel(error);
        }

        const detail = await eventosRepository.findEventoMusicaDetail(eventoId, musicaId);
        if (!detail) throw new AppError("Falha ao recuperar música atualizada", 500);
        return flattenEventoMusicaDetail(detail);
    }

    /**
     * Define ou limpa o tom próprio de uma música em um evento (override do tom global).
     *
     * A validação da tonalidade + escrita rodam dentro de uma única transação para
     * eliminar o TOCTOU entre "tonalidade existe" e "FK gravado". `null` remove o
     * override e a música volta a seguir o tom global de `musicas.fk_tonalidade`.
     *
     * @param eventoId - ID do evento
     * @param musicaId - ID da música no evento
     * @param fk_tonalidade - UUID da tonalidade desejada, ou `null` para voltar ao tom global
     * @returns MusicaEvento formatada com `tonalidade` efetiva e `tonalidade_musica` global
     * @throws {AppError} 404 — Se o evento, o vínculo evento-música ou a tonalidade não existir
     */
    async setMusicaTonalidade(eventoId: string, musicaId: string, fk_tonalidade: string | null) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const eventoMusica = await eventosRepository.findMusicaDuplicate(eventoId, musicaId);
        if (!eventoMusica) throw new AppError("Música não encontrada no evento", 404);

        try {
            await eventosRepository.setMusicaTonalidadeAtomic(eventoMusica.id, fk_tonalidade);
        } catch (error) {
            this.handleVersaoSentinel(error);
        }

        const detail = await eventosRepository.findEventoMusicaDetail(eventoId, musicaId);
        if (!detail) throw new AppError("Falha ao recuperar música atualizada", 500);
        return flattenEventoMusicaDetail(detail);
    }

    /**
     * Remove o vínculo entre um evento e uma música.
     * Após a remoção, recalcula a ordem das músicas restantes para manter sequência contínua.
     */
    async removeMusica(eventoId: string, musicaId: string) {
        const registro = await eventosRepository.findMusicaDuplicate(eventoId, musicaId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await eventosRepository.deleteMusicaEReindexar(registro.id, eventoId);
    }

    /**
     * Reordena as músicas de um evento conforme a ordem dos IDs recebidos.
     * Valida que o evento existe e que os IDs correspondem exatamente às músicas vinculadas.
     *
     * @param eventoId - ID do evento
     * @param musicasIds - Array de IDs de músicas na nova ordem desejada
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     * @throws {AppError} 400 — Se os IDs não corresponderem às músicas do evento
     */
    async reorderMusicas(eventoId: string, musicasIds: string[]) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musicas = await eventosRepository.findMusicas(eventoId);
        const currentIds = new Set(musicas.map(m => m.eventos_musicas_musicas_id_fkey.id));
        const newIds = new Set(musicasIds);

        if (currentIds.size !== newIds.size || musicasIds.length !== currentIds.size) {
            throw new AppError("A lista de músicas não corresponde às músicas do evento", 400);
        }

        for (const id of musicasIds) {
            if (!currentIds.has(id)) {
                throw new AppError("A lista de músicas não corresponde às músicas do evento", 400);
            }
        }

        await eventosRepository.reorderMusicas(eventoId, musicasIds);
    }

    // --- Integrantes ---

    /**
     * Lista os integrantes vinculados a um evento com funções selecionadas para o evento.
     *
     * @param eventoId - ID do evento
     * @returns Array de integrantes com `id`, `nome` e `funcoes` selecionadas para o evento
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     */
    async listIntegrantes(eventoId: string) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const integrantes = await eventosRepository.findIntegrantes(eventoId);
        return integrantes.map(i => {
            const user = i.eventos_users_fk_user_id_fkey;
            return {
                id: user.id,
                nome: user.name,
                funcoes: i.Eventos_Users_Funcoes.map(f => f.eventos_users_funcoes_funcao_fkey)
            };
        });
    }

    /**
     * Adiciona um integrante a um evento com funções selecionadas.
     *
     * Se `funcao_ids` não for fornecido (ou for `null`), todas as funções globais do integrante serão usadas.
     * Se `funcao_ids` for um array vazio (`[]`), nenhuma função será vinculada ao registro do evento.
     * Se fornecido com itens, valida que cada ID pertence às funções globais do integrante.
     *
     * @param eventoId - ID do evento
     * @param fk_integrante_id - ID do integrante a ser adicionado
     * @param funcao_ids - IDs das funções selecionadas (opcional — usa todas se omitido/null e nenhuma se array vazio)
     * @param tenantId - ID do tenant ao qual os registros pertencem
     * @throws {AppError} 400 — "ID do integrante é obrigatório" se `fk_integrante_id` não for informado
     * @throws {AppError} 400 — "Função inválida" se algum `funcao_id` não pertence ao integrante
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     * @throws {AppError} 404 — "Integrante não encontrado" se o integrante não existir
     * @throws {AppError} 409 — "Registro duplicado" se o vínculo já existir
     */
    async addIntegrante(eventoId: string, fk_integrante_id: string | undefined, funcao_ids: string[] | undefined, tenantId: string) {
        if (!fk_integrante_id) throw new AppError("ID do integrante é obrigatório", 400);

        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const integrante = await eventosRepository.findIntegranteById(fk_integrante_id, tenantId);
        if (!integrante) throw new AppError("Integrante não encontrado", 404);

        const existente = await eventosRepository.findIntegranteDuplicate(eventoId, fk_integrante_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        const userFuncoes = await eventosRepository.findUserFuncoes(fk_integrante_id);
        const userFuncaoIds = new Set(userFuncoes.map(f => f.funcao_id));

        let selectedFuncaoIds: string[];
        if (funcao_ids == null) {
            selectedFuncaoIds = Array.from(userFuncaoIds);
        } else if (funcao_ids.length === 0) {
            selectedFuncaoIds = [];
        } else {
            const invalidas = funcao_ids.filter(id => !userFuncaoIds.has(id));
            if (invalidas.length > 0) {
                throw new AppError("Função inválida: não pertence ao integrante", 400);
            }
            /**
             * Deduplica antes de gravar: `funcao_ids` repetido faria `createIntegrante`
             * tentar dois inserts iguais em `Eventos_Users_Funcoes`, violar a unique e
             * derrubar a transação inteira — o vínculo do integrante, que era válido,
             * também seria desfeito, e o cliente receberia um 409 genérico.
             */
            selectedFuncaoIds = Array.from(new Set(funcao_ids));
        }

        /**
         * A escrita toca duas tabelas com constraints próprias. Sem este catch,
         * uma corrida com outra requisição (P2002 em `Eventos_Users`) ou uma
         * função apagada entre a validação e a gravação (P2003) escapariam como
         * 500 genérico — o handler de `app.ts` ainda ecoa `err.message` fora de
         * produção, vazando detalhe interno do Prisma.
         */
        try {
            await eventosRepository.createIntegrante(eventoId, fk_integrante_id, selectedFuncaoIds, tenantId);
        } catch (error) {
            this.handleIntegranteSentinel(error);
        }
    }

    /**
     * Converte erros conhecidos do Prisma na vinculação de integrante em `AppError`.
     *
     * @param error - Erro capturado da transação de `createIntegrante`
     * @throws {AppError} Sempre — re-lança convertido ou propaga o desconhecido
     */
    private handleIntegranteSentinel(error: unknown): never {
        traduzirErroDeEscrita(error, {
            fks: [
                { contem: 'funcao_id', mensagem: 'Função não encontrada' },
                { contem: 'evento_id', mensagem: 'Evento não encontrado' },
            ],
        });
    }

    /** Remove o vínculo entre um evento e um integrante. */
    async removeIntegrante(eventoId: string, integranteId: string) {
        const registro = await eventosRepository.findIntegranteDuplicate(eventoId, integranteId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await eventosRepository.deleteIntegrante(registro.id);
    }
}

export default new EventosService();
