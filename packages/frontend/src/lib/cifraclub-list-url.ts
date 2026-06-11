/**
 * Validação de URLs de listas públicas do CifraClub (frontend).
 * Regex aceita o pattern `/musico/{userId}/repertorio/{listId}/`.
 */

/**
 * Regex de validação para URLs de lista pública do CifraClub.
 *
 * O grupo `(\?[^#]*)?` casa uma query string opcional iniciada por `?` literal
 * (não um `\?` opcional — esse era o bug anterior `(\\?[^#]*)?`, que aceitava
 * qualquer lixo no final da URL sem exigir o `?`). O fragmento `(#.*)?` é opcional.
 */
export const CIFRACLUB_LIST_URL_REGEX =
  /^https:\/\/www\.cifraclub\.com\.br\/musico\/(\d+)\/repertorio\/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)\/?(\?[^#]*)?(#.*)?$/i

const SYSTEM_LIST_SLUGS = new Set([
  'favoritas',
  'consegui-tocar',
  'ainda-vou-tocar',
])

/**
 * Valida uma URL de lista CifraClub e extrai componentes.
 * @param url - URL a validar (pode ser null/undefined/vazio)
 * @returns Objeto com resultado da validação e componentes extraídos
 */
export function validateCifraclubListUrl(url: string | null | undefined): {
  valid: boolean
  userId?: string
  listId?: string
  isSystemList: boolean
} {
  if (!url || url.trim() === '') {
    return { valid: false, isSystemList: false }
  }

  const match = url.trim().match(CIFRACLUB_LIST_URL_REGEX)
  if (!match) {
    return { valid: false, isSystemList: false }
  }

  const userId = match[1]
  const listId = match[2]
  const isSystemList = SYSTEM_LIST_SLUGS.has(listId.toLowerCase())

  return { valid: true, userId, listId, isSystemList }
}

/** Base da API pública do CifraClub usada para buscar previews de listas. */
const CIFRACLUB_API_BASE = 'https://api.cifraclub.com.br/v3'

/** Timeout (ms) da requisição de preview de lista. */
const LIST_PREVIEW_TIMEOUT_MS = 3000

/** Preview de uma lista CifraClub obtida via API pública. */
export interface ListPreview {
  name: string
  ownerName: string
  totalSongs: number
  isPublic: boolean
}

/**
 * Shape mínimo (parcial) da resposta da API de songbook do CifraClub.
 * Tipado explicitamente para evitar acesso a `any` e tornar visível a
 * dependência do formato de terceiros.
 */
interface CifraclubSongbookResponse {
  name?: string
  user?: { name?: string }
  songs?: unknown[]
  isPublic?: boolean
}

/**
 * Busca preview de uma lista CifraClub via API pública.
 * Timeout de 3s. Listas-sistema retornam null. Qualquer erro retorna null.
 * @param url - URL validada de lista CifraClub
 * @param signal - AbortSignal do chamador para cancelamento
 * @returns Preview da lista ou null se indisponível
 */
export async function fetchListPreview(
  url: string,
  signal: AbortSignal,
): Promise<ListPreview | null> {
  const result = validateCifraclubListUrl(url)
  if (!result.valid || !result.listId) return null
  if (result.isSystemList) return null

  // Combina o cancelamento do chamador com um timeout próprio. `AbortSignal.any`
  // + `AbortSignal.timeout` substituem a antiga combinação manual de timers
  // (que tinha um setTimeout morto despachando `abort` no signal do chamador).
  const combinedSignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(LIST_PREVIEW_TIMEOUT_MS),
  ])

  try {
    const response = await fetch(
      `${CIFRACLUB_API_BASE}/songbook/${result.listId}`,
      { signal: combinedSignal },
    )

    if (!response.ok) return null

    const data = (await response.json()) as CifraclubSongbookResponse

    return {
      name: data.name ?? '',
      ownerName: data.user?.name ?? '',
      totalSongs: data.songs?.length ?? 0,
      isPublic: data.isPublic ?? false,
    }
  } catch {
    return null
  }
}
