/**
 * Testes unitários dos schemas Zod do módulo de eventos.
 *
 * Cobre o body do PATCH de tonalidade da música na escala
 * (`fk_tonalidade`: UUID ou `null`) e os params das rotas de
 * junção evento-música.
 */

import {
    eventoMusicaParamsSchema,
    setMusicaTonalidadeBodySchema,
} from '../../src/validators/eventos.validators.js';

/** UUID sintaticamente válido reutilizado nos cenários positivos. */
const UUID_VALIDO = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Valida o schema do body de `PATCH /api/eventos/:eventoId/musicas/:musicaId/tonalidade`:
 * `fk_tonalidade` obrigatório, aceitando UUID (define o tom da escala) ou
 * `null` (volta ao tom global da música).
 */
describe('setMusicaTonalidadeBodySchema', () => {
    /** UUID válido define o tom próprio da escala. */
    it('aceita fk_tonalidade com UUID válido', () => {
        const result = setMusicaTonalidadeBodySchema.parse({ fk_tonalidade: UUID_VALIDO });
        expect(result.fk_tonalidade).toBe(UUID_VALIDO);
    });

    /** `null` é o valor que remove o override e volta ao tom global. */
    it('aceita fk_tonalidade null (volta ao tom global)', () => {
        const result = setMusicaTonalidadeBodySchema.parse({ fk_tonalidade: null });
        expect(result.fk_tonalidade).toBeNull();
    });

    /** String que não é UUID é rejeitada. */
    it('rejeita fk_tonalidade que não é UUID', () => {
        const result = setMusicaTonalidadeBodySchema.safeParse({ fk_tonalidade: 'nao-e-uuid' });
        expect(result.success).toBe(false);
    });

    /** Campo ausente é rejeitado — o cliente deve ser explícito (UUID ou null). */
    it('rejeita body sem fk_tonalidade', () => {
        const result = setMusicaTonalidadeBodySchema.safeParse({});
        expect(result.success).toBe(false);
    });

    /** `undefined` explícito também é rejeitado (nullable ≠ optional). */
    it('rejeita fk_tonalidade undefined', () => {
        const result = setMusicaTonalidadeBodySchema.safeParse({ fk_tonalidade: undefined });
        expect(result.success).toBe(false);
    });

    /** Tipos não-string (número) são rejeitados. */
    it('rejeita fk_tonalidade numérico', () => {
        const result = setMusicaTonalidadeBodySchema.safeParse({ fk_tonalidade: 123 });
        expect(result.success).toBe(false);
    });

    /** String vazia não é UUID e é rejeitada. */
    it('rejeita fk_tonalidade string vazia', () => {
        const result = setMusicaTonalidadeBodySchema.safeParse({ fk_tonalidade: '' });
        expect(result.success).toBe(false);
    });

    /** Chaves desconhecidas são descartadas pelo parse (comportamento padrão do z.object). */
    it('descarta chaves desconhecidas do body', () => {
        const result = setMusicaTonalidadeBodySchema.parse({
            fk_tonalidade: null,
            extra: 'ignorado',
        });
        expect(result).toEqual({ fk_tonalidade: null });
    });
});

/**
 * Valida o schema dos params das rotas de junção evento-música
 * (`eventoId` e `musicaId` como UUIDs obrigatórios).
 */
describe('eventoMusicaParamsSchema', () => {
    /** Par de UUIDs válidos passa na validação. */
    it('aceita eventoId e musicaId com UUIDs válidos', () => {
        const result = eventoMusicaParamsSchema.parse({
            eventoId: UUID_VALIDO,
            musicaId: UUID_VALIDO,
        });
        expect(result.eventoId).toBe(UUID_VALIDO);
        expect(result.musicaId).toBe(UUID_VALIDO);
    });

    /** eventoId inválido é rejeitado. */
    it('rejeita eventoId que não é UUID', () => {
        const result = eventoMusicaParamsSchema.safeParse({
            eventoId: 'abc',
            musicaId: UUID_VALIDO,
        });
        expect(result.success).toBe(false);
    });

    /** musicaId inválido é rejeitado. */
    it('rejeita musicaId que não é UUID', () => {
        const result = eventoMusicaParamsSchema.safeParse({
            eventoId: UUID_VALIDO,
            musicaId: 'abc',
        });
        expect(result.success).toBe(false);
    });

    /** Ausência de qualquer um dos params é rejeitada. */
    it('rejeita params incompletos', () => {
        const result = eventoMusicaParamsSchema.safeParse({ eventoId: UUID_VALIDO });
        expect(result.success).toBe(false);
    });
});
