/**
 * Repositório de relatórios — queries de agregação Prisma.
 *
 * Responsável por buscar dados agregados do banco para composição
 * do resumo de relatórios: contagens, ranking e atividade mensal.
 */

import { getPrisma } from '../../prisma/cliente.js';
import type { MusicaRanking, AtividadeMensal } from '../types/index.js';

/**
 * Nomes abreviados dos meses em português.
 */
const MESES_PT = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

class RelatoriosRepository {
    /**
     * Conta o total de músicas cadastradas no sistema.
     *
     * @returns Total de músicas.
     */
    async countMusicas(): Promise<number> {
        return getPrisma().musicas.count();
    }

    /**
     * Conta o total de eventos realizados (com data ≤ hoje).
     *
     * @returns Total de eventos passados.
     */
    async countEventosRealizados(): Promise<number> {
        return getPrisma().eventos.count({
            where: { data: { lte: new Date() } },
        });
    }

    /**
     * Conta o total de associações evento-música cujo evento tem data ≤ hoje.
     *
     * @returns Total de associações de eventos passados.
     */
    async countAssociacoesEventoMusica(): Promise<number> {
        return getPrisma().eventos_Musicas.count({
            where: {
                eventos_musicas_evento_id_fkey: {
                    data: { lte: new Date() },
                },
            },
        });
    }

    /**
     * Retorna as músicas mais frequentes em eventos passados (data ≤ hoje).
     *
     * Busca pelo menos {@link limit} músicas, incluindo todas as empatadas
     * na última posição do corte. Ordena por contagem decrescente e, em caso
     * de empate, por nome ascendente (ordem alfabética).
     *
     * @param limit - Quantidade mínima de músicas no ranking (empates na
     *   fronteira podem elevar o total retornado).
     * @returns Lista de músicas com id, nome e contagem de aparições.
     */
    async getTopMusicas(limit: number): Promise<MusicaRanking[]> {
        const resultado = await getPrisma().eventos_Musicas.groupBy({
            by: ['musicas_id'],
            where: {
                eventos_musicas_evento_id_fkey: {
                    data: { lte: new Date() },
                },
            },
            _count: { musicas_id: true },
            orderBy: { _count: { musicas_id: 'desc' } },
        });

        if (resultado.length === 0) return [];

        const cutoffCount = resultado.length >= limit
            ? resultado[limit - 1]._count.musicas_id
            : 0;

        const comCutoff = resultado.filter(r => r._count.musicas_id >= cutoffCount);

        const ids = comCutoff.map(r => r.musicas_id);

        const musicas = await getPrisma().musicas.findMany({
            where: { id: { in: ids } },
            select: { id: true, nome: true },
        });

        const musicaMap = new Map(musicas.map(m => [m.id, m.nome]));

        const ranking = comCutoff.map(r => ({
            id: r.musicas_id,
            nome: musicaMap.get(r.musicas_id) ?? '',
            vezes: r._count.musicas_id,
        }));

        ranking.sort((a, b) => {
            if (b.vezes !== a.vezes) return b.vezes - a.vezes;
            return a.nome.localeCompare(b.nome, 'pt-BR');
        });

        return ranking;
    }

    /**
     * Retorna contagem de eventos e músicas por mês para os últimos N meses.
     *
     * Considera apenas eventos com data ≤ hoje. Ordenado cronologicamente
     * em ordem ascendente (mais antigo primeiro).
     *
     * @param meses - Quantidade de meses para trás a partir do mês atual.
     * @returns Lista de atividade mensal com nome do mês, eventos e músicas.
     */
    async getAtividadeMensal(meses: number): Promise<AtividadeMensal[]> {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1, 1);

        const eventos = await getPrisma().eventos.findMany({
            where: {
                data: {
                    gte: inicioMes,
                    lte: hoje,
                },
            },
            select: {
                id: true,
                data: true,
                _count: { select: { Eventos_Musicas: true } },
            },
        });

        const mesMap = new Map<string, { eventos: number; musicas: number; sortKey: number }>();

        for (const evento of eventos) {
            const d = new Date(evento.data);
            const ano = d.getFullYear();
            const mesIdx = d.getMonth();
            const chave = `${MESES_PT[mesIdx]} ${ano}`;
            const sortKey = ano * 100 + mesIdx;

            const atual = mesMap.get(chave) ?? { eventos: 0, musicas: 0, sortKey };
            atual.eventos += 1;
            atual.musicas += evento._count.Eventos_Musicas;
            mesMap.set(chave, atual);
        }

        return Array.from(mesMap.entries())
            .sort((a, b) => a[1].sortKey - b[1].sortKey)
            .map(([mes, dados]) => ({
                mes,
                eventos: dados.eventos,
                musicas: dados.musicas,
            }));
    }

    /**
     * Conta o total de músicas cadastradas no mês corrente.
     *
     * O corte (primeiro dia do mês) é calculado com `Date` nativo, no fuso
     * horário do servidor — mesma característica de {@link getAtividadeMensal}
     * (`:119-121`), que já monta seus limites de mês com `new Date(ano, mes, dia)`
     * local. `Musicas.created_at` é `@db.Timestamp(6)` (sem timezone no Postgres),
     * então a comparação não sofre conversão de fuso; isso é consistente com o
     * restante do repositório, não uma regressão nova.
     *
     * @returns Total de músicas cujo `created_at` cai no mês corrente.
     */
    async countMusicasCriadasNoMes(): Promise<number> {
        const hoje = new Date();
        const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        return getPrisma().musicas.count({
            where: { created_at: { gte: primeiroDiaDoMes } },
        });
    }
}

export default new RelatoriosRepository();
