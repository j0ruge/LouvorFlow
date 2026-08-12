/**
 * Fake repository de relatórios para testes unitários.
 *
 * Simula o repositório de relatórios com dados configuráveis em memória,
 * permitindo testar o service sem acesso ao banco de dados.
 */

import type { MusicaRanking, AtividadeMensal } from '../../src/types/index.js';

/** Nomes abreviados dos meses em português (espelha o repositório real). */
const MESES_PT = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

/**
 * Evento simulado para derivação dos indicadores baseados em evento.
 * Permite testar o filtro D5 (rascunho não conta) do repositório real.
 */
interface FakeEventoRelatorio {
    /** Data do evento. */
    data: Date;
    /** Status de publicação da escala (`rascunho` não conta nos indicadores). */
    status: 'rascunho' | 'publicada';
    /** Músicas escaladas no evento (uma associação por item). */
    musicas: { id: string; nome: string }[];
}

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
    /** Total de músicas criadas no mês corrente. */
    novasMusicasNoMes: number;
    /**
     * Dataset opcional de eventos. Quando presente, os quatro indicadores
     * baseados em evento (total, associações, ranking e atividade mensal)
     * são **derivados** dele aplicando o mesmo filtro do repositório real
     * (`data ≤ hoje` e `status = 'publicada'`, decisão D5), em vez de usar
     * os números configurados acima.
     */
    eventos: FakeEventoRelatorio[] | null;
}

/** Dados padrão para testes com cenário populado. */
const DEFAULT_DATA: FakeRelatoriosData = {
    totalMusicas: 50,
    totalEventos: 20,
    totalAssociacoes: 100,
    novasMusicasNoMes: 8,
    eventos: null,
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

    /**
     * Retorna os eventos contabilizáveis do dataset: `status = 'publicada'`,
     * `data ≤ hoje` e — quando `meses` é informado — `data ≥ início da janela`,
     * espelhando o `gte: inicioMes` / `lte: hoje` do repositório real.
     *
     * Sem o limite inferior, um evento de dois anos atrás entraria na
     * "atividade mensal" do fake e sairia da query real: nenhum teste sobre
     * este fake conseguiria pegar uma regressão no janelamento.
     *
     * Retorna `null` quando não há dataset (usa os números configurados).
     *
     * @param meses - Tamanho da janela em meses; omitido, não aplica limite inferior.
     */
    function eventosContabilizaveis(meses?: number): FakeEventoRelatorio[] | null {
        if (!data.eventos) return null;
        const hoje = new Date();
        const inicioMes =
            meses === undefined
                ? null
                : new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1, 1);

        return data.eventos.filter(
            e =>
                e.status === 'publicada'
                && e.data <= hoje
                && (inicioMes === null || e.data >= inicioMes),
        );
    }

    return {
        /** Retorna o total de músicas configurado. */
        countMusicas: async (): Promise<number> => data.totalMusicas,

        /**
         * Retorna o total de eventos realizados: derivado do dataset (filtro
         * D5 — rascunho não conta) quando configurado, ou o número fixo.
         */
        countEventosRealizados: async (): Promise<number> => {
            const eventos = eventosContabilizaveis();
            return eventos ? eventos.length : data.totalEventos;
        },

        /**
         * Retorna o total de associações evento-música: derivado do dataset
         * (só eventos `publicada` passados) quando configurado, ou o número fixo.
         */
        countAssociacoesEventoMusica: async (): Promise<number> => {
            const eventos = eventosContabilizaveis();
            return eventos
                ? eventos.reduce((soma, e) => soma + e.musicas.length, 0)
                : data.totalAssociacoes;
        },

        /** Retorna o total de músicas criadas no mês corrente configurado. */
        countMusicasCriadasNoMes: async (): Promise<number> => data.novasMusicasNoMes,

        /**
         * Retorna as top músicas, incluindo empates na fronteira do corte
         * (espelha a lógica do repositório real). Com dataset configurado,
         * o ranking é derivado apenas dos eventos `publicada` passados —
         * aparições em rascunhos não contam (D5).
         *
         * @param limit - Quantidade mínima de músicas no ranking.
         */
        getTopMusicas: async (limit: number): Promise<MusicaRanking[]> => {
            const eventos = eventosContabilizaveis();
            let ranking: MusicaRanking[];

            if (eventos) {
                const contagem = new Map<string, MusicaRanking>();
                for (const evento of eventos) {
                    for (const musica of evento.musicas) {
                        const atual = contagem.get(musica.id) ?? { id: musica.id, nome: musica.nome, vezes: 0 };
                        atual.vezes += 1;
                        contagem.set(musica.id, atual);
                    }
                }
                ranking = Array.from(contagem.values()).sort((a, b) => {
                    if (b.vezes !== a.vezes) return b.vezes - a.vezes;
                    return a.nome.localeCompare(b.nome, 'pt-BR');
                });
            } else {
                ranking = data.topMusicas;
            }

            if (ranking.length === 0) return [];
            const cutoff = ranking.length >= limit
                ? ranking[limit - 1].vezes
                : 0;
            return ranking.filter(m => m.vezes >= cutoff);
        },

        /**
         * Retorna a atividade mensal: derivada do dataset (só eventos
         * `publicada` passados e dentro da janela de `meses`, agrupados por
         * mês) quando configurado, ou a lista fixa.
         *
         * @param meses - Quantidade de meses para trás a partir do mês atual.
         */
        getAtividadeMensal: async (meses: number): Promise<AtividadeMensal[]> => {
            const eventos = eventosContabilizaveis(meses);
            if (!eventos) return data.atividadeMensal;

            const mesMap = new Map<string, { eventos: number; musicas: number; sortKey: number }>();
            for (const evento of eventos) {
                const d = new Date(evento.data);
                const chave = `${MESES_PT[d.getMonth()]} ${d.getFullYear()}`;
                const sortKey = d.getFullYear() * 100 + d.getMonth();
                const atual = mesMap.get(chave) ?? { eventos: 0, musicas: 0, sortKey };
                atual.eventos += 1;
                atual.musicas += evento.musicas.length;
                mesMap.set(chave, atual);
            }

            return Array.from(mesMap.entries())
                .sort((a, b) => a[1].sortKey - b[1].sortKey)
                .map(([mes, valores]) => ({ mes, eventos: valores.eventos, musicas: valores.musicas }));
        },

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
