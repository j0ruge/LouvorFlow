/**
 * Store em memória de selection tokens já consumidos (garantia de uso único).
 *
 * O selection_token é emitido no login multi-tenant e trocado por uma sessão no
 * endpoint de seleção de tenant. Sem controle de uso único, o token poderia ser
 * reapresentado (replay) dentro da sua validade (5 min) para emitir várias sessões.
 * Este store registra o `jti` (identificador único do token) no momento em que ele
 * é consumido, rejeitando qualquer reuso subsequente.
 *
 * Observação: o estado é por processo. Para o porte atual (ministério/igreja, uma
 * instância) é suficiente; um deploy multi-instância exigiria um store distribuído
 * (ex.: Redis) compartilhado entre as instâncias.
 */

/** Mapa `jti` → timestamp (ms) de expiração da marca de consumo. */
const consumedTokens = new Map<string, number>();

/** Acima deste tamanho, a varredura de expirados passa a ser disparada. */
const PURGE_SIZE_THRESHOLD = 500;

/** Intervalo mínimo (ms) entre varreduras de expirados. */
const PURGE_MIN_INTERVAL_MS = 60_000;

/** Timestamp (ms) da última varredura de expirados. */
let lastPurge = 0;

/**
 * Remove marcas de consumo já expiradas para limitar o crescimento do mapa.
 *
 * @param now - Timestamp atual em milissegundos.
 */
function purgeExpired(now: number): void {
    for (const [jti, expiry] of consumedTokens) {
        if (expiry <= now) consumedTokens.delete(jti);
    }
}

/**
 * Marca um selection token como consumido de forma atômica.
 *
 * A verificação e a marcação ocorrem de forma síncrona (sem `await` intermediário),
 * funcionando como trava: em requisições concorrentes com o mesmo token, apenas a
 * primeira obtém `true`.
 *
 * A expiração é verificada inline (uma marca expirada permite novo consumo), então
 * a varredura O(n) de expirados é apenas otimização de memória — disparada de forma
 * espaçada (acima de `PURGE_SIZE_THRESHOLD` e no máximo a cada `PURGE_MIN_INTERVAL_MS`)
 * para não pagar custo O(n) em toda chamada, como em `rateLimit.ts`.
 *
 * @param jti - Identificador único do selection token (claim `jti`).
 * @param ttlMs - Tempo de vida da marca de consumo (deve cobrir a validade do token).
 * @returns `true` se este foi o primeiro consumo; `false` se o token já fora usado.
 */
export function consumeSelectionToken(jti: string, ttlMs: number): boolean {
    const now = Date.now();

    if (consumedTokens.size > PURGE_SIZE_THRESHOLD && now - lastPurge > PURGE_MIN_INTERVAL_MS) {
        lastPurge = now;
        purgeExpired(now);
    }

    const expiry = consumedTokens.get(jti);
    // Marca ainda válida → replay bloqueado. Marca expirada ou ausente → consome.
    if (expiry !== undefined && expiry > now) return false;

    consumedTokens.set(jti, now + ttlMs);
    return true;
}
