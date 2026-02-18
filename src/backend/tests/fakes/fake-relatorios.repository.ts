/**
 * Fake repository de relatórios para testes unitários.
 *
 * Simula o repositório de relatórios com dados configuráveis em memória,
 * permitindo testar o service sem acesso ao banco de dados.
 */

import type { MusicaRanking, AtividadeMensal } from '../../src/types/index.js';

/** Dados configuráveis para o fake repository de relatórios. */
interface FakeRelatoriosData {
    /** Total de músicas cadastradas. */
    totalMusicas: number;
    /** Total de eventos realizados (data ≤ hoje). */
    totalEventos: number;
    /** Total de associações evento-música (eventos passados). */
    totalAssociacoes: number;
    /** Lista de músicas para o ranking. */
    topMusicas: MusicaRanking[];
    /** Lista de atividade mensal. */
    atividadeMensal: AtividadeMensal[];
}

/** Dados padrão para testes com cenário populado. */
const DEFAULT_DATA: FakeRelatoriosData = {
    totalMusicas: 50,
    totalEventos: 20,
    totalAssociacoes: 100,
    topMusicas: [
        { id: 'id-1', nome: 'Way Maker', vezes: 10 },
        { id: 'id-2', nome: 'Oceans', vezes: 7 },
        { id: 'id-3', nome: 'Goodness of God', vezes: 5 },
        { id: 'id-4', nome: 'Holy Spirit', vezes: 4 },
        { id: 'id-5', nome: 'What A Beautiful Name', vezes: 3 },
    ],
    atividadeMensal: [
        { mes: 'Set 2025', eventos: 6, musicas: 36 },
        { mes: 'Out 2025', eventos: 7, musicas: 42 },
        { mes: 'Nov 2025', eventos: 8, musicas: 48 },
        { mes: 'Dez 2025', eventos: 5, musicas: 30 },
        { mes: 'Jan 2026', eventos: 8, musicas: 48 },
        { mes: 'Fev 2026', eventos: 4, musicas: 24 },
    ],
};

/**
 * Cria um fake repository de relatórios com dados configuráveis.
 *
 * @param dados - Dados iniciais opcionais (usa padrão se não informado).
 * @returns Fake repository com métodos de contagem e consulta.
 */
export function createFakeRelatoriosRepository(dados?: Partial<FakeRelatoriosData>) {
    let data: FakeRelatoriosData = { ...DEFAULT_DATA, ...dados };

    return {
        /** Retorna o total de músicas configurado. */
        countMusicas: async (): Promise<number> => data.totalMusicas,

        /** Retorna o total de eventos realizados configurado. */
        countEventosRealizados: async (): Promise<number> => data.totalEventos,

        /** Retorna o total de associações evento-música configurado. */
        countAssociacoesEventoMusica: async (): Promise<number> => data.totalAssociacoes,

        /**
         * Retorna as top N músicas do ranking configurado.
         *
         * @param limit - Quantidade máxima de músicas.
         */
        getTopMusicas: async (limit: number): Promise<MusicaRanking[]> =>
            data.topMusicas.slice(0, limit),

        /**
         * Retorna a atividade mensal configurada.
         *
         * @param _meses - Quantidade de meses (ignorado no fake).
         */
        getAtividadeMensal: async (_meses: number): Promise<AtividadeMensal[]> =>
            data.atividadeMensal,

        /**
         * Configura novos dados para o fake repository.
         *
         * @param novos - Dados parciais para sobrescrever.
         */
        configure: (novos: Partial<FakeRelatoriosData>) => {
            data = { ...data, ...novos };
        },

        /** Reseta o fake repository para os dados padrão. */
        reset: () => {
            data = { ...DEFAULT_DATA, ...dados };
        },
    };
}
