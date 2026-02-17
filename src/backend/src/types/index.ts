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

export interface MusicaRaw {
    id: string;
    nome: string;
    musicas_fk_tonalidade_fkey: IdTom | null;
    Musicas_Tags: { musicas_tags_tag_id_fkey: IdNome }[];
    Artistas_Musicas: VersaoRaw[];
    Musicas_Funcoes: { musicas_funcoes_funcao_id_fkey: IdNome }[];
}

export interface Musica {
    id: string;
    nome: string;
    tonalidade: IdTom | null;
    tags: IdNome[];
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
    Musicas_Tags: {
        select: {
            musicas_tags_tag_id_fkey: {
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
