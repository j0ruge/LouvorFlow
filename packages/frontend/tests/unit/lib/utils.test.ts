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
