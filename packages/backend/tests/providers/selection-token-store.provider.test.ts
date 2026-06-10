/**
 * Testes unitários do store de uso único de selection tokens.
 *
 * Valida que um `jti` só pode ser consumido uma vez (bloqueio de replay),
 * que `jti`s distintos são independentes e que a marca de consumo expira
 * após o TTL, liberando o `jti` novamente.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { consumeSelectionToken } from '../../src/providers/selection-token-store.provider.js';

/** @group selection-token-store */
describe('consumeSelectionToken', () => {
    /** Usa timers falsos para controlar `Date.now()` de forma determinística. */
    beforeEach(() => {
        vi.useFakeTimers();
    });

    /** Restaura os timers reais após cada teste. */
    afterEach(() => {
        vi.useRealTimers();
    });

    /** O primeiro consumo de um jti retorna true e o reuso imediato retorna false. */
    it('permite o primeiro consumo e bloqueia o reuso do mesmo jti', () => {
        const jti = 'jti-unico-1';
        expect(consumeSelectionToken(jti, 300_000)).toBe(true);
        expect(consumeSelectionToken(jti, 300_000)).toBe(false);
    });

    /** jtis diferentes são independentes — cada um pode ser consumido uma vez. */
    it('trata jtis distintos de forma independente', () => {
        expect(consumeSelectionToken('jti-a', 300_000)).toBe(true);
        expect(consumeSelectionToken('jti-b', 300_000)).toBe(true);
    });

    /** Após o TTL expirar, a marca é purgada e o jti pode ser consumido novamente. */
    it('libera o jti novamente após a expiração do TTL', () => {
        const jti = 'jti-expira';
        expect(consumeSelectionToken(jti, 1000)).toBe(true);
        vi.advanceTimersByTime(1001);
        expect(consumeSelectionToken(jti, 1000)).toBe(true);
    });
});
