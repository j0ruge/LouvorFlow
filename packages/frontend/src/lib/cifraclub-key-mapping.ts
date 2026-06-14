/**
 * Mapeamento cromático para transposição de tom no CifraClub.
 * Converte nota musical (A..G com modificadores) para o índice `#key=N`
 * usado pelo CifraClub para abrir cifras já transpostas.
 *
 * Porto fiel da lógica pura do backend (`packages/backend/src/lib/cifraclub-key-mapping.ts`),
 * sem dependências — manter sincronizado ao alterar o backend.
 */

/** Tabela cromática absoluta: nota canônica CifraClub → índice 0..11 */
export const CHROMATIC_MAP: Readonly<Record<string, number>> = {
  A: 0,
  Bb: 1,
  B: 2,
  C: 3,
  Db: 4,
  D: 5,
  Eb: 6,
  E: 7,
  F: 8,
  'F#': 9,
  G: 10,
  Ab: 11,
}

/** Mapeamento de enarmônicos para a grafia canônica do CifraClub */
export const ENHARMONIC_MAP: Readonly<Record<string, string>> = {
  'A#': 'Bb',
  'C#': 'Db',
  'D#': 'Eb',
  Gb: 'F#',
  'G#': 'Ab',
}

/**
 * Calcula o fragmento `#key=N` a partir de uma string de tom.
 * @param tom - String de tonalidade (ex.: "A", "Bbm", "C#m/E", "F♯")
 * @returns Objeto com N (0..11) e tomFinal (grafia canônica), ou null se inválido
 */
export function computeKeyFragment(
  tom: string | null | undefined,
): { N: number; tomFinal: string } | null {
  if (!tom || tom.trim() === '') return null

  const normalized = tom.trim().replace(/♭/g, 'b').replace(/♯/g, '#')

  const match = normalized.match(/^([A-Ga-g][#b]?)/)
  if (!match) return null

  let root = match[1]
  root = root[0].toUpperCase() + root.slice(1)

  if (ENHARMONIC_MAP[root]) {
    root = ENHARMONIC_MAP[root]
  }

  const N = CHROMATIC_MAP[root]
  if (N === undefined) return null

  return { N, tomFinal: root }
}

/**
 * Aplica o fragmento `#key=N` a uma URL de cifra, se o domínio for cifraclub.com.br.
 * @param url - URL completa da cifra
 * @param tom - Tom para cálculo do fragmento
 * @returns URL processada e flag indicando se o tom foi ajustado
 */
export function applyKeyFragment(
  url: string,
  tom: string | null | undefined,
): { url: string; tomAjustado: boolean } {
  if (!url) return { url, tomAjustado: false }

  // Valida o host real (não substring): aceita apenas o domínio oficial
  // `cifraclub.com.br` ou seus subdomínios (`.cifraclub.com.br`). Rejeita bypasses
  // por prefixo (`fakecifraclub.com.br`) e substring (`evil.com?x=cifraclub.com.br`).
  // URLs malformadas são ignoradas.
  let isCifraClub = false
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    isCifraClub = hostname === 'cifraclub.com.br' || hostname.endsWith('.cifraclub.com.br')
  } catch {
    return { url, tomAjustado: false }
  }
  if (!isCifraClub) return { url, tomAjustado: false }

  const result = computeKeyFragment(tom)
  if (!result) return { url, tomAjustado: false }

  const hashIndex = url.indexOf('#')
  const queryIndex = url.indexOf('?')

  let base: string
  let query = ''

  if (queryIndex !== -1) {
    base = url.substring(0, queryIndex)
    const endOfQuery = hashIndex > queryIndex ? hashIndex : url.length
    query = url.substring(queryIndex, endOfQuery)
  } else if (hashIndex !== -1) {
    base = url.substring(0, hashIndex)
  } else {
    base = url
  }

  return {
    url: `${base}${query}#key=${result.N}`,
    tomAjustado: true,
  }
}
