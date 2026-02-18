/**
 * Repositório de relatórios — queries de agregação Prisma.
 *
 * Responsável por buscar dados agregados do banco para composição
 * do resumo de relatórios: contagens, ranking e atividade mensal.
 */

import prisma from '../../prisma/cliente.js';
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
        return prisma.musicas.count();
    }

    /**
     * Conta o total de eventos realizados (com data ≤ hoje).
     *
     * @returns Total de eventos passados.
     */
    async countEventosRealizados(): Promise<number> {
        return prisma.eventos.count({
            where: { data: { lte: new Date() } },
        });
    }

    /**
     * Conta o total de associações evento-música cujo evento tem data ≤ hoje.
     *
     * @returns Total de associações de eventos passados.
     */
    async countAssociacoesEventoMusica(): Promise<number> {
        return prisma.eventos_Musicas.count({
            where: {
                eventos_musicas_evento_id_fkey: {
                    data: { lte: new Date() },
                },
            },
        });
    }

    /**
     * Retorna as N músicas mais frequentes em eventos passados (data ≤ hoje).
     *
     * Ordena por contagem decrescente e, em caso de empate, por nome
     * ascendente (ordem alfabética).
     *
     * @param limit - Quantidade máxima de músicas a retornar.
     * @returns Lista de músicas com id, nome e contagem de aparições.
     */
    async getTopMusicas(limit: number): Promise<MusicaRanking[]> {
        const resultado = await prisma.eventos_Musicas.groupBy({
            by: ['musicas_id'],
            where: {
                eventos_musicas_evento_id_fkey: {
                    data: { lte: new Date() },
                },
            },
            _count: { musicas_id: true },
            orderBy: { _count: { musicas_id: 'desc' } },
            take: limit * 2,
        });

        const ids = resultado.map(r => r.musicas_id);

        const musicas = await prisma.musicas.findMany({
            where: { id: { in: ids } },
            select: { id: true, nome: true },
        });

        const musicaMap = new Map(musicas.map(m => [m.id, m.nome]));

        const ranking = resultado.map(r => ({
            id: r.musicas_id,
            nome: musicaMap.get(r.musicas_id) ?? '',
            vezes: r._count.musicas_id,
        }));

        ranking.sort((a, b) => {
            if (b.vezes !== a.vezes) return b.vezes - a.vezes;
            return a.nome.localeCompare(b.nome, 'pt-BR');
        });

        return ranking.slice(0, limit);
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

        const eventos = await prisma.eventos.findMany({
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
}

export default new RelatoriosRepository();
