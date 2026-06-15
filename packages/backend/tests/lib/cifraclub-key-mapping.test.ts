import { describe, it, expect } from 'vitest'
import {
  computeKeyFragment,
  applyKeyFragment,
  CHROMATIC_MAP,
} from '../../src/lib/cifraclub-key-mapping'

/** Testes do mapeamento cromático para transposição CifraClub */
describe('cifraclub-key-mapping', () => {
  /** Testes da função computeKeyFragment */
  describe('computeKeyFragment', () => {
    /** Deve mapear todos os 12 tons canônicos corretamente */
    it('mapeia os 12 tons canônicos', () => {
      const expected: [string, number][] = [
        ['A', 0], ['Bb', 1], ['B', 2], ['C', 3],
        ['Db', 4], ['D', 5], ['Eb', 6], ['E', 7],
        ['F', 8], ['F#', 9], ['G', 10], ['Ab', 11],
      ]
      for (const [tom, N] of expected) {
        expect(computeKeyFragment(tom)).toEqual({ N, tomFinal: tom })
      }
    })

    /** Deve normalizar enarmônicos para grafia canônica CifraClub */
    it('normaliza enarmônicos', () => {
      expect(computeKeyFragment('A#')).toEqual({ N: 1, tomFinal: 'Bb' })
      expect(computeKeyFragment('C#')).toEqual({ N: 4, tomFinal: 'Db' })
      expect(computeKeyFragment('D#')).toEqual({ N: 6, tomFinal: 'Eb' })
      expect(computeKeyFragment('Gb')).toEqual({ N: 9, tomFinal: 'F#' })
      expect(computeKeyFragment('G#')).toEqual({ N: 11, tomFinal: 'Ab' })
    })

    /** Deve extrair nota raiz ignorando sufixos modais */
    it('ignora sufixos modais (m, maj7, /A)', () => {
      expect(computeKeyFragment('Am')).toEqual({ N: 0, tomFinal: 'A' })
      expect(computeKeyFragment('C#m')).toEqual({ N: 4, tomFinal: 'Db' })
      expect(computeKeyFragment('Fmaj7')).toEqual({ N: 8, tomFinal: 'F' })
      expect(computeKeyFragment('F/A')).toEqual({ N: 8, tomFinal: 'F' })
      expect(computeKeyFragment('Dm7')).toEqual({ N: 5, tomFinal: 'D' })
    })

    /** Deve normalizar caracteres Unicode ♭ e ♯ */
    it('normaliza Unicode ♭/♯', () => {
      expect(computeKeyFragment('E♭')).toEqual({ N: 6, tomFinal: 'Eb' })
      expect(computeKeyFragment('F♯')).toEqual({ N: 9, tomFinal: 'F#' })
      expect(computeKeyFragment('A♯m')).toEqual({ N: 1, tomFinal: 'Bb' })
    })

    /** Deve retornar null para entradas inválidas */
    it('retorna null para entradas inválidas', () => {
      expect(computeKeyFragment(null)).toBeNull()
      expect(computeKeyFragment(undefined)).toBeNull()
      expect(computeKeyFragment('')).toBeNull()
      expect(computeKeyFragment('   ')).toBeNull()
      expect(computeKeyFragment('X')).toBeNull()
      expect(computeKeyFragment('??')).toBeNull()
      expect(computeKeyFragment('123')).toBeNull()
    })

    /** Deve aceitar tons em lowercase */
    it('aceita lowercase', () => {
      expect(computeKeyFragment('a')).toEqual({ N: 0, tomFinal: 'A' })
      expect(computeKeyFragment('bb')).toEqual({ N: 1, tomFinal: 'Bb' })
      expect(computeKeyFragment('f#')).toEqual({ N: 9, tomFinal: 'F#' })
    })
  })

  /** Testes da função applyKeyFragment */
  describe('applyKeyFragment', () => {
    /** Deve anexar #key=N em URLs do CifraClub */
    it('anexa #key=N em URL cifraclub.com.br', () => {
      const result = applyKeyFragment(
        'https://www.cifraclub.com.br/aline-barros/rendido-estou/',
        'A',
      )
      expect(result.url).toBe(
        'https://www.cifraclub.com.br/aline-barros/rendido-estou/#key=0',
      )
      expect(result.tomAjustado).toBe(true)
    })

    /** Deve não alterar URLs de outros domínios */
    it('não altera URL de outro domínio', () => {
      const youtubeUrl = 'https://www.youtube.com/watch?v=abc123'
      const result = applyKeyFragment(youtubeUrl, 'A')
      expect(result.url).toBe(youtubeUrl)
      expect(result.tomAjustado).toBe(false)
    })

    /** Deve substituir fragmento pré-existente */
    it('substitui fragmento pré-existente', () => {
      const result = applyKeyFragment(
        'https://www.cifraclub.com.br/artista/musica/#key=3',
        'G',
      )
      expect(result.url).toBe(
        'https://www.cifraclub.com.br/artista/musica/#key=10',
      )
      expect(result.tomAjustado).toBe(true)
    })

    /** Deve preservar query string ao aplicar fragmento */
    it('preserva query string', () => {
      const result = applyKeyFragment(
        'https://www.cifraclub.com.br/artista/musica/?utm=share#old',
        'C',
      )
      expect(result.url).toBe(
        'https://www.cifraclub.com.br/artista/musica/?utm=share#key=3',
      )
      expect(result.tomAjustado).toBe(true)
    })

    /** Deve retornar tomAjustado=false quando tom é inválido */
    it('retorna tomAjustado=false para tom inválido', () => {
      const url = 'https://www.cifraclub.com.br/artista/musica/'
      const result = applyKeyFragment(url, 'X')
      expect(result.url).toBe(url)
      expect(result.tomAjustado).toBe(false)
    })

    /** Deve retornar tomAjustado=false para tom null */
    it('retorna tomAjustado=false para tom null', () => {
      const url = 'https://www.cifraclub.com.br/artista/musica/'
      const result = applyKeyFragment(url, null)
      expect(result.url).toBe(url)
      expect(result.tomAjustado).toBe(false)
    })
  })
})
