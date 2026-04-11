/**
 * Testes de componente para MusicaVersaoPicker.
 *
 * Cobre os comportamentos de renderização e efeitos que os testes de função pura
 * em MusicaVersaoPicker.test.ts não alcançam:
 * - Modo readOnly: renderiza span estático sem botão de popover.
 * - Stale-selection auto-clear: dispara onSelect(null, { silent: true }) quando
 *   a versão selecionada não está mais nas versões disponíveis.
 * - Auto-select com guard por musicaId:length: dispara onSelect quando há
 *   exatamente uma versão e nenhuma seleção.
 * - Labels distintos do badge: "Sem artista" vs "Sem versão".
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MusicaVersaoPicker } from "@/components/MusicaVersaoPicker";
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

describe("MusicaVersaoPicker — modo readOnly", () => {
  /** Deve renderizar span estático sem botão de popover em modo readOnly. */
  it("renderiza span estático sem botão de popover trigger", () => {
    const versao = criarVersao({ id: "v1", artista_nome: "Gabriela Rocha" });
    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={versao}
        versoesDisponiveis={[versao]}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Gabriela Rocha")).toBeInTheDocument();
  });

  /** Deve exibir aria-label correto no span readOnly. */
  it("exibe aria-label com o nome da versão selecionada", () => {
    const versao = criarVersao({ id: "v1", artista_nome: "Aline Barros" });
    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={versao}
        versoesDisponiveis={[versao]}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    const span = screen.getByLabelText("Versão selecionada: Aline Barros");
    expect(span.tagName).toBe("SPAN");
  });
});

describe("MusicaVersaoPicker — stale-selection auto-clear", () => {
  /** Deve disparar onSelect(null, { silent: true }) quando a versão selecionada é stale. */
  it("dispara onSelect(null, { silent: true }) quando versão selecionada não existe nas disponíveis", () => {
    const onSelect = vi.fn();
    const versaoStale = criarVersao({ id: "v-removida", artista_nome: "Removida" });
    const versaoDisponivel = criarVersao({ id: "v2", artista_nome: "Outra" });

    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={versaoStale}
        versoesDisponiveis={[versaoDisponivel]}
        onSelect={onSelect}
        isPending={false}
      />,
    );

    expect(onSelect).toHaveBeenCalledWith(null, { silent: true });
  });
});

describe("MusicaVersaoPicker — auto-select única versão", () => {
  /** Deve auto-selecionar silenciosamente quando há exatamente 1 versão e nenhuma seleção. */
  it("dispara onSelect com o id da única versão e flag silent quando nenhuma está selecionada", () => {
    const onSelect = vi.fn();
    const versao = criarVersao({ id: "v-unica" });

    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={null}
        versoesDisponiveis={[versao]}
        onSelect={onSelect}
        isPending={false}
      />,
    );

    expect(onSelect).toHaveBeenCalledWith("v-unica", { silent: true });
  });

  /** Não deve auto-selecionar quando há múltiplas versões e nenhuma selecionada. */
  it("não dispara onSelect quando há múltiplas versões e nenhuma selecionada", () => {
    const onSelect = vi.fn();
    const versoes = [
      criarVersao({ id: "v1", artista_nome: "A1" }),
      criarVersao({ id: "v2", artista_nome: "A2" }),
    ];

    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={null}
        versoesDisponiveis={versoes}
        onSelect={onSelect}
        isPending={false}
      />,
    );

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("MusicaVersaoPicker — labels do badge", () => {
  /** Deve exibir "Sem artista" quando versão selecionada tem artista_nome null. */
  it('exibe "Sem artista" quando versão selecionada tem artista_nome null', () => {
    const versao = criarVersao({ id: "v1", artista_nome: null });
    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={versao}
        versoesDisponiveis={[versao]}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("Sem artista")).toBeInTheDocument();
  });

  /** Deve exibir "Sem versão" quando nenhuma versão está selecionada. */
  it('exibe "Sem versão" quando nenhuma versão está selecionada', () => {
    const versoes = [
      criarVersao({ id: "v1", artista_nome: "A1" }),
      criarVersao({ id: "v2", artista_nome: "A2" }),
    ];
    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={null}
        versoesDisponiveis={versoes}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("Sem versão")).toBeInTheDocument();
  });

  /** Deve exibir "Sem versão" quando a seleção é stale (não existe nas disponíveis). */
  it('exibe "Sem versão" quando a seleção é stale', () => {
    const versaoStale = criarVersao({ id: "v-old" });
    const versaoDisponivel = criarVersao({ id: "v-new", artista_nome: "Nova" });
    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={versaoStale}
        versoesDisponiveis={[versaoDisponivel]}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("Sem versão")).toBeInTheDocument();
  });
});

describe("MusicaVersaoPicker — renderização nula", () => {
  /** Deve retornar null (não renderizar nada) quando não há versões disponíveis. */
  it("não renderiza nada quando versoesDisponiveis é array vazio", () => {
    const { container } = render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={null}
        versoesDisponiveis={[]}
        onSelect={() => {}}
        isPending={false}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
