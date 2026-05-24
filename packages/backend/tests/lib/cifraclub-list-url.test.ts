import { describe, it, expect } from 'vitest'
import {
  validateCifraclubListUrl,
  CIFRACLUB_LIST_URL_REGEX,
} from '../../src/lib/cifraclub-list-url'

/** Testes da validação de URLs de lista pública do CifraClub */
describe('cifraclub-list-url', () => {
  /** Testes da função validateCifraclubListUrl */
  describe('validateCifraclubListUrl', () => {
    /** Deve aceitar URLs custom válidas */
    it('aceita URLs custom válidas', () => {
      const result = validateCifraclubListUrl(
        'https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/',
      )
      expect(result.valid).toBe(true)
      expect(result.userId).toBe('539475470')
      expect(result.listId).toBe('12339923')
      expect(result.isSystemList).toBe(false)
    })

    /** Deve aceitar URLs sem barra final */
    it('aceita URL sem barra final', () => {
      const result = validateCifraclubListUrl(
        'https://www.cifraclub.com.br/musico/123/repertorio/456',
      )
      expect(result.valid).toBe(true)
      expect(result.userId).toBe('123')
      expect(result.listId).toBe('456')
    })

    /** Deve aceitar listas-sistema */
    it('aceita listas-sistema', () => {
      const slugs = ['favoritas', 'consegui-tocar', 'ainda-vou-tocar']
      for (const slug of slugs) {
        const result = validateCifraclubListUrl(
          `https://www.cifraclub.com.br/musico/123/repertorio/${slug}/`,
        )
        expect(result.valid).toBe(true)
        expect(result.isSystemList).toBe(true)
        expect(result.listId).toBe(slug)
      }
    })

    /** Deve aceitar URLs com query string */
    it('aceita URL com query string', () => {
      const result = validateCifraclubListUrl(
        'https://www.cifraclub.com.br/musico/123/repertorio/456/?utm=share',
      )
      expect(result.valid).toBe(true)
    })

    /** Deve aceitar URLs com fragmento */
    it('aceita URL com fragmento', () => {
      const result = validateCifraclubListUrl(
        'https://www.cifraclub.com.br/musico/123/repertorio/456/#section',
      )
      expect(result.valid).toBe(true)
    })

    /** Deve aceitar URLs com query + fragmento */
    it('aceita URL com query + fragmento', () => {
      const result = validateCifraclubListUrl(
        'https://www.cifraclub.com.br/musico/123/repertorio/456/?utm=x#frag',
      )
      expect(result.valid).toBe(true)
    })

    /** Deve ser case-insensitive */
    it('aceita casing variado (case-insensitive)', () => {
      const result = validateCifraclubListUrl(
        'https://WWW.CifraCLUB.COM.BR/musico/123/repertorio/456/',
      )
      expect(result.valid).toBe(true)
    })

    /** Deve rejeitar URLs de outros domínios */
    it('rejeita URLs de outros domínios', () => {
      expect(
        validateCifraclubListUrl('https://www.cifras.com.br/musico/123/repertorio/456/').valid,
      ).toBe(false)
      expect(
        validateCifraclubListUrl('https://www.youtube.com/watch?v=abc').valid,
      ).toBe(false)
    })

    /** Deve rejeitar URLs sem www */
    it('rejeita URL sem www', () => {
      expect(
        validateCifraclubListUrl('https://cifraclub.com.br/musico/123/repertorio/456/').valid,
      ).toBe(false)
    })

    /** Deve rejeitar URLs com http (sem s) */
    it('rejeita URL http (sem TLS)', () => {
      expect(
        validateCifraclubListUrl('http://www.cifraclub.com.br/musico/123/repertorio/456/').valid,
      ).toBe(false)
    })

    /** Deve retornar inválido para null/undefined/vazio */
    it('retorna inválido para valores vazios', () => {
      expect(validateCifraclubListUrl(null).valid).toBe(false)
      expect(validateCifraclubListUrl(undefined).valid).toBe(false)
      expect(validateCifraclubListUrl('').valid).toBe(false)
      expect(validateCifraclubListUrl('   ').valid).toBe(false)
    })

    /** Deve rejeitar URLs com path extra ou formato errado */
    it('rejeita paths fora do padrão', () => {
      expect(
        validateCifraclubListUrl('https://www.cifraclub.com.br/artista/musica/').valid,
      ).toBe(false)
      expect(
        validateCifraclubListUrl('https://www.cifraclub.com.br/musico/abc/repertorio/456/').valid,
      ).toBe(false)
    })
  })
})
