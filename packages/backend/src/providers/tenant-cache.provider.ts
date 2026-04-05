/**
 * Provider de cache em memória para status de tenants.
 *
 * Centraliza o cache de status de tenant para evitar queries repetidas ao banco.
 * Usado pelo middleware de autenticação (consulta) e pelo service de igrejas (invalidação).
 */

/**
 * Duração do cache de status de tenant em milissegundos.
 * Configurável via variável de ambiente `TENANT_CACHE_TTL_MS` (padrão: 60000ms).
 */
const TENANT_CACHE_TTL = Number(process.env.TENANT_CACHE_TTL_MS) || 60_000;

/** Entrada do cache de status de tenant. */
interface TenantStatusCacheEntry {
    /** Status do tenant (ex: 'active', 'inactive'). */
    status: string;
    /** Timestamp de expiração em milissegundos (Date.now() + TTL). */
    expiry: number;
}

/**
 * Cache em memória do status de tenant indexado por tenantId.
 * Entradas expiram após TENANT_CACHE_TTL milissegundos.
 */
const tenantStatusCache = new Map<string, TenantStatusCacheEntry>();

/**
 * Retorna o status do tenant a partir do cache, se a entrada ainda for válida.
 *
 * @param tenantId - UUID do tenant a consultar.
 * @returns Status do tenant (string) ou `null` se não estiver em cache ou expirado.
 */
export function getCachedTenantStatus(tenantId: string): string | null {
    const cached = tenantStatusCache.get(tenantId);
    if (cached && cached.expiry > Date.now()) return cached.status;
    tenantStatusCache.delete(tenantId);
    return null;
}

/**
 * Armazena o status do tenant no cache com TTL configurável.
 *
 * @param tenantId - UUID do tenant.
 * @param status - Status a armazenar.
 */
export function cacheTenantStatus(tenantId: string, status: string): void {
    tenantStatusCache.set(tenantId, { status, expiry: Date.now() + TENANT_CACHE_TTL });
}

/**
 * Invalida a entrada do cache de status de um tenant específico.
 *
 * Deve ser chamado quando o status de um tenant muda (ex.: desativação)
 * para evitar que requisições subsequentes usem o status obsoleto em cache.
 *
 * @param tenantId - UUID do tenant a invalidar.
 */
export function invalidateTenantCache(tenantId: string): void {
    tenantStatusCache.delete(tenantId);
}
