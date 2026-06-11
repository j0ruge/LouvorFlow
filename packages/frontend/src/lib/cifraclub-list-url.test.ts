import { describe, it, expect } from "vitest";
import { validateCifraclubListUrl } from "./cifraclub-list-url";

/** Testes da validação de URLs de lista pública do CifraClub (frontend). */
describe("cifraclub-list-url (frontend)", () => {
  /** Testes da função validateCifraclubListUrl. */
  describe("validateCifraclubListUrl", () => {
    /** Deve aceitar URLs custom válidas e extrair userId/listId. */
    it("aceita URL custom válida", () => {
      const result = validateCifraclubListUrl(
        "https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/",
      );
      expect(result.valid).toBe(true);
      expect(result.userId).toBe("539475470");
      expect(result.listId).toBe("12339923");
      expect(result.isSystemList).toBe(false);
    });

    /** Deve aceitar listas-sistema (favoritas, consegui-tocar, ainda-vou-tocar). */
    it("aceita listas-sistema", () => {
      for (const slug of ["favoritas", "consegui-tocar", "ainda-vou-tocar"]) {
        const result = validateCifraclubListUrl(
          `https://www.cifraclub.com.br/musico/123/repertorio/${slug}/`,
        );
        expect(result.valid).toBe(true);
        expect(result.isSystemList).toBe(true);
        expect(result.listId).toBe(slug);
      }
    });

    /** Deve aceitar query string e fragmento opcionais. */
    it("aceita query string e fragmento", () => {
      expect(
        validateCifraclubListUrl(
          "https://www.cifraclub.com.br/musico/123/repertorio/456/?utm=share",
        ).valid,
      ).toBe(true);
      expect(
        validateCifraclubListUrl(
          "https://www.cifraclub.com.br/musico/123/repertorio/456/#frag",
        ).valid,
      ).toBe(true);
    });

    /**
     * Regressão do bug do regex `(\\?[^#]*)?`: lixo no final da URL (sem `?`)
     * NÃO pode ser aceito. Antes da correção, `.../456/junkdata` validava.
     */
    it("rejeita lixo no final da URL (sem query string)", () => {
      expect(
        validateCifraclubListUrl(
          "https://www.cifraclub.com.br/musico/123/repertorio/456/junkdata",
        ).valid,
      ).toBe(false);
      expect(
        validateCifraclubListUrl(
          "https://www.cifraclub.com.br/musico/123/repertorio/456junk",
        ).valid,
      ).toBe(false);
    });

    /** Deve rejeitar outros domínios, http e valores vazios. */
    it("rejeita domínios inválidos, http e vazios", () => {
      expect(
        validateCifraclubListUrl(
          "http://www.cifraclub.com.br/musico/123/repertorio/456/",
        ).valid,
      ).toBe(false);
      expect(
        validateCifraclubListUrl(
          "https://evil.com/musico/123/repertorio/456/",
        ).valid,
      ).toBe(false);
      expect(validateCifraclubListUrl(null).valid).toBe(false);
      expect(validateCifraclubListUrl(undefined).valid).toBe(false);
      expect(validateCifraclubListUrl("").valid).toBe(false);
      expect(validateCifraclubListUrl("   ").valid).toBe(false);
    });
  });
});
