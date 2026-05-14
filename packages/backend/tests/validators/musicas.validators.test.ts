/**
 * Testes unitários do schema de query params da listagem de músicas.
 *
 * Cobre coerção de page/limit, CSV de UUIDs em `categorias`, trim em `q`,
 * e rejeição de UUIDs inválidos.
 */

import { listMusicasQuerySchema } from '../../src/validators/musicas.validators.js';

describe('listMusicasQuerySchema', () => {
    /** Sem nenhum query param, aplica defaults page=1 e limit=20. */
    it('aplica defaults quando nenhum parâmetro é informado', () => {
        const result = listMusicasQuerySchema.parse({});
        expect(result).toEqual({ page: 1, limit: 20 });
    });

    /** Coerciona page/limit de string (como o Express entrega) para number. */
    it('coerciona page e limit numéricos vindos como string', () => {
        const result = listMusicasQuerySchema.parse({ page: '3', limit: '50' });
        expect(result.page).toBe(3);
        expect(result.limit).toBe(50);
    });

    /** Rejeita page < 1. */
    it('rejeita page menor que 1', () => {
        const result = listMusicasQuerySchema.safeParse({ page: '0' });
        expect(result.success).toBe(false);
    });

    /** Rejeita limit > 100. */
    it('rejeita limit maior que 100', () => {
        const result = listMusicasQuerySchema.safeParse({ limit: '101' });
        expect(result.success).toBe(false);
    });

    /** CSV de UUIDs válidos é transformado em string[]. */
    it('transforma CSV de UUIDs em array', () => {
        const id1 = '550e8400-e29b-41d4-a716-446655440000';
        const id2 = 'c0a80101-0000-4000-8000-000000000001';
        const result = listMusicasQuerySchema.parse({ categorias: `${id1},${id2}` });
        expect(result.categorias).toEqual([id1, id2]);
    });

    /** Espaços ao redor dos UUIDs são removidos via trim. */
    it('faz trim em UUIDs separados por vírgula com espaços', () => {
        const id = '550e8400-e29b-41d4-a716-446655440000';
        const result = listMusicasQuerySchema.parse({ categorias: ` ${id} , ${id} ` });
        expect(result.categorias).toEqual([id, id]);
    });

    /** String vazia resolve para `undefined` (sem filtro). */
    it('retorna undefined quando categorias é string vazia', () => {
        const result = listMusicasQuerySchema.parse({ categorias: '' });
        expect(result.categorias).toBeUndefined();
    });

    /** Apenas vírgulas/espaços resolvem para `undefined`. */
    it('retorna undefined quando categorias contém apenas separadores', () => {
        const result = listMusicasQuerySchema.parse({ categorias: ' , , ' });
        expect(result.categorias).toBeUndefined();
    });

    /** UUID com tamanho 36 mas hifens em posições erradas é rejeitado. */
    it('rejeita string de 36 caracteres com hifens em posições inválidas', () => {
        const result = listMusicasQuerySchema.safeParse({
            categorias: '------------------------------------',
        });
        expect(result.success).toBe(false);
    });

    /** UUID curto (não-36) é rejeitado. */
    it('rejeita UUID com tamanho inválido', () => {
        const result = listMusicasQuerySchema.safeParse({ categorias: 'not-a-uuid' });
        expect(result.success).toBe(false);
    });

    /** Mistura de válido + inválido falha (defesa em profundidade). */
    it('rejeita CSV quando qualquer item não é UUID válido', () => {
        const valid = '550e8400-e29b-41d4-a716-446655440000';
        const result = listMusicasQuerySchema.safeParse({ categorias: `${valid},broken-id` });
        expect(result.success).toBe(false);
    });

    /** `q` com apenas espaços (trimado para vazio) resolve para `undefined`. */
    it('retorna undefined quando q contém apenas espaços', () => {
        const result = listMusicasQuerySchema.parse({ q: '   ' });
        expect(result.q).toBeUndefined();
    });

    /** `q` válido sobrevive ao trim. */
    it('preserva q após trim quando há conteúdo', () => {
        const result = listMusicasQuerySchema.parse({ q: '  agnus  ' });
        expect(result.q).toBe('agnus');
    });
});
