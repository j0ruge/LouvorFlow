/**
 * Testes unitários do schema de query params da listagem de músicas.
 *
 * Cobre coerção de page/limit, CSV de UUIDs em `categorias`, trim em `q`,
 * e rejeição de UUIDs inválidos.
 */

import { listMusicasQuerySchema } from '../../src/validators/musicas.validators.js';

/**
 * Valida o schema Zod de query params da listagem de músicas
 * (`GET /api/musicas`): coerção de `page`/`limit`, parsing de
 * `categorias` como CSV de UUIDs, trim/escape de `q` e limites de
 * tamanho.
 */
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

    /** Wildcards LIKE `%` são escapados para evitar varredura total. */
    it('escapa percent (%) em q como literal LIKE', () => {
        const result = listMusicasQuerySchema.parse({ q: '50%' });
        expect(result.q).toBe('50\\%');
    });

    /** Wildcards LIKE `_` são escapados para evitar match de single-char. */
    it('escapa underscore (_) em q como literal LIKE', () => {
        const result = listMusicasQuerySchema.parse({ q: 'foo_bar' });
        expect(result.q).toBe('foo\\_bar');
    });

    /** Backslash `\` é escapado para alinhar com o escape default do Postgres LIKE/ILIKE. */
    it('escapa backslash (\\) em q como literal LIKE', () => {
        const result = listMusicasQuerySchema.parse({ q: 'foo\\bar' });
        expect(result.q).toBe('foo\\\\bar');
    });

    /** `\` precedendo outro metacaractere também é escapado individualmente. */
    it('escapa backslash seguido de % preservando ordem', () => {
        const result = listMusicasQuerySchema.parse({ q: '\\%' });
        expect(result.q).toBe('\\\\\\%');
    });

    /** Acentos em português são preservados (busca case/diacritic decidida no backend). */
    it('preserva diacríticos em q', () => {
        const result = listMusicasQuerySchema.parse({ q: 'Ó Senhor' });
        expect(result.q).toBe('Ó Senhor');
    });

    /** `q` excedendo o limite de 200 caracteres é rejeitado. */
    it('rejeita q com mais de 200 caracteres', () => {
        const longQ = 'a'.repeat(201);
        const result = listMusicasQuerySchema.safeParse({ q: longQ });
        expect(result.success).toBe(false);
    });

    /** `q` exatamente no limite (200 caracteres) é aceito. */
    it('aceita q com exatamente 200 caracteres', () => {
        const exactQ = 'a'.repeat(200);
        const result = listMusicasQuerySchema.parse({ q: exactQ });
        expect(result.q).toBe(exactQ);
    });

    /** `categorias` com mais de 50 IDs é rejeitado. */
    it('rejeita categorias com mais de 50 IDs', () => {
        const valid = '550e8400-e29b-41d4-a716-446655440000';
        const csv = Array.from({ length: 51 }, () => valid).join(',');
        const result = listMusicasQuerySchema.safeParse({ categorias: csv });
        expect(result.success).toBe(false);
    });

    /** `categorias` com exatamente 50 IDs é aceito. */
    it('aceita categorias com exatamente 50 IDs', () => {
        const valid = '550e8400-e29b-41d4-a716-446655440000';
        const csv = Array.from({ length: 50 }, () => valid).join(',');
        const result = listMusicasQuerySchema.parse({ categorias: csv });
        expect(result.categorias).toHaveLength(50);
    });

    /** `q` e `categorias` coexistem na mesma requisição. */
    it('aceita q e categorias simultaneamente', () => {
        const id = '550e8400-e29b-41d4-a716-446655440000';
        const result = listMusicasQuerySchema.parse({
            q: 'amor',
            categorias: id,
        });
        expect(result.q).toBe('amor');
        expect(result.categorias).toEqual([id]);
    });
});
