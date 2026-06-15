/**
 * Middleware factory de rate limiting em memória (sem dependências externas).
 *
 * Limita o número de requisições por IP dentro de uma janela de tempo fixa. Foi
 * pensado para proteger rotas públicas sensíveis — em especial a aceitação de
 * convite, que executa `bcrypt.compare` — contra abuso: brute force de senha,
 * enumeração de e-mails e exaustão de CPU.
 *
 * Observação: o estado é por processo. Em deploy multi-instância cada instância
 * mantém sua própria contagem (suficiente para o porte atual; um limiter
 * distribuído via Redis seria necessário em maior escala).
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

/** Opções de configuração do rate limiter. */
interface RateLimitOptions {
    /** Tamanho da janela de contagem em milissegundos. */
    windowMs: number;
    /** Número máximo de requisições permitidas por IP dentro da janela. */
    max: number;
    /** Mensagem retornada no erro HTTP 429 (opcional). */
    message?: string;
}

/** Entrada interna de contagem por IP. */
interface HitEntry {
    /** Número de requisições na janela atual. */
    count: number;
    /** Timestamp (ms) em que a janela atual expira e a contagem reinicia. */
    resetAt: number;
}

/** Limite de chaves no mapa antes de uma varredura de limpeza de entradas expiradas. */
const SWEEP_THRESHOLD = 10_000;

/**
 * Cria um middleware que limita requisições por IP em uma janela de tempo fixa.
 *
 * @param options - Janela, limite e mensagem do limitador.
 * @returns Middleware Express que chama `next()` ou lança `AppError` 429.
 */
export function rateLimit({ windowMs, max, message }: RateLimitOptions) {
    /** Contagens por IP, indexadas pelo endereço do cliente. */
    const hits = new Map<string, HitEntry>();
    /**
     * Timestamp (ms) da última varredura de limpeza. Inicia em 0 para permitir
     * uma primeira varredura imediata assim que o limite de chaves for ultrapassado.
     */
    let lastSweep = 0;

    /**
     * Middleware que contabiliza a requisição do IP e bloqueia ao exceder o limite.
     *
     * @param req - Requisição Express (usa `req.ip` como chave).
     * @param _res - Resposta Express (não utilizada).
     * @param next - Próximo middleware da cadeia.
     * @throws AppError 429 quando o IP excede `max` requisições na janela.
     */
    return (req: Request, _res: Response, next: NextFunction): void => {
        const now = Date.now();
        const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';

        /**
         * Limpeza preguiçosa e espaçada (no máximo uma vez por minuto) para evitar
         * o crescimento ilimitado do mapa sem varrer todas as entradas a cada
         * requisição. Sem o throttle, sob carga com mais de `SWEEP_THRESHOLD` IPs
         * ativos o `Map` permaneceria acima do limite e o loop rodaria em toda
         * requisição, bloqueando o event loop e abrindo espaço para DoS auto-infligido.
         */
        if (hits.size > SWEEP_THRESHOLD && now - lastSweep > 60_000) {
            lastSweep = now;
            for (const [k, v] of hits) {
                if (v.resetAt <= now) hits.delete(k);
            }
        }

        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }

        entry.count += 1;
        if (entry.count > max) {
            throw new AppError(
                message ?? 'Muitas requisições. Tente novamente mais tarde.',
                429,
            );
        }

        next();
    };
}
