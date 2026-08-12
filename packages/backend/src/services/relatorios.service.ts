/**
 * Service de relatórios — lógica de negócio e formatação.
 *
 * Orquestra chamadas ao repositório, calcula métricas derivadas
 * (média por evento) e retorna o objeto formatado conforme contrato.
 */

import relatoriosRepository from '../repositories/relatorios.repository.js';
import type { RelatorioResumo } from '../types/index.js';

class RelatoriosService {
    /**
     * Retorna o resumo completo de relatórios com todas as métricas agregadas.
     *
     * Chama os 6 métodos do repositório, calcula a média de músicas por
     * evento (arredondada a 1 casa decimal) e formata o resultado conforme
     * contrato da API.
     *
     * @returns Objeto RelatorioResumo com totais, ranking, atividade mensal
     *   e a contagem de músicas novas no mês corrente.
     */
    async getResumo(): Promise<RelatorioResumo> {
        const [totalMusicas, totalEventos, totalAssociacoes, topMusicas, atividadeMensal, novasMusicasNoMes] =
            await Promise.all([
                relatoriosRepository.countMusicas(),
                relatoriosRepository.countEventosRealizados(),
                relatoriosRepository.countAssociacoesEventoMusica(),
                relatoriosRepository.getTopMusicas(5),
                relatoriosRepository.getAtividadeMensal(6),
                relatoriosRepository.countMusicasCriadasNoMes(),
            ]);

        const mediaPorEvento = totalEventos === 0
            ? 0
            : Math.round((totalAssociacoes / totalEventos) * 10) / 10;

        return {
            totalMusicas,
            totalEventos,
            mediaPorEvento,
            topMusicas,
            atividadeMensal,
            novasMusicasNoMes,
        };
    }
}

export default new RelatoriosService();
