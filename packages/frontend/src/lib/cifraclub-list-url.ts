/**
 * Validação de URLs de listas públicas do CifraClub (frontend).
 * Regex aceita o pattern `/musico/{userId}/repertorio/{listId}/`.
 */

/** Regex de validação para URLs de lista pública do CifraClub */
export const CIFRACLUB_LIST_URL_REGEX =
  /^https:\/\/www\.cifraclub\.com\.br\/musico\/(\d+)\/repertorio\/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)\/?(\\?[^#]*)?(#.*)?$/i

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

/** Preview de uma lista CifraClub obtida via API pública. */
export interface ListPreview {
  name: string
  ownerName: string
  totalSongs: number
  isPublic: boolean
}

/**
 * Busca preview de uma lista CifraClub via API pública.
 * Timeout de 3s. Listas-sistema retornam null. Qualquer erro retorna null.
 * @param url - URL validada de lista CifraClub
 * @param signal - AbortSignal para cancelamento
 * @returns Preview da lista ou null se indisponível
 */
export async function fetchListPreview(
  url: string,
  signal: AbortSignal,
): Promise<ListPreview | null> {
  const result = validateCifraclubListUrl(url)
  if (!result.valid || !result.listId) return null
  if (result.isSystemList) return null

  try {
    const timeoutId = setTimeout(() => signal.dispatchEvent(new Event('abort')), 3000)
    const controller = new AbortController()
    const combinedSignal = signal.aborted ? signal : controller.signal

    signal.addEventListener('abort', () => controller.abort())
    const timeoutHandle = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://api.cifraclub.com.br/v3/songbook/${result.listId}`,
      { signal: combinedSignal },
    )

    clearTimeout(timeoutId)
    clearTimeout(timeoutHandle)

    if (!response.ok) return null

    const data = await response.json()

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
