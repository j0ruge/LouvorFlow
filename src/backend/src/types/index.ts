/**
 * Representação de uma música no ranking de relatórios.
 *
 * @property id - Identificador único da música (UUID)
 * @property nome - Nome da música
 * @property vezes - Quantidade de eventos em que a música aparece
 */
export interface MusicaRanking {
    id: string;
    nome: string;
    vezes: number;
}

/**
 * Representação da atividade mensal para relatórios.
 *
 * @property mes - Identificador do mês (ex: "Jan 2026")
 * @property eventos - Quantidade de eventos no mês
 * @property musicas - Quantidade de associações evento-música no mês
 */
export interface AtividadeMensal {
    mes: string;
    eventos: number;
    musicas: number;
}

/**
 * Resumo completo de relatórios com todas as métricas agregadas.
 *
 * @property totalMusicas - Total de músicas cadastradas
 * @property totalEventos - Total de eventos com data ≤ hoje
 * @property mediaPorEvento - Média de músicas por evento (1 casa decimal)
 * @property topMusicas - Top 5 músicas por frequência
 * @property atividadeMensal - Atividade dos últimos 6 meses
 */
export interface RelatorioResumo {
    totalMusicas: number;
    totalEventos: number;
    mediaPorEvento: number;
    topMusicas: MusicaRanking[];
    atividadeMensal: AtividadeMensal[];
}

export interface IdNome {
    id: string;
    nome: string;
}

export interface IdTom {
    id: string;
    tom: string;
}

export interface IntegranteWithFuncoes {
    id: string;
    nome: string;
    doc_id: string;
    email: string;
    telefone: string | null;
    Integrantes_Funcoes: {
        integrantes_funcoes_funcao_id_fkey: IdNome;
    }[];
}

export interface VersaoRaw {
    id: string;
    bpm: number | null;
    cifras: string | null;
    lyrics: string | null;
    link_versao: string | null;
    artistas_musicas_artista_id_fkey: IdNome;
}

/**
 * Representação bruta de uma música retornada pelo Prisma (antes da transformação).
 *
 * @property id - Identificador único da música (UUID)
 * @property nome - Nome da música
 * @property musicas_fk_tonalidade_fkey - Tonalidade associada (id e tom) ou `null` quando não definida
 * @property Musicas_Categorias - Categorias vinculadas à música via tabela intermediária
 * @property Artistas_Musicas - Versões da música por artista (dados brutos)
 * @property Musicas_Funcoes - Funções/instrumentos necessários para a música
 */
export interface MusicaRaw {
    id: string;
    nome: string;
    musicas_fk_tonalidade_fkey: IdTom | null;
    Musicas_Categorias: { musicas_categorias_categoria_id_fkey: IdNome }[];
    Artistas_Musicas: VersaoRaw[];
    Musicas_Funcoes: { musicas_funcoes_funcao_id_fkey: IdNome }[];
}

/**
 * Representação transformada de uma música para consumo pela API.
 *
 * @property id - Identificador único da música (UUID)
 * @property nome - Nome da música
 * @property tonalidade - Tonalidade associada (id e tom) ou `null` quando não definida
 * @property categorias - Lista de categorias da música (cada uma com id e nome)
 * @property versoes - Versões da música, cada uma vinculada a um artista com metadados opcionais
 * @property funcoes - Funções/instrumentos necessários para execução da música
 */
export interface Musica {
    id: string;
    nome: string;
    tonalidade: IdTom | null;
    categorias: IdNome[];
    versoes: {
        id: string;
        artista: IdNome;
        bpm: number | null;
        cifras: string | null;
        lyrics: string | null;
        link_versao: string | null;
    }[];
    funcoes: IdNome[];
}

/**
 * Representação bruta de um evento para listagem (index).
 *
 * @property id - Identificador único do evento
 * @property data - Data do evento
 * @property descricao - Descrição do evento
 * @property eventos_fk_tipo_evento_fkey - Tipo do evento (id e nome) ou `null`
 * @property Eventos_Musicas - Músicas vinculadas (cada item contém id e nome)
 * @property Eventos_Integrantes - Integrantes vinculados (cada item contém id e nome)
 */
export interface EventoIndexRaw {
    id: string;
    data: Date;
    descricao: string;
    eventos_fk_tipo_evento_fkey: IdNome | null;
    Eventos_Musicas: { eventos_musicas_musicas_id_fkey: IdNome }[];
    Eventos_Integrantes: { eventos_integrantes_fk_integrante_id_fkey: IdNome }[];
}

export interface EventoShowMusica {
    id: string;
    nome: string;
    musicas_fk_tonalidade_fkey: IdTom | null;
}

export interface EventoShowIntegrante {
    id: string;
    nome: string;
    Integrantes_Funcoes: { integrantes_funcoes_funcao_id_fkey: IdNome }[];
}

/**
 * Representação bruta de um evento para exibição detalhada (show).
 *
 * @property id - Identificador único do evento
 * @property data - Data do evento
 * @property descricao - Descrição do evento
 * @property eventos_fk_tipo_evento_fkey - Tipo do evento (id e nome) ou `null`
 * @property Eventos_Musicas - Músicas vinculadas (cada item contém id, nome e tonalidade)
 * @property Eventos_Integrantes - Integrantes vinculados (cada item contém id, nome e funções)
 */
export interface EventoShowRaw {
    id: string;
    data: Date;
    descricao: string;
    eventos_fk_tipo_evento_fkey: IdNome | null;
    Eventos_Musicas: { eventos_musicas_musicas_id_fkey: EventoShowMusica }[];
    Eventos_Integrantes: { eventos_integrantes_fk_integrante_id_fkey: EventoShowIntegrante }[];
}

export const INTEGRANTE_PUBLIC_SELECT = {
    id: true,
    nome: true,
    doc_id: true,
    email: true,
    telefone: true
} as const;

export const MUSICA_SELECT = {
    id: true,
    nome: true,
    musicas_fk_tonalidade_fkey: {
        select: { id: true, tom: true }
    },
    Musicas_Categorias: {
        select: {
            musicas_categorias_categoria_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    },
    Artistas_Musicas: {
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
    },
    Musicas_Funcoes: {
        select: {
            musicas_funcoes_funcao_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    }
} as const;

export const EVENTO_INDEX_SELECT = {
    id: true,
    data: true,
    descricao: true,
    eventos_fk_tipo_evento_fkey: {
        select: { id: true, nome: true }
    },
    Eventos_Musicas: {
        select: {
            eventos_musicas_musicas_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    },
    Eventos_Integrantes: {
        select: {
            eventos_integrantes_fk_integrante_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    }
} as const;

export const EVENTO_SHOW_SELECT = {
    id: true,
    data: true,
    descricao: true,
    eventos_fk_tipo_evento_fkey: {
        select: { id: true, nome: true }
    },
    Eventos_Musicas: {
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
    },
    Eventos_Integrantes: {
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
    }
} as const;
