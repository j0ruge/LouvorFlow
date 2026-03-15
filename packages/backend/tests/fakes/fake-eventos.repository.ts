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
} from './mock-data.js';

/** Cria fake repository para Eventos com dados em memória (inclui sub-recursos músicas e integrantes). */
export function createFakeEventosRepository() {
  let eventosData = MOCK_EVENTOS.map(e => ({ ...e }));
  let eventosMusicas = MOCK_EVENTOS_MUSICAS.map(em => ({ ...em }));
  let eventosIntegrantes = MOCK_EVENTOS_INTEGRANTES.map(ei => ({ ...ei }));

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
   * @returns Objeto no formato `EventoShowRaw` com músicas (incluindo tonalidade) e users (incluindo funções)
   */
  const buildEventoShow = (evento: typeof eventosData[0]) => ({
    id: evento.id,
    data: evento.data,
    descricao: evento.descricao,
    eventos_fk_tipo_evento_fkey: getTipoEvento(evento.fk_tipo_evento),
    Eventos_Musicas: eventosMusicas
      .filter(em => em.evento_id === evento.id)
      .map(em => {
        const musica = MOCK_MUSICAS_BASE.find(m => m.id === em.musicas_id)!;
        const tonalidade = MOCK_TONALIDADES.find(t => t.id === musica.fk_tonalidade);
        return {
          eventos_musicas_musicas_id_fkey: {
            id: musica.id,
            nome: musica.nome,
            musicas_fk_tonalidade_fkey: tonalidade ? { id: tonalidade.id, tom: tonalidade.tom } : null,
          },
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
            Users_Funcoes: MOCK_INTEGRANTES_FUNCOES
              .filter(iif => iif.fk_user_id === user.id)
              .map(iif => ({
                users_funcoes_funcao_id_fkey: MOCK_FUNCOES.find(f => f.id === iif.funcao_id)!,
              })),
          },
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

    create: async (data: { data: Date; fk_tipo_evento: string; descricao: string }) => {
      const evento = { id: randomUUID(), ...data };
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

    findMusicas: async (eventoId: string) =>
      eventosMusicas
        .filter(em => em.evento_id === eventoId)
        .map(em => {
          const musica = MOCK_MUSICAS_BASE.find(m => m.id === em.musicas_id)!;
          const tonalidade = MOCK_TONALIDADES.find(t => t.id === musica.fk_tonalidade);
          return {
            eventos_musicas_musicas_id_fkey: {
              id: musica.id,
              nome: musica.nome,
              musicas_fk_tonalidade_fkey: tonalidade ? { id: tonalidade.id, tom: tonalidade.tom } : null,
            },
          };
        }),

    createMusica: async (eventoId: string, musicasId: string) => {
      const record = { id: randomUUID(), evento_id: eventoId, musicas_id: musicasId };
      eventosMusicas.push(record);
      return record;
    },

    deleteMusica: async (id: string) => {
      const idx = eventosMusicas.findIndex(em => em.id === id);
      if (idx === -1) return;
      eventosMusicas.splice(idx, 1);
    },

    findMusicaDuplicate: async (eventoId: string, musicasId: string) =>
      eventosMusicas.find(em => em.evento_id === eventoId && em.musicas_id === musicasId) ?? null,

    findMusicaById: async (musicasId: string) =>
      MOCK_MUSICAS_BASE.find(m => m.id === musicasId) ?? null,

    // --- Integrantes (eventos_users) ---

    /**
     * Retorna os users vinculados a um evento com suas funções musicais.
     *
     * @param eventoId - ID do evento
     * @returns Array de users no formato esperado pelo service
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
              Users_Funcoes: MOCK_INTEGRANTES_FUNCOES
                .filter(iif => iif.fk_user_id === user.id)
                .map(iif => ({
                  users_funcoes_funcao_id_fkey: MOCK_FUNCOES.find(f => f.id === iif.funcao_id)!,
                })),
            },
          };
        }),

    /**
     * Cria um vínculo entre evento e user no array em memória.
     *
     * @param eventoId - ID do evento
     * @param userId - ID do user
     * @returns Registro criado com id gerado automaticamente
     */
    createIntegrante: async (eventoId: string, userId: string) => {
      const record = { id: randomUUID(), evento_id: eventoId, fk_user_id: userId };
      eventosIntegrantes.push(record);
      return record;
    },

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
    },
  };
}
