/**
 * Testes do `MusicaFiltros` — filtros da página de Músicas.
 *
 * Cobre o subcomponente compartilhado `MusicaFiltrosChips` (renderização dos
 * chips de intensidade e categorias, estado ativo via `aria-pressed`,
 * callbacks de toggle), o `MusicaFiltrosDrawer` mobile (abertura do
 * bottom-sheet pelo botão "Filtros", contador de filtros ativos e a ação
 * "Limpar filtros") e o `MusicaFiltrosAtivos` (badges removíveis da linha de
 * resultados).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MusicaFiltrosAtivos,
  MusicaFiltrosChips,
  MusicaFiltrosDrawer,
  descreverFiltrosAtivos,
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

/**
 * Suíte dos badges removíveis de filtros ativos, exibidos na linha de
 * resultados de `Songs.tsx`. Cobre o gate de exibição, os rótulos
 * resolvidos, a remoção individual, a ação "Limpar filtros", o aviso de
 * foco via `aoRemover` e o caso de um id de categoria que não existe mais
 * na lista (link antigo/categoria excluída).
 */
describe("MusicaFiltrosAtivos", () => {
  /** Sem nenhum filtro ativo, o componente não renderiza nada. */
  it("retorna null sem filtros ativos", () => {
    const { container } = render(
      <MusicaFiltrosAtivos {...baseProps} onLimpar={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  /** Cada filtro ativo vira um badge removível com o rótulo humano. */
  it("renderiza um badge por categoria e por intensidade ativas", () => {
    render(
      <MusicaFiltrosAtivos
        {...baseProps}
        categoriaIds={["cat-1"]}
        intensidades={["calma"]}
        onLimpar={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Remover filtro Adoração" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover filtro Calma" }),
    ).toBeInTheDocument();
  });

  /** Clicar no badge de um filtro aciona o toggle correspondente, removendo só ele. */
  it("chama onToggleCategoria ao clicar no badge de remover", () => {
    const onToggleCategoria = vi.fn();
    render(
      <MusicaFiltrosAtivos
        {...baseProps}
        categoriaIds={["cat-1"]}
        onToggleCategoria={onToggleCategoria}
        onLimpar={() => {}}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remover filtro Adoração" }),
    );
    expect(onToggleCategoria).toHaveBeenCalledWith("cat-1");
  });

  /** "Limpar filtros" dispara o callback recebido. */
  it("chama onLimpar ao acionar Limpar filtros", () => {
    const onLimpar = vi.fn();
    render(
      <MusicaFiltrosAtivos
        {...baseProps}
        intensidades={["media"]}
        onLimpar={onLimpar}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onLimpar).toHaveBeenCalledTimes(1);
  });

  /**
   * O botão clicado desmonta ao remover o filtro (o badge some; se era o
   * único filtro ativo, o componente inteiro retorna `null`), o que
   * devolveria o foco ao `<body>` sem aviso. `aoRemover` é o hook que
   * `Songs.tsx` usa para focar de volta o campo de busca — o componente
   * não conhece `searchRef`, só dispara o callback.
   */
  it("aciona aoRemover ao remover um badge de filtro", () => {
    const aoRemover = vi.fn();
    render(
      <MusicaFiltrosAtivos
        {...baseProps}
        categoriaIds={["cat-1"]}
        onLimpar={() => {}}
        aoRemover={aoRemover}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remover filtro Adoração" }),
    );
    expect(aoRemover).toHaveBeenCalledTimes(1);
  });

  /** O mesmo aviso de foco se aplica a "Limpar filtros" — também desmonta o componente. */
  it("aciona aoRemover ao acionar Limpar filtros", () => {
    const aoRemover = vi.fn();
    render(
      <MusicaFiltrosAtivos
        {...baseProps}
        intensidades={["media"]}
        onLimpar={() => {}}
        aoRemover={aoRemover}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(aoRemover).toHaveBeenCalledTimes(1);
  });

  /**
   * Um id de categoria que não existe mais em `categorias` (link antigo,
   * categoria excluída) não tem rótulo humano — não vira badge — mas o
   * gate de exibição usa a contagem crua
   * (`categoriaIds.length + intensidades.length`), não a lista resolvida
   * por `descreverFiltrosAtivos`. Sem essa distinção, o usuário ficaria
   * preso num resultado vazio sem nenhum botão para limpar o filtro
   * inválido — "Limpar filtros" nunca fica desabilitado neste componente
   * (o gate acima já cobre o caso de zero filtros retornando `null`).
   */
  it("omite badge de categoria inexistente mas mantém Limpar filtros habilitado", () => {
    render(
      <MusicaFiltrosAtivos
        {...baseProps}
        categoriaIds={["cat-inexistente"]}
        onLimpar={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /^Remover filtro/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Limpar filtros" }),
    ).toBeEnabled();
  });
});

/**
 * Suíte da função pura `descreverFiltrosAtivos`, usada por
 * `MusicaFiltrosAtivos` para resolver ids/valores em badges com rótulo
 * humano.
 */
describe("descreverFiltrosAtivos", () => {
  /**
   * Resolve intensidades antes de categorias — mesma ordem visual dos
   * grupos de chips em `MusicaFiltrosChips` (intensidade primeiro,
   * categoria depois).
   */
  it("resolve intensidades e categorias ativas com rótulo humano", () => {
    const resultado = descreverFiltrosAtivos({
      ...baseProps,
      categoriaIds: ["cat-2"],
      intensidades: ["agitada"],
    });
    expect(resultado).toEqual([
      expect.objectContaining({ chave: "intensidade:agitada", rotulo: "Agitada" }),
      expect.objectContaining({ chave: "categoria:cat-2", rotulo: "Celebração" }),
    ]);
  });

  /** Um id de categoria sem correspondência em `categorias` é omitido do retorno. */
  it("omite id de categoria que não existe na lista de categorias", () => {
    const resultado = descreverFiltrosAtivos({
      ...baseProps,
      categoriaIds: ["cat-1", "cat-inexistente"],
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({ chave: "categoria:cat-1" });
  });
});
