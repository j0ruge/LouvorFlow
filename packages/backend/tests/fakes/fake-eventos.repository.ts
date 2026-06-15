import { randomUUID } from 'node:crypto';
import {
  MOCK_EVENTOS,
  MOCK_EVENTOS_MUSICAS,
  MOCK_EVENTOS_INTEGRANTES,
  MOCK_TIPOS_EVENTOS,
  MOCK_MUSICAS_BASE,
  MOCK_TONALIDADES,
  MOCK_INTEGRANTES,
  MOCK_INTEGRANTES_FUNCOES,
  MOCK_FUNCOES,
  MOCK_ARTISTAS_MUSICAS,
  MOCK_ARTISTAS,
} from './mock-data.js';

/**
 * Constrói o subset projetado de uma versão para o detalhe de evento.
 * Retorna `null` se o ID não existir ou for nulo.
 */
function buildVersaoShow(versaoId: string | null | undefined) {
  if (!versaoId) return null;
  const versao = MOCK_ARTISTAS_MUSICAS.find(am => am.id === versaoId);
  if (!versao) return null;
  const artista = versao.artista_id ? MOCK_ARTISTAS.find(a => a.id === versao.artista_id) ?? null : null;
  return {
    id: versao.id,
    link_versao: versao.link_versao,
    cifraclub_url: versao.cifraclub_url ?? null,
    artistas_musicas_artista_id_fkey: artista ? { id: artista.id, nome: artista.nome } : null,
  };
}

/**
 * Lista todas as versões cadastradas para uma música, no formato projetado para detalhe de evento.
 */
function listVersoesShowByMusica(musicaId: string) {
  return MOCK_ARTISTAS_MUSICAS
    .filter(am => am.musica_id === musicaId)
    .map(am => buildVersaoShow(am.id)!)
    .filter(Boolean);
}

/** Representa um registro na tabela eventos_users_funcoes (funções selecionadas por evento). */
interface EventoUserFuncao {
  id: string;
  evento_user_id: string;
  funcao_id: string;
}

/** Cria fake repository para Eventos com dados em memória (inclui sub-recursos músicas e integrantes). */
export function createFakeEventosRepository() {
  let eventosData = MOCK_EVENTOS.map(e => ({ ...e }));
  let eventosMusicas = MOCK_EVENTOS_MUSICAS.map(em => ({ ...em }));
  let eventosIntegrantes = MOCK_EVENTOS_INTEGRANTES.map(ei => ({ ...ei }));
  let eventosUsersFuncoes: EventoUserFuncao[] = buildInitialEventoUserFuncoes();

  /**
   * Constrói os registros iniciais de eventos_users_funcoes com base nos vínculos existentes.
   * Usa todas as funções globais do integrante como funções do evento.
   */
  function buildInitialEventoUserFuncoes(): EventoUserFuncao[] {
    const result: EventoUserFuncao[] = [];
    for (const ei of MOCK_EVENTOS_INTEGRANTES) {
      const userFuncoes = MOCK_INTEGRANTES_FUNCOES.filter(iif => iif.fk_user_id === ei.fk_user_id);
      for (const uf of userFuncoes) {
        result.push({
          id: randomUUID(),
          evento_user_id: ei.id,
          funcao_id: uf.funcao_id,
        });
      }
    }
    return result;
  }

  const getTipoEvento = (fk_tipo_evento: string) => {
    const t = MOCK_TIPOS_EVENTOS.find(te => te.id === fk_tipo_evento);
    return t ? { id: t.id, nome: t.nome } : null;
  };

  /**
   * Constrói a representação de listagem (index) de um evento a partir dos dados em memória.
   *
   * @param evento - Registro do evento no array local
   * @returns Objeto no formato `EventoIndexRaw` com músicas e integrantes resumidos
   */
  const buildEventoIndex = (evento: typeof eventosData[0]) => ({
    id: evento.id,
    data: evento.data,
    descricao: evento.descricao,
    eventos_fk_tipo_evento_fkey: getTipoEvento(evento.fk_tipo_evento),
    Eventos_Musicas: eventosMusicas
      .filter(em => em.evento_id === evento.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map(em => {
        const musica = MOCK_MUSICAS_BASE.find(m => m.id === em.musicas_id)!;
        return {
          eventos_musicas_musicas_id_fkey: { id: musica.id, nome: musica.nome },
        };
      }),
    Eventos_Users: eventosIntegrantes
      .filter(ei => ei.evento_id === evento.id)
      .map(ei => {
        const user = MOCK_INTEGRANTES.find(i => i.id === ei.fk_user_id)!;
        return {
          eventos_users_fk_user_id_fkey: { id: user.id, name: user.name },
        };
      }),
  });

  /**
   * Constrói a representação detalhada (show) de um evento a partir dos dados em memória.
   *
   * @param evento - Registro do evento no array local
   * @returns Objeto no formato `EventoShowRaw` com músicas (incluindo tonalidade) e users (com funções do evento)
   */
  const buildEventoShow = (evento: typeof eventosData[0]) => ({
    id: evento.id,
    data: evento.data,
    descricao: evento.descricao,
    eventos_fk_tipo_evento_fkey: getTipoEvento(evento.fk_tipo_evento),
    Eventos_Musicas: eventosMusicas
      .filter(em => em.evento_id === evento.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map(em => {
        const musica = MOCK_MUSICAS_BASE.find(m => m.id === em.musicas_id)!;
        const tonalidade = MOCK_TONALIDADES.find(t => t.id === musica.fk_tonalidade);
        return {
          id: em.id,
          ordem: em.ordem,
          eventos_musicas_musicas_id_fkey: {
            id: musica.id,
            nome: musica.nome,
            musicas_fk_tonalidade_fkey: tonalidade ? { id: tonalidade.id, tom: tonalidade.tom } : null,
            Artistas_Musicas: listVersoesShowByMusica(musica.id),
          },
          eventos_musicas_artistas_musicas_fkey: buildVersaoShow(em.fk_artistas_musicas),
        };
      }),
    Eventos_Users: eventosIntegrantes
      .filter(ei => ei.evento_id === evento.id)
      .map(ei => {
        const user = MOCK_INTEGRANTES.find(i => i.id === ei.fk_user_id)!;
        return {
          eventos_users_fk_user_id_fkey: {
            id: user.id,
            name: user.name,
          },
          Eventos_Users_Funcoes: eventosUsersFuncoes
            .filter(euf => euf.evento_user_id === ei.id)
            .map(euf => ({
              eventos_users_funcoes_funcao_fkey: MOCK_FUNCOES.find(f => f.id === euf.funcao_id)!,
            })),
        };
      }),
  });

  return {
    // --- Base CRUD ---

    findAll: async () => eventosData.map(buildEventoIndex),

    findById: async (id: string) => {
      const evento = eventosData.find(e => e.id === id);
      return evento ? buildEventoShow(evento) : null;
    },

    findByIdSimple: async (id: string) => eventosData.find(e => e.id === id) ?? null,

    /** Cria um evento em memória (parâmetro _tenantId ignorado no fake). */
    create: async (data: { data: Date; fk_tipo_evento: string; descricao: string }, _tenantId?: string) => {
      const evento = {
        id: randomUUID(),
        ...data,
      };
      eventosData.push(evento);
      return {
        id: evento.id,
        data: evento.data,
        descricao: evento.descricao,
        eventos_fk_tipo_evento_fkey: getTipoEvento(evento.fk_tipo_evento),
      };
    },

    update: async (id: string, updateData: Record<string, unknown>) => {
      const evento = eventosData.find(e => e.id === id);
      if (!evento) return null;
      Object.assign(evento, updateData);
      return {
        id: evento.id,
        data: evento.data,
        descricao: evento.descricao,
        eventos_fk_tipo_evento_fkey: getTipoEvento(evento.fk_tipo_evento),
      };
    },

    delete: async (id: string) => {
      const idx = eventosData.findIndex(e => e.id === id);
      if (idx === -1) return;
      eventosData.splice(idx, 1);
    },

    findByIdForDelete: async (id: string) => {
      const evento = eventosData.find(e => e.id === id);
      return evento ? { id: evento.id, data: evento.data, descricao: evento.descricao } : null;
    },

    // --- Musicas (eventos_musicas) ---

    /** Retorna as músicas vinculadas a um evento, ordenadas pelo campo ordem. */
    findMusicas: async (eventoId: string) =>
      eventosMusicas
        .filter(em => em.evento_id === eventoId)
        .sort((a, b) => a.ordem - b.ordem)
        .map(em => {
          const musica = MOCK_MUSICAS_BASE.find(m => m.id === em.musicas_id)!;
          const tonalidade = MOCK_TONALIDADES.find(t => t.id === musica.fk_tonalidade);
          return {
            id: em.id,
            ordem: em.ordem,
            eventos_musicas_musicas_id_fkey: {
              id: musica.id,
              nome: musica.nome,
              musicas_fk_tonalidade_fkey: tonalidade ? { id: tonalidade.id, tom: tonalidade.tom } : null,
            },
          };
        }),

    /** Vincula uma música a um evento em memória com ordem automática e versão opcional (parâmetro _tenantId ignorado no fake). */
    createMusica: async (eventoId: string, musicasId: string, _tenantId?: string, artistas_musicas_id?: string | null) => {
      if (artistas_musicas_id != null) {
        const versao = MOCK_ARTISTAS_MUSICAS.find(am => am.id === artistas_musicas_id);
        if (!versao) throw new Error('VERSAO_NOT_FOUND');
        if (versao.musica_id !== musicasId) throw new Error('VERSAO_WRONG_MUSICA');
      }
      const existing = eventosMusicas.filter(em => em.evento_id === eventoId);
      const maxOrdem = existing.length > 0 ? Math.max(...existing.map(em => em.ordem)) : 0;
      const record = {
        id: randomUUID(),
        evento_id: eventoId,
        musicas_id: musicasId,
        ordem: maxOrdem + 1,
        fk_artistas_musicas: artistas_musicas_id ?? null,
      };
      eventosMusicas.push(record);
      return record;
    },

    deleteMusica: async (id: string) => {
      const idx = eventosMusicas.findIndex(em => em.id === id);
      if (idx === -1) return;
      eventosMusicas.splice(idx, 1);
    },

    /**
     * Reordena as músicas de um evento atribuindo posições sequenciais (1..N)
     * conforme a ordem dos IDs recebidos.
     *
     * @param eventoId - ID do evento
     * @param musicasIds - Array de IDs de músicas na nova ordem desejada
     */
    reorderMusicas: async (eventoId: string, musicasIds: string[]) => {
      musicasIds.forEach((musicaId, index) => {
        const record = eventosMusicas.find(
          em => em.evento_id === eventoId && em.musicas_id === musicaId
        );
        if (record) {
          record.ordem = index + 1;
        }
      });
    },

    findMusicaDuplicate: async (eventoId: string, musicasId: string) =>
      eventosMusicas.find(em => em.evento_id === eventoId && em.musicas_id === musicasId) ?? null,

    /**
     * Atualiza a versão selecionada de uma música no evento em memória.
     *
     * @param id - ID do registro eventos_musicas
     * @param artistas_musicas_id - UUID da versão ou `null` para limpar
     */
    setMusicaVersao: async (id: string, artistas_musicas_id: string | null) => {
      const record = eventosMusicas.find(em => em.id === id);
      if (record) {
        record.fk_artistas_musicas = artistas_musicas_id;
      }
      return record ?? null;
    },

    /**
     * Valida e persiste atomicamente a versão selecionada de uma música.
     * No fake a "transação" é sincrônica; lançamos sentinelas compatíveis com o service.
     *
     * @param eventoMusicaId - ID do registro em eventos_musicas
     * @param musicaId - ID da música esperada
     * @param artistas_musicas_id - UUID da versão ou `null` para limpar
     */
    setMusicaVersaoAtomic: async (
      eventoMusicaId: string,
      musicaId: string,
      artistas_musicas_id: string | null,
    ) => {
      if (artistas_musicas_id !== null) {
        const versao = MOCK_ARTISTAS_MUSICAS.find(am => am.id === artistas_musicas_id);
        if (!versao) throw new Error('VERSAO_NOT_FOUND');
        if (versao.musica_id !== musicaId) throw new Error('VERSAO_WRONG_MUSICA');
      }
      const record = eventosMusicas.find(em => em.id === eventoMusicaId);
      if (record) {
        record.fk_artistas_musicas = artistas_musicas_id;
      }
    },

    /**
     * Projeta uma única música no formato de detalhe de evento, sem recarregar o evento inteiro.
     * Usado por addMusica/setMusicaVersao para responder apenas a música afetada.
     *
     * @param eventoId - ID do evento
     * @param musicasId - ID da música
     * @returns Registro cru compatível com EventoMusicaDetailRaw, ou `null`
     */
    findEventoMusicaDetail: async (eventoId: string, musicasId: string) => {
      const em = eventosMusicas.find(x => x.evento_id === eventoId && x.musicas_id === musicasId);
      if (!em) return null;
      const musica = MOCK_MUSICAS_BASE.find(m => m.id === em.musicas_id)!;
      const tonalidade = MOCK_TONALIDADES.find(t => t.id === musica.fk_tonalidade);
      return {
        id: em.id,
        ordem: em.ordem,
        eventos_musicas_musicas_id_fkey: {
          id: musica.id,
          nome: musica.nome,
          musicas_fk_tonalidade_fkey: tonalidade ? { id: tonalidade.id, tom: tonalidade.tom } : null,
          Artistas_Musicas: listVersoesShowByMusica(musica.id),
        },
        eventos_musicas_artistas_musicas_fkey: buildVersaoShow(em.fk_artistas_musicas),
      };
    },

    findMusicaById: async (musicasId: string) =>
      MOCK_MUSICAS_BASE.find(m => m.id === musicasId) ?? null,

    /**
     * Busca uma versão (Artistas_Musicas) pelo ID nos dados mock.
     *
     * @param id - UUID da versão
     * @returns Objeto com id e musica_id, ou `null` se não encontrada
     */
    findArtistaMusicaById: async (id: string) => {
      const am = MOCK_ARTISTAS_MUSICAS.find(a => a.id === id);
      return am ? { id: am.id, musica_id: am.musica_id } : null;
    },

    // --- Integrantes (eventos_users) ---

    /**
     * Retorna os users vinculados a um evento com as funções selecionadas para o evento.
     *
     * @param eventoId - ID do evento
     * @returns Array de users com funções do evento
     */
    findIntegrantes: async (eventoId: string) =>
      eventosIntegrantes
        .filter(ei => ei.evento_id === eventoId)
        .map(ei => {
          const user = MOCK_INTEGRANTES.find(i => i.id === ei.fk_user_id)!;
          return {
            eventos_users_fk_user_id_fkey: {
              id: user.id,
              name: user.name,
            },
            Eventos_Users_Funcoes: eventosUsersFuncoes
              .filter(euf => euf.evento_user_id === ei.id)
              .map(euf => ({
                eventos_users_funcoes_funcao_fkey: MOCK_FUNCOES.find(f => f.id === euf.funcao_id)!,
              })),
          };
        }),

    /** Cria vínculo entre evento e user em memória, incluindo funções selecionadas (parâmetro _tenantId ignorado no fake). */
    createIntegrante: async (eventoId: string, userId: string, funcaoIds: string[], _tenantId?: string) => {
      const record = { id: randomUUID(), evento_id: eventoId, fk_user_id: userId };
      eventosIntegrantes.push(record);
      for (const funcaoId of funcaoIds) {
        eventosUsersFuncoes.push({
          id: randomUUID(),
          evento_user_id: record.id,
          funcao_id: funcaoId,
        });
      }
      return record;
    },

    /**
     * Busca as funções globais (Users_Funcoes) de um user nos dados mock.
     *
     * @param userId - ID do user
     * @returns Lista de objetos com funcao_id
     */
    findUserFuncoes: async (userId: string) =>
      MOCK_INTEGRANTES_FUNCOES
        .filter(iif => iif.fk_user_id === userId)
        .map(iif => ({ funcao_id: iif.funcao_id })),

    deleteIntegrante: async (id: string) => {
      const idx = eventosIntegrantes.findIndex(ei => ei.id === id);
      if (idx === -1) return;
      eventosIntegrantes.splice(idx, 1);
    },

    /**
     * Verifica se já existe o vínculo entre evento e user.
     *
     * @param eventoId - ID do evento
     * @param userId - ID do user
     * @returns Registro existente ou `null`
     */
    findIntegranteDuplicate: async (eventoId: string, userId: string) =>
      eventosIntegrantes.find(ei => ei.evento_id === eventoId && ei.fk_user_id === userId) ?? null,

    /**
     * Busca um user pelo ID nos dados mock.
     *
     * @param userId - ID do user
     * @returns User encontrado ou `null`
     */
    findIntegranteById: async (userId: string) =>
      MOCK_INTEGRANTES.find(i => i.id === userId) ?? null,

    reset: () => {
      eventosData = MOCK_EVENTOS.map(e => ({ ...e }));
      eventosMusicas = MOCK_EVENTOS_MUSICAS.map(em => ({ ...em }));
      eventosIntegrantes = MOCK_EVENTOS_INTEGRANTES.map(ei => ({ ...ei }));
      eventosUsersFuncoes = buildInitialEventoUserFuncoes();
    },
  };
}
