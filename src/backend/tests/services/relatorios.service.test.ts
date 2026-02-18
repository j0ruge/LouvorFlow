/**
 * Testes unitários do RelatoriosService.
 *
 * Valida cálculos de agregação, formatação de resposta e cenários
 * limite usando fake repository com dados configuráveis.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeRelatoriosRepository } from '../fakes/fake-relatorios.repository.js';

const fakeRepo = createFakeRelatoriosRepository();

vi.mock('../../src/repositories/relatorios.repository.js', () => ({
    default: fakeRepo,
}));

const { default: relatoriosService } = await import('../../src/services/relatorios.service.js');

/** Suite de testes unitários para o RelatoriosService. */
describe('RelatoriosService', () => {
    /** Reseta o repositório fake antes de cada teste para garantir isolamento. */
    beforeEach(() => {
        fakeRepo.reset();
    });

    // ─── getResumo ─────────────────────────────────────────

    /** Testes do método getResumo. */
    describe('getResumo', () => {
        /** Deve retornar totais corretos com dados populados. */
        it('deve retornar totais corretos com dados populados', async () => {
            const result = await relatoriosService.getResumo();

            expect(result.totalMusicas).toBe(50);
            expect(result.totalEventos).toBe(20);
            expect(result.topMusicas).toHaveLength(5);
            expect(result.atividadeMensal).toHaveLength(6);
        });

        /** Deve calcular a média arredondada a 1 casa decimal. */
        it('deve calcular a média arredondada a 1 casa decimal', async () => {
            const result = await relatoriosService.getResumo();

            // 100 associações / 20 eventos = 5.0
            expect(result.mediaPorEvento).toBe(5.0);
        });

        /** Deve arredondar a média corretamente para valores não exatos. */
        it('deve arredondar a média corretamente para valores não exatos', async () => {
            fakeRepo.configure({ totalAssociacoes: 103, totalEventos: 20 });

            const result = await relatoriosService.getResumo();

            // 103 / 20 = 5.15 → arredondado a 5.2
            expect(result.mediaPorEvento).toBe(5.2);
        });

        /** Deve retornar zeros e arrays vazios quando o banco está vazio. */
        it('deve retornar zeros e arrays vazios quando não há dados', async () => {
            fakeRepo.configure({
                totalMusicas: 0,
                totalEventos: 0,
                totalAssociacoes: 0,
                topMusicas: [],
                atividadeMensal: [],
            });

            const result = await relatoriosService.getResumo();

            expect(result.totalMusicas).toBe(0);
            expect(result.totalEventos).toBe(0);
            expect(result.mediaPorEvento).toBe(0);
            expect(result.topMusicas).toEqual([]);
            expect(result.atividadeMensal).toEqual([]);
        });

        /** Deve retornar média 0 quando não há eventos (divisão por zero). */
        it('deve retornar média 0 quando não há eventos', async () => {
            fakeRepo.configure({
                totalMusicas: 10,
                totalEventos: 0,
                totalAssociacoes: 0,
            });

            const result = await relatoriosService.getResumo();

            expect(result.mediaPorEvento).toBe(0);
        });

        /** Deve retornar ranking com campos id, nome e vezes formatados. */
        it('deve retornar ranking com campos id, nome e vezes', async () => {
            const result = await relatoriosService.getResumo();

            expect(result.topMusicas[0]).toEqual({
                id: 'id-1',
                nome: 'Way Maker',
                vezes: 10,
            });
        });

        /** Deve limitar o ranking a 5 músicas mesmo com mais dados. */
        it('deve limitar o ranking a 5 músicas', async () => {
            fakeRepo.configure({
                topMusicas: [
                    { id: 'id-1', nome: 'A', vezes: 10 },
                    { id: 'id-2', nome: 'B', vezes: 9 },
                    { id: 'id-3', nome: 'C', vezes: 8 },
                    { id: 'id-4', nome: 'D', vezes: 7 },
                    { id: 'id-5', nome: 'E', vezes: 6 },
                    { id: 'id-6', nome: 'F', vezes: 5 },
                    { id: 'id-7', nome: 'G', vezes: 4 },
                ],
            });

            const result = await relatoriosService.getResumo();

            expect(result.topMusicas).toHaveLength(5);
            expect(result.topMusicas[4].nome).toBe('E');
        });

        /** Deve retornar atividade mensal em ordem cronológica. */
        it('deve retornar atividade mensal em ordem cronológica', async () => {
            const result = await relatoriosService.getResumo();

            expect(result.atividadeMensal[0].mes).toBe('Set 2025');
            expect(result.atividadeMensal[5].mes).toBe('Fev 2026');
        });

        /** Deve retornar a estrutura completa do RelatorioResumo. */
        it('deve retornar estrutura completa do RelatorioResumo', async () => {
            const result = await relatoriosService.getResumo();

            expect(result).toHaveProperty('totalMusicas');
            expect(result).toHaveProperty('totalEventos');
            expect(result).toHaveProperty('mediaPorEvento');
            expect(result).toHaveProperty('topMusicas');
            expect(result).toHaveProperty('atividadeMensal');
        });
    });
});
