import { describe, it, expect } from "vitest";
import { formatCifraclubListShare } from "./cifraclub-list-share";

/** Testes do formatador de share da lista CifraClub para WhatsApp. */
describe("cifraclub-list-share", () => {
  /** Deve incluir tipo do evento, URL da lista e microcopy na mensagem. */
  it("formata a mensagem com header, URL e microcopy", () => {
    const texto = formatCifraclubListShare({
      tipo_evento: "Culto de Domingo",
      data: "2026-06-14T19:30:00.000Z",
      cifraclub_list_url:
        "https://www.cifraclub.com.br/musico/123/repertorio/456/",
    });

    expect(texto).toContain("*Culto de Domingo*");
    expect(texto).toContain(
      "🎸 *Lista no CifraClub*: https://www.cifraclub.com.br/musico/123/repertorio/456/",
    );
    expect(texto).toContain("_Toque para abrir no app do CifraClub._");
  });

  /** Deve produzir uma mensagem multilinha (header + URL + microcopy). */
  it("produz mensagem multilinha", () => {
    const texto = formatCifraclubListShare({
      tipo_evento: "Ensaio",
      data: "2026-06-14T19:30:00.000Z",
      cifraclub_list_url:
        "https://www.cifraclub.com.br/musico/1/repertorio/favoritas/",
    });

    expect(texto.split("\n").length).toBeGreaterThan(1);
  });
});
