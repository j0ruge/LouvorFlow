/**
 * Testes unitários do middleware de rate limiting em memória.
 *
 * Valida que requisições até o limite passam (`next`), que exceder o limite
 * lança AppError 429, que a contagem é por IP e que a janela reinicia após
 * `windowMs`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit } from '../../src/middlewares/rateLimit.js';
import { AppError } from '../../src/errors/AppError.js';

/**
 * Cria um objeto de requisição mínimo com o IP informado.
 *
 * @param ip - Endereço IP simulado do cliente.
 * @returns Objeto compatível com `Request` para os campos usados pelo middleware.
 */
function makeReq(ip: string): Request {
    return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

/** Objeto de resposta vazio (não utilizado pelo middleware). */
const res = {} as Response;

/** @group rateLimit */
describe('rateLimit', () => {
    /** Usa timers falsos para controlar a janela de tempo de forma determinística. */
    beforeEach(() => {
        vi.useFakeTimers();
    });

    /** Restaura os timers reais após cada teste. */
    afterEach(() => {
        vi.useRealTimers();
    });

    /** Permite até `max` requisições e lança 429 na requisição seguinte. */
    it('permite até `max` requisições e bloqueia a seguinte com 429', () => {
        const middleware = rateLimit({ windowMs: 60_000, max: 2 });
        const req = makeReq('1.1.1.1');
        const next = vi.fn() as unknown as NextFunction;

        middleware(req, res, next);
        middleware(req, res, next);
        expect(next).toHaveBeenCalledTimes(2);

        expect(() => middleware(req, res, next)).toThrow(AppError);
        try {
            middleware(req, res, next);
        } catch (err) {
            expect((err as AppError).statusCode).toBe(429);
        }
    });

    /** Conta requisições por IP de forma independente. */
    it('conta o limite por IP independentemente', () => {
        const middleware = rateLimit({ windowMs: 60_000, max: 1 });
        const next = vi.fn() as unknown as NextFunction;

        middleware(makeReq('a.a.a.a'), res, next);
        middleware(makeReq('b.b.b.b'), res, next);
        expect(next).toHaveBeenCalledTimes(2);
    });

    /** Reinicia a contagem após a janela `windowMs` expirar. */
    it('reinicia a contagem após a janela expirar', () => {
        const middleware = rateLimit({ windowMs: 1000, max: 1 });
        const req = makeReq('c.c.c.c');
        const next = vi.fn() as unknown as NextFunction;

        middleware(req, res, next);
        vi.advanceTimersByTime(1001);
        middleware(req, res, next);
        expect(next).toHaveBeenCalledTimes(2);
    });
});
