/**
 * Testes da linha unificada de evento (`EventoRow`), usada por Dashboard,
 * Histórico e Escalas.
 *
 * Cobre a cadeia de fallback do título, a pluralização da contagem de
 * músicas/integrantes, o bloco de data, a navegação por clique/teclado via
 * `onOpen` (incluindo a guarda de `currentTarget` que isola o slot
 * `acoes`), a ausência de `role="button"` sem `onOpen`, e a renderização
 * dos slots `badges`/`acoes`.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventoRow } from "@/components/EventoRow";
import type { EventoIndex } from "@/schemas/evento";

/** Evento base reutilizado pelos testes, com campos neutros/vazios. */
const eventoBase: EventoIndex = {
  id: "evento-1",
  data: "2026-03-27",
  descricao: "",
  tipoEvento: null,
  musicas: [],
  integrantes: [],
};

/**
 * Localiza o elemento raiz clicável da linha (`role="button"`) via
 * `querySelector`, em vez de `getByRole`, para não depender do cálculo de
 * nome acessível quando o slot `acoes` contém um `<button>` aninhado.
 *
 * @param container - Elemento raiz retornado pelo `render` do Testing Library.
 * @returns O elemento da linha com `role="button"`, ou `null` se ausente.
 */
function getLinha(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="button"]');
}

describe("EventoRow", () => {
  /** A descrição, quando presente, tem prioridade sobre o tipo de evento como título. */
  it("usa a descricao como titulo quando presente", () => {
    render(
      <EventoRow
        evento={{
          ...eventoBase,
          descricao: "Ensaio Geral",
          tipoEvento: { id: "t1", nome: "Culto" },
        }}
      />,
    );
    expect(screen.getByText("Ensaio Geral")).toBeInTheDocument();
  });

  /** Sem descrição, o título cai para o nome do tipo de evento (mesmo repetindo a pill). */
  it("usa tipoEvento.nome como titulo quando a descricao esta vazia", () => {
    render(
      <EventoRow
        evento={{
          ...eventoBase,
          descricao: "",
          tipoEvento: { id: "t1", nome: "Culto" },
        }}
      />,
    );
    expect(screen.getAllByText("Culto").length).toBeGreaterThanOrEqual(1);
  });

  /** Sem descrição e sem tipo de evento, o título cai para o rótulo genérico "Escala". */
  it("usa Escala como titulo quando nao ha descricao nem tipoEvento", () => {
    render(<EventoRow evento={eventoBase} />);
    expect(screen.getByText("Escala")).toBeInTheDocument();
  });

  /** Descrição só com espaços é tratada como vazia (`.trim()`) e também cai no fallback. */
  it("trata descricao apenas com espacos como vazia", () => {
    render(<EventoRow evento={{ ...eventoBase, descricao: "   " }} />);
    expect(screen.getByText("Escala")).toBeInTheDocument();
  });

  /** Uma música e um integrante usam a forma singular. */
  it("pluraliza a contagem no singular", () => {
    render(
      <EventoRow
        evento={{
          ...eventoBase,
          musicas: [{ id: "m1", nome: "Oceans" }],
          integrantes: [{ id: "i1", nome: "João" }],
        }}
      />,
    );
    expect(screen.getByText("1 música · 1 integrante")).toBeInTheDocument();
  });

  /** Múltiplas músicas/integrantes usam a forma plural. */
  it("pluraliza a contagem no plural", () => {
    const musicas = Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, nome: `Música ${i}` }));
    const integrantes = Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, nome: `Integrante ${i}` }));
    render(<EventoRow evento={{ ...eventoBase, musicas, integrantes }} />);
    expect(screen.getByText("5 músicas · 6 integrantes")).toBeInTheDocument();
  });

  /** O bloco de data exibe dia numérico e mês abreviado, via `formatDateBlock`. */
  it("renderiza o bloco de data com dia e mes abreviado", () => {
    render(<EventoRow evento={eventoBase} />);
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("Mar")).toBeInTheDocument();
  });

  /** Sem `onOpen`, a linha não vira `role="button"` (caso de uso: Escalas.tsx). */
  it("sem onOpen nao ha role=button na linha", () => {
    const { container } = render(<EventoRow evento={eventoBase} />);
    expect(getLinha(container)).toBeNull();
  });

  /** Com `onOpen`, clicar em qualquer ponto da linha aciona o callback com o id do evento. */
  it("com onOpen, clicar na linha chama onOpen com o id do evento", () => {
    const onOpen = vi.fn();
    const { container } = render(<EventoRow evento={eventoBase} onOpen={onOpen} />);
    fireEvent.click(getLinha(container)!);
    expect(onOpen).toHaveBeenCalledWith("evento-1");
  });

  /** Com `onOpen`, pressionar Enter com foco na linha aciona o callback. */
  it("com onOpen, Enter sobre a linha chama onOpen", () => {
    const onOpen = vi.fn();
    const { container } = render(<EventoRow evento={eventoBase} onOpen={onOpen} />);
    fireEvent.keyDown(getLinha(container)!, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledWith("evento-1");
  });

  /** Com `onOpen`, pressionar Espaço com foco na linha também aciona o callback. */
  it("com onOpen, Espaco sobre a linha chama onOpen", () => {
    const onOpen = vi.fn();
    const { container } = render(<EventoRow evento={eventoBase} onOpen={onOpen} />);
    fireEvent.keyDown(getLinha(container)!, { key: " " });
    expect(onOpen).toHaveBeenCalledWith("evento-1");
  });

  /** Clicar num controle do slot `acoes` não deve navegar (o componente isola com `stopPropagation`). */
  it("clique dentro de acoes nao dispara onOpen", () => {
    const onOpen = vi.fn();
    const onAcaoClick = vi.fn();
    render(
      <EventoRow
        evento={eventoBase}
        onOpen={onOpen}
        acoes={<button onClick={onAcaoClick}>Detalhes</button>}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Detalhes" }));
    expect(onAcaoClick).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  /**
   * Enter num controle do slot `acoes` também não deve navegar: o `keydown` faz
   * bubble até a linha, mas a guarda de `currentTarget` ignora eventos cujo
   * alvo não é o próprio elemento da linha.
   */
  it("Enter dentro de acoes nao dispara onOpen (guarda de currentTarget)", () => {
    const onOpen = vi.fn();
    render(
      <EventoRow
        evento={eventoBase}
        onOpen={onOpen}
        acoes={<button>Detalhes</button>}
      />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Detalhes" }), { key: "Enter" });
    expect(onOpen).not.toHaveBeenCalled();
  });

  /** Os slots `badges` e `acoes` renderizam o conteúdo passado pelo consumidor. */
  it("renderiza os slots badges e acoes", () => {
    render(
      <EventoRow
        evento={eventoBase}
        badges={<span>Rascunho</span>}
        acoes={<button>Duplicar</button>}
      />,
    );
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duplicar" })).toBeInTheDocument();
  });

  /** A legenda opcional (ex.: data por extenso) é exibida quando informada. */
  it("renderiza a legenda quando informada", () => {
    render(<EventoRow evento={eventoBase} legenda="27 de Março" />);
    expect(screen.getByText("27 de Março")).toBeInTheDocument();
  });

  /**
   * O título é um heading (`<h3>`), não um `<div>`: leitores de tela navegam
   * listas de eventos pulando entre headings, e History/Escalas já expunham
   * um heading por linha antes desta unificação — perder isso seria uma
   * regressão de acessibilidade.
   */
  it("expõe o título como heading para navegação por leitor de tela", () => {
    render(
      <EventoRow evento={{ ...eventoBase, descricao: "Ensaio Geral" }} />,
    );
    expect(
      screen.getByRole("heading", { name: "Ensaio Geral" }),
    ).toBeInTheDocument();
  });
});
