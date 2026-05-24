/**
 * Validação de URLs de listas públicas do CifraClub.
 * Regex aceita o pattern `/musico/{userId}/repertorio/{listId}/`
 * incluindo listas-sistema (favoritas, consegui-tocar, ainda-vou-tocar),
 * query strings opcionais e fragmentos.
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
