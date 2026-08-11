/**
 * Testes do `MusicaFiltros` — filtros da página de Músicas.
 *
 * Cobre o subcomponente compartilhado `MusicaFiltrosChips` (renderização dos
 * chips de intensidade e categorias, estado ativo via `aria-pressed`,
 * callbacks de toggle) e o `MusicaFiltrosDrawer` mobile (abertura do
 * bottom-sheet pelo botão "Filtros", contador de filtros ativos e a ação
 * "Limpar filtros").
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MusicaFiltrosChips,
  MusicaFiltrosDrawer,
} from "@/components/MusicaFiltros";
import type { Intensidade } from "@/components/intensidade-options";

/** Categorias de exemplo usadas nos testes. */
const CATEGORIAS = [
  { id: "cat-1", nome: "Adoração" },
  { id: "cat-2", nome: "Celebração" },
];

/** Props base sem nenhum filtro ativo. */
const baseProps = {
  categorias: CATEGORIAS,
  categoriaIds: [] as string[],
  intensidades: [] as Intensidade[],
  onToggleCategoria: () => {},
  onToggleIntensidade: () => {},
};

/** Suíte do subcomponente de chips compartilhado (inline no desktop e dentro do drawer). */
describe("MusicaFiltrosChips", () => {
  /** Renderiza um chip por intensidade e por categoria. */
  it("renderiza chips de intensidade e de categorias", () => {
    render(<MusicaFiltrosChips {...baseProps} />);
    expect(screen.getByRole("button", { name: /calma/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agitada/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adoração" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Celebração" })).toBeInTheDocument();
  });

  /** Chips selecionados refletem o estado em `aria-pressed`. */
  it("marca chips ativos com aria-pressed", () => {
    render(
      <MusicaFiltrosChips
        {...baseProps}
        categoriaIds={["cat-1"]}
        intensidades={["calma"]}
      />,
    );
    expect(screen.getByRole("button", { name: "Adoração" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Celebração" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /calma/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /** Clique num chip de categoria emite o id correspondente. */
  it("chama onToggleCategoria com o id ao clicar num chip", () => {
    const onToggleCategoria = vi.fn();
    render(
      <MusicaFiltrosChips {...baseProps} onToggleCategoria={onToggleCategoria} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Adoração" }));
    expect(onToggleCategoria).toHaveBeenCalledWith("cat-1");
  });

  /** Clique num chip de intensidade emite o valor correspondente. */
  it("chama onToggleIntensidade com o valor ao clicar num chip", () => {
    const onToggleIntensidade = vi.fn();
    render(
      <MusicaFiltrosChips
        {...baseProps}
        onToggleIntensidade={onToggleIntensidade}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /agitada/i }));
    expect(onToggleIntensidade).toHaveBeenCalledWith("agitada");
  });
});

/** Suíte do drawer mobile de filtros (botão "Filtros" + bottom-sheet). */
describe("MusicaFiltrosDrawer", () => {
  /** O botão "Filtros" abre o bottom-sheet com os chips e o rodapé. */
  it("abre o drawer com os chips ao acionar o botão Filtros", () => {
    render(<MusicaFiltrosDrawer {...baseProps} onLimpar={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByText("Adoração")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Limpar filtros" }),
    ).toBeInTheDocument();
  });

  /** O contador de filtros ativos aparece no botão e no aria-label. */
  it("exibe a contagem de filtros ativos no botão", () => {
    render(
      <MusicaFiltrosDrawer
        {...baseProps}
        categoriaIds={["cat-1"]}
        intensidades={["calma"]}
        onLimpar={() => {}}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Filtros, 2 filtros ativos",
    });
    expect(trigger).toHaveTextContent("2");
  });

  /** "Limpar filtros" dispara o callback recebido. */
  it("chama onLimpar ao acionar Limpar filtros", () => {
    const onLimpar = vi.fn();
    render(
      <MusicaFiltrosDrawer
        {...baseProps}
        categoriaIds={["cat-2"]}
        onLimpar={onLimpar}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^filtros/i }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onLimpar).toHaveBeenCalledTimes(1);
  });

  /** Sem filtros ativos, "Limpar filtros" fica desabilitado. */
  it("desabilita Limpar filtros quando não há filtros ativos", () => {
    render(<MusicaFiltrosDrawer {...baseProps} onLimpar={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
  });
});
