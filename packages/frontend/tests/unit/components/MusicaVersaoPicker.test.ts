/**
 * Testes unitários para a função selectDefaultVersaoId do MusicaVersaoPicker.
 *
 * Cobre as regras de auto-seleção de versão de música em uma escala,
 * incluindo cenários de 0, 1 e múltiplas versões, seleção válida,
 * e seleção stale (versão removida).
 */

import { describe, it, expect } from "vitest";
import { selectDefaultVersaoId } from "@/components/MusicaVersaoPicker";
import type { VersaoMusica } from "@/schemas/evento";

/** Fábrica auxiliar para criar versões de teste. */
function criarVersao(overrides: Partial<VersaoMusica> = {}): VersaoMusica {
  return {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    artista_nome: "Artista Teste",
    link_versao: "https://example.com",
    ...overrides,
  };
}

describe("selectDefaultVersaoId", () => {
  it("retorna o id da versão quando há exatamente uma versão e current é null", () => {
    const versao = criarVersao({ id: "v1" });
    const resultado = selectDefaultVersaoId([versao], null);
    expect(resultado).toBe("v1");
  });

  it("retorna null quando não há versões disponíveis", () => {
    const resultado = selectDefaultVersaoId([], null);
    expect(resultado).toBeNull();
  });

  it("retorna null quando não há versões disponíveis mesmo com current preenchido", () => {
    const current = criarVersao({ id: "v-stale" });
    const resultado = selectDefaultVersaoId([], current);
    expect(resultado).toBeNull();
  });

  it("retorna null quando há múltiplas versões e current é null (não adivinha)", () => {
    const versoes = [
      criarVersao({ id: "v1", artista_nome: "Artista 1" }),
      criarVersao({ id: "v2", artista_nome: "Artista 2" }),
    ];
    const resultado = selectDefaultVersaoId(versoes, null);
    expect(resultado).toBeNull();
  });

  it("retorna o id da seleção atual quando ela existe nas versões disponíveis", () => {
    const versoes = [
      criarVersao({ id: "v1", artista_nome: "Artista 1" }),
      criarVersao({ id: "v2", artista_nome: "Artista 2" }),
      criarVersao({ id: "v3", artista_nome: "Artista 3" }),
    ];
    const current = criarVersao({ id: "v2", artista_nome: "Artista 2" });
    const resultado = selectDefaultVersaoId(versoes, current);
    expect(resultado).toBe("v2");
  });

  it("retorna null quando a seleção atual não existe mais nas versões (stale)", () => {
    const versoes = [
      criarVersao({ id: "v1", artista_nome: "Artista 1" }),
      criarVersao({ id: "v3", artista_nome: "Artista 3" }),
    ];
    const current = criarVersao({ id: "v-removida", artista_nome: "Removida" });
    const resultado = selectDefaultVersaoId(versoes, current);
    expect(resultado).toBeNull();
  });

  it("retorna o id da única versão quando current é null e versão tem artista_nome null", () => {
    const versao = criarVersao({ id: "v1", artista_nome: null });
    const resultado = selectDefaultVersaoId([versao], null);
    expect(resultado).toBe("v1");
  });

  it("preserva seleção atual válida mesmo com apenas uma versão disponível", () => {
    const versao = criarVersao({ id: "v1" });
    const current = criarVersao({ id: "v1" });
    const resultado = selectDefaultVersaoId([versao], current);
    expect(resultado).toBe("v1");
  });
});
