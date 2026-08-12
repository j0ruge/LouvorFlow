/**
 * Suite de testes para os utilitários de `lib/utils.ts`.
 *
 * Cobre as funções puras que merecem teste explícito:
 * - `formatDateBlock`: extração de dia/mês PT-BR de ISO 8601 (timezone local)
 * - `handleClickableKeyDown`: helper de a11y para Enter/Space em role=button
 * - `getInitials`: iniciais de nome para avatares
 * - `isSafeRedirect` / `isSafeUrl`: validações de URL contra XSS/open redirect
 */

import type React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  formatDateBlock,
  formatDataExtenso,
  handleClickableKeyDown,
  getInitials,
  isSafeRedirect,
  isSafeUrl,
  MESES_ABREV,
  normalizeForSearch,
} from "@/lib/utils";

describe("formatDateBlock", () => {
  /** Garante que datas com hora explícita sejam formatadas no fuso local. */
  it("retorna dia e mês em PT-BR para data ISO com horário", () => {
    const result = formatDateBlock("2026-04-25T14:00:00");
    expect(result.dia).toBe(25);
    expect(result.mes).toBe("Abr");
  });

  /** Garante que cada índice de mês mapeia corretamente para a abreviação. */
  it("mapeia todos os meses do ano corretamente", () => {
    for (let m = 0; m < 12; m++) {
      const date = new Date(2026, m, 15, 12, 0, 0);
      const result = formatDateBlock(date.toISOString());
      expect(result.dia).toBe(15);
      expect(result.mes).toBe(MESES_ABREV[m]);
    }
  });

  /** Garante que dia 1 e dia 31 são preservados sem padding. */
  it("preserva dia 1 e dia 31 sem padding", () => {
    expect(formatDateBlock("2026-01-01T12:00:00").dia).toBe(1);
    expect(formatDateBlock("2026-01-31T12:00:00").dia).toBe(31);
  });

  /** Confirma que MESES_ABREV tem exatamente 12 entradas. */
  it("MESES_ABREV contém os 12 meses do ano", () => {
    expect(MESES_ABREV).toHaveLength(12);
    expect(MESES_ABREV[0]).toBe("Jan");
    expect(MESES_ABREV[11]).toBe("Dez");
  });

  /** Para ISO inválido devolve fallback NaN/"" em vez de undefined no DOM. */
  it("retorna fallback {NaN, ''} para data inválida", () => {
    const result = formatDateBlock("not a date");
    expect(Number.isNaN(result.dia)).toBe(true);
    expect(result.mes).toBe("");
  });

  /** Strings date-only não devem deslocar de um dia em fusos ocidentais. */
  it("usa UTC getters para date-only ISO (YYYY-MM-DD)", () => {
    const result = formatDateBlock("2026-03-27");
    expect(result.dia).toBe(27);
    expect(result.mes).toBe("Mar");
  });
});

describe("handleClickableKeyDown", () => {
  /** Garante que Enter dispara a action e previne o default. */
  it("dispara action ao pressionar Enter", () => {
    const action = vi.fn();
    const preventDefault = vi.fn();
    const handler = handleClickableKeyDown(action);

    handler({
      key: "Enter",
      preventDefault,
    } as unknown as React.KeyboardEvent);

    expect(action).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  /** Garante que Space dispara a action e previne o default (evita scroll). */
  it("dispara action ao pressionar Space", () => {
    const action = vi.fn();
    const preventDefault = vi.fn();
    const handler = handleClickableKeyDown(action);

    handler({
      key: " ",
      preventDefault,
    } as unknown as React.KeyboardEvent);

    expect(action).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  /** Eventos com tecla mantida pressionada não devem disparar a ação várias vezes. */
  it("ignora keydown com event.repeat = true", () => {
    const action = vi.fn();
    const preventDefault = vi.fn();
    const handler = handleClickableKeyDown(action);

    handler({
      key: "Enter",
      repeat: true,
      preventDefault,
    } as unknown as React.KeyboardEvent);

    expect(action).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  /** Garante que outras teclas não disparam a action. */
  it("ignora outras teclas (Escape, ArrowDown, letras)", () => {
    const action = vi.fn();
    const preventDefault = vi.fn();
    const handler = handleClickableKeyDown(action);

    for (const key of ["Escape", "ArrowDown", "a", "Tab"]) {
      handler({
        key,
        preventDefault,
      } as unknown as React.KeyboardEvent);
    }

    expect(action).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe("getInitials", () => {
  /** Retorna duas iniciais para nomes compostos. */
  it("retorna duas iniciais para nomes compostos", () => {
    expect(getInitials("João Pedro")).toBe("JP");
    expect(getInitials("Maria Silva Santos")).toBe("MS");
  });

  /** Retorna uma inicial para nomes únicos. */
  it("retorna uma inicial para nomes únicos", () => {
    expect(getInitials("Ana")).toBe("A");
  });
});

describe("isSafeRedirect", () => {
  /** Aceita caminhos internos válidos. */
  it("aceita caminhos internos começando com /", () => {
    expect(isSafeRedirect("/dashboard")).toBe(true);
    expect(isSafeRedirect("/musicas/123")).toBe(true);
  });

  /** Rejeita protocol-relative URLs (//evil.com). */
  it("rejeita protocol-relative URLs", () => {
    expect(isSafeRedirect("//evil.com")).toBe(false);
  });

  /** Rejeita URLs absolutas. */
  it("rejeita URLs absolutas", () => {
    expect(isSafeRedirect("https://evil.com")).toBe(false);
    expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
  });
});

describe("isSafeUrl", () => {
  /** Aceita http e https. */
  it("aceita http e https", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("https://example.com/path")).toBe(true);
  });

  /** Rejeita javascript:, data: e outros protocolos perigosos. */
  it("rejeita protocolos perigosos", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
  });

  /** Rejeita strings inválidas. */
  it("rejeita strings que não são URLs", () => {
    expect(isSafeUrl("not a url")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});

/**
 * Suíte de normalização para busca textual em PT-BR (remoção de
 * diacríticos + lowercase), garantindo que termos com acentuação
 * comparam iguais a suas versões sem acento, em qualquer caso.
 */
describe("normalizeForSearch", () => {
  /** Remove diacríticos comuns do português. */
  it("remove acentos comuns em PT-BR", () => {
    expect(normalizeForSearch("Adoração")).toBe("adoracao");
    expect(normalizeForSearch("Espírito Santo")).toBe("espirito santo");
    expect(normalizeForSearch("Ó Senhor")).toBe("o senhor");
  });

  /** É equivalente entre versão com acento e sem. */
  it("compara igual versões acentuada e não-acentuada", () => {
    expect(normalizeForSearch("Adoração")).toBe(normalizeForSearch("adoracao"));
    expect(normalizeForSearch("Coração")).toBe(normalizeForSearch("CORACAO"));
  });

  /** Preserva texto sem acentos. */
  it("preserva texto sem acentos", () => {
    expect(normalizeForSearch("amor")).toBe("amor");
    expect(normalizeForSearch("hello world")).toBe("hello world");
  });

  /** String vazia retorna vazia. */
  it("aceita string vazia", () => {
    expect(normalizeForSearch("")).toBe("");
  });
});

/**
 * Suíte de formatação de data por extenso em PT-BR, com foco na regra de
 * fuso horário que precisa espelhar `formatDateBlock` — caso contrário o
 * bloco de data grande e a linha por extenso mostrariam dias diferentes em
 * fusos ocidentais (ex: Brasil).
 */
describe("formatDataExtenso", () => {
  /** ISO com componente de hora explícito é lido no fuso local, como formatDateBlock. */
  it("usa o fuso local para ISO com horário explícito", () => {
    expect(formatDataExtenso("2026-04-25T14:00:00")).toBe("25 de abril");
  });

  /** Date-only usa getters UTC — não pode deslocar para o dia 26 em fusos ocidentais. */
  it("usa UTC para date-only ISO (YYYY-MM-DD), evitando deslocar um dia", () => {
    expect(formatDataExtenso("2026-03-27")).toBe("27 de março");
  });

  /** Por padrão (capitalizar ausente/false), o mês fica em minúsculas — forma correta em texto corrido. */
  it("mantém o mês em minúsculas quando capitalizar não é informado", () => {
    expect(formatDataExtenso("2026-03-27")).toBe("27 de março");
    expect(formatDataExtenso("2026-03-27", { capitalizar: false })).toBe("27 de março");
  });

  /** Com capitalizar=true, apenas o nome do mês é capitalizado (o dia já é numérico). */
  it("capitaliza o nome do mês quando capitalizar=true", () => {
    expect(formatDataExtenso("2026-03-27", { capitalizar: true })).toBe("27 de Março");
  });

  /** Data inválida retorna string vazia em vez de "Invalid Date" no DOM. */
  it("retorna string vazia para data inválida", () => {
    expect(formatDataExtenso("not a date")).toBe("");
  });

  /**
   * `null`/`undefined` não podem cair no construtor `Date` sem guarda prévia:
   * `new Date(null)` resolve para o epoch (1970-01-01) em vez de "Invalid Date",
   * o que produziria silenciosamente "31 de dezembro" (fuso ocidental) em vez
   * do fallback esperado de string vazia.
   */
  it("retorna string vazia para null/undefined em vez de cair no epoch", () => {
    expect(formatDataExtenso(null as unknown as string)).toBe("");
    expect(formatDataExtenso(undefined as unknown as string)).toBe("");
  });
});
