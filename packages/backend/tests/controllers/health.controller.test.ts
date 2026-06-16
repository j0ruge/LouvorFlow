import { describe, it, expect, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import healthController from '../../src/controllers/health.controller.js';

/**
 * Cria um Response falso que captura o status HTTP e o corpo JSON enviados,
 * encadeando `status().json()` como o Express real.
 * @returns Objeto com o `res` falso e os valores capturados.
 */
function createFakeResponse(): { res: Response; captured: { status?: number; body?: unknown } } {
    const captured: { status?: number; body?: unknown } = {};
    const res = {
        status(code: number) {
            captured.status = code;
            return this;
        },
        json(payload: unknown) {
            captured.body = payload;
            return this;
        },
    } as unknown as Response;
    return { res, captured };
}

/** Suite de testes unitários para o HealthController. */
describe('HealthController', () => {
    const ORIGINAL_GIT_SHA = process.env.GIT_SHA;

    /** Restaura a env `GIT_SHA` após cada teste para isolar os casos. */
    afterEach(() => {
        if (ORIGINAL_GIT_SHA === undefined) delete process.env.GIT_SHA;
        else process.env.GIT_SHA = ORIGINAL_GIT_SHA;
    });

    /** Deve responder 200 com status 'ok' e o SHA vindo de `GIT_SHA`. */
    it('deve retornar 200 com status ok e o sha do build', () => {
        process.env.GIT_SHA = 'abc1234';
        const { res, captured } = createFakeResponse();

        healthController.index({} as Request, res);

        expect(captured.status).toBe(200);
        expect(captured.body).toMatchObject({ status: 'ok', sha: 'abc1234' });
        expect(typeof (captured.body as { timestamp: string }).timestamp).toBe('string');
    });

    /** Deve retornar sha 'unknown' quando `GIT_SHA` não está definido. */
    it("deve retornar sha 'unknown' quando GIT_SHA ausente", () => {
        delete process.env.GIT_SHA;
        const { res, captured } = createFakeResponse();

        healthController.index({} as Request, res);

        expect(captured.status).toBe(200);
        expect(captured.body).toMatchObject({ status: 'ok', sha: 'unknown' });
    });
});
