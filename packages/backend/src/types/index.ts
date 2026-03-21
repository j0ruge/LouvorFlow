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

/**
 * Dados de entrada para criação completa de música (música + versão opcional).
 *
 * @property nome - Nome da música (obrigatório)
 * @property fk_tonalidade - UUID da tonalidade (opcional)
 * @property artista_id - UUID do artista para a versão (opcional)
 * @property bpm - Batidas por minuto da versão (opcional)
 * @property cifras - Cifras da versão (opcional)
 * @property lyrics - Letra da versão (opcional)
 * @property link_versao - Link externo da versão (opcional)
 */
export interface CreateMusicaCompleteInput {
    nome?: string;
    fk_tonalidade?: string;
    artista_id?: string;
    bpm?: number;
    cifras?: string;
    lyrics?: string;
    link_versao?: string;
    /** IDs de categorias a associar à música (opcional). */
    categoria_ids?: string[];
    /** IDs de funções requeridas a associar à música (opcional). */
    funcao_ids?: string[];
}

/**
 * Dados de entrada para atualização completa de música (música + versão existente).
 *
 * @property nome - Nome da música (obrigatório)
 * @property fk_tonalidade - UUID da tonalidade (opcional, `null` para remover)
 * @property versao_id - UUID da versão a atualizar (opcional)
 * @property bpm - Batidas por minuto da versão (opcional)
 * @property cifras - Cifras da versão (opcional)
 * @property lyrics - Letra da versão (opcional)
 * @property link_versao - Link externo da versão (opcional)
 */
export interface UpdateMusicaCompleteInput {
    nome?: string;
    fk_tonalidade?: string | null;
    versao_id?: string;
    bpm?: number;
    cifras?: string;
    lyrics?: string;
    link_versao?: string;
    /** IDs de categorias desejadas (se presente, sincroniza; se ausente, mantém). */
    categoria_ids?: string[];
    /** IDs de funções requeridas desejadas (se presente, sincroniza; se ausente, mantém). */
    funcao_ids?: string[];
}

export interface IdTom {
    id: string;
    tom: string;
}

/**
 * Dados de entrada para criação de integrante (opera sobre model Users).
 * Campos usam naming em português para retrocompatibilidade da API.
 *
 * @property nome - Nome do integrante (mapeado para `name` no Users)
 * @property email - Email do integrante (obrigatório, único)
 * @property senha - Senha em texto plano (mapeada para `password`, será hasheada)
 * @property telefone - Telefone de contato (opcional)
 */
export interface CreateIntegranteInput {
    nome?: string;
    email?: string;
    senha?: string;
    telefone?: string;
}

/**
 * Dados de entrada para atualização de integrante (opera sobre model Users).
 * Todos os campos são opcionais — apenas os enviados serão atualizados.
 *
 * @property nome - Novo nome (mapeado para `name` no Users)
 * @property email - Novo email (verificado contra duplicidade)
 * @property senha - Nova senha (mapeada para `password`, será hasheada)
 * @property telefone - Novo telefone de contato
 */
export interface UpdateIntegranteInput {
    nome?: string;
    email?: string;
    senha?: string;
    telefone?: string;
}

/**
 * Representação de um user com funções musicais, retornada pelo Prisma
 * antes da transformação para a API de integrantes.
 *
 * @property id - Identificador único (UUID)
 * @property name - Nome do user (mapeado para `nome` na resposta)
 * @property email - Email do user
 * @property telefone - Telefone de contato ou `null`
 * @property Users_Funcoes - Funções musicais vinculadas via tabela intermediária
 */
export interface IntegranteWithFuncoes {
    id: string;
    name: string;
    email: string;
    telefone: string | null;
    Users_Funcoes: {
        users_funcoes_funcao_id_fkey: IdNome;
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
 * @property Eventos_Users - Users vinculados (cada item contém id e nome)
 */
export interface EventoIndexRaw {
    id: string;
    data: Date;
    descricao: string;
    eventos_fk_tipo_evento_fkey: IdNome | null;
    Eventos_Musicas: { eventos_musicas_musicas_id_fkey: IdNome }[];
    Eventos_Users: { eventos_users_fk_user_id_fkey: { id: string; name: string } }[];
}

export interface EventoShowMusica {
    id: string;
    nome: string;
    musicas_fk_tonalidade_fkey: IdTom | null;
}

/**
 * Representação de um user vinculado a um evento (show), com funções selecionadas para o evento.
 *
 * @property eventos_users_fk_user_id_fkey - Dados do user (id e nome)
 * @property Eventos_Users_Funcoes - Funções selecionadas para este evento específico
 */
export interface EventoShowIntegranteRaw {
    eventos_users_fk_user_id_fkey: { id: string; name: string };
    Eventos_Users_Funcoes: { eventos_users_funcoes_funcao_fkey: IdNome }[];
}

/**
 * Representação bruta de um evento para exibição detalhada (show).
 *
 * @property id - Identificador único do evento
 * @property data - Data do evento
 * @property descricao - Descrição do evento
 * @property eventos_fk_tipo_evento_fkey - Tipo do evento (id e nome) ou `null`
 * @property Eventos_Musicas - Músicas vinculadas (cada item contém id, nome e tonalidade)
 * @property Eventos_Users - Users vinculados com funções selecionadas para o evento
 */
export interface EventoShowRaw {
    id: string;
    data: Date;
    descricao: string;
    eventos_fk_tipo_evento_fkey: IdNome | null;
    Eventos_Musicas: { eventos_musicas_musicas_id_fkey: EventoShowMusica }[];
    Eventos_Users: EventoShowIntegranteRaw[];
}

/**
 * Select de campos públicos para consultas de integrantes (opera sobre Users).
 * Exclui `password` e `avatar` da resposta.
 */
export const INTEGRANTE_PUBLIC_SELECT = {
    id: true,
    name: true,
    email: true,
    telefone: true,
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
        },
        orderBy: { created_at: 'asc' as const }
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
    Eventos_Users: {
        select: {
            eventos_users_fk_user_id_fkey: {
                select: { id: true, name: true }
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
    Eventos_Users: {
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
    }
} as const;
