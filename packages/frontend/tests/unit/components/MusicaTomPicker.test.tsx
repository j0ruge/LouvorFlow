/**
 * Testes de componente para MusicaTomPicker.
 *
 * Cobre os comportamentos que `EventoMusicaCard.test.tsx` (que mocka
 * `useTonalidades` com lista vazia, só para isolar a navegação do card) não
 * alcança — com o grid de tons e a sentinela nunca chegando a renderizar lá:
 * - Modo readOnly: renderiza span estático sem botão de popover.
 * - Fallback "Sem tom" quando não há tom efetivo nem tom global.
 * - Anel âmbar (`ring-primary`, token) presente só quando o tom efetivo
 *   diverge do tom global; ausente quando são iguais (incluindo "ambos null").
 * - Sentinela "Tom da música (X)" no popover dispara `onSelect(null)`.
 * - Escolher uma tile do grid dispara `onSelect(id)` com o UUID do tom.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MusicaTomPicker } from "@/components/MusicaTomPicker";
import type { Tonalidade } from "@/schemas/shared";

/**
 * Tons de teste usados pelo mock de `useTonalidades` — 3 tons, poucos o
 * bastante para não exigir rolagem do grid nos testes.
 */
const { TOM_C, TOM_D, TOM_E } = vi.hoisted(() => ({
  TOM_C: { id: "tom-c", tom: "C" },
  TOM_D: { id: "tom-d", tom: "D" },
  TOM_E: { id: "tom-e", tom: "E" },
}));

/**
 * Mock de `@/hooks/use-support`: `MusicaTomPicker` chama `useTonalidades()`
 * internamente (ao contrário de `MusicaVersaoPicker`, que recebe as versões
 * via prop) — sem o mock, o teste dispararia um fetch real.
 */
vi.mock("@/hooks/use-support", () => ({
  useTonalidades: () => ({ data: [TOM_C, TOM_D, TOM_E], isLoading: false }),
}));

describe("MusicaTomPicker — modo readOnly", () => {
  /** Deve renderizar span estático sem botão de popover trigger. */
  it("renderiza span estático sem botão de popover trigger", () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_C as Tonalidade}
        tonalidadeMusica={TOM_C as Tonalidade}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  /** Deve exibir aria-label com o tom selecionado no span readOnly. */
  it("exibe aria-label com o tom selecionado", () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_D as Tonalidade}
        tonalidadeMusica={TOM_D as Tonalidade}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    const span = screen.getByLabelText("Tom selecionado: D");
    expect(span.tagName).toBe("SPAN");
  });

  /** Deve exibir "Sem tom" quando não há tom efetivo nem tom global. */
  it('exibe "Sem tom" quando tonalidadeEfetiva e tonalidadeMusica são null', () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={null}
        tonalidadeMusica={null}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("Sem tom")).toBeInTheDocument();
  });
});

describe("MusicaTomPicker — anel de override (efetivo ≠ global)", () => {
  /** Deve aplicar `ring-primary` no badge readOnly quando o tom efetivo diverge do global. */
  it("aplica ring-primary quando o tom efetivo diverge do tom global", () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_D as Tonalidade}
        tonalidadeMusica={TOM_C as Tonalidade}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("D")).toHaveClass("ring-primary");
  });

  /** Não deve aplicar `ring-primary` quando o tom efetivo é igual ao tom global. */
  it("não aplica ring-primary quando o tom efetivo é igual ao tom global", () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_C as Tonalidade}
        tonalidadeMusica={TOM_C as Tonalidade}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("C")).not.toHaveClass("ring-primary");
  });

  /** Não deve aplicar `ring-primary` quando não há tom nenhum (efetivo e global null). */
  it("não aplica ring-primary quando tonalidadeEfetiva e tonalidadeMusica são null", () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={null}
        tonalidadeMusica={null}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />,
    );

    expect(screen.getByText("Sem tom")).not.toHaveClass("ring-primary");
  });

  /** Deve aplicar `ring-primary` também no botão interativo (não readOnly) quando diverge. */
  it("aplica ring-primary no botão de popover quando o tom efetivo diverge do global", () => {
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_D as Tonalidade}
        tonalidadeMusica={TOM_C as Tonalidade}
        onSelect={() => {}}
        isPending={false}
      />,
    );

    expect(screen.getByRole("button", { name: /^Tom: D\./ })).toHaveClass(
      "ring-primary",
    );
  });
});

describe("MusicaTomPicker — seleção via popover", () => {
  /**
   * Clica no radio pela role, não no texto da label: `RadioGroupItem` fica
   * `sr-only` e o repasse de clique da `<label>` para um `<button>` (Radix
   * renderiza `role="radio"` como `<button>`, não `<input>`) é comportamento
   * nativo do browser real — já coberto em `escala-detalhe.spec.ts` (e2e,
   * Chromium real). Em jsdom, o alvo determinístico é o próprio controle.
   */
  it('dispara onSelect(null) ao escolher a sentinela "Tom da música"', () => {
    const onSelect = vi.fn();
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_D as Tonalidade}
        tonalidadeMusica={TOM_C as Tonalidade}
        onSelect={onSelect}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Tom: D\./ }));
    fireEvent.click(
      screen.getByRole("radio", { name: `Tom da música (${TOM_C.tom})` }),
    );

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  /** Deve disparar onSelect(id) com o UUID do tom ao escolher uma tile do grid. */
  it("dispara onSelect(id) ao escolher uma tile do grid", () => {
    const onSelect = vi.fn();
    render(
      <MusicaTomPicker
        musicaId="m1"
        tonalidadeEfetiva={TOM_C as Tonalidade}
        tonalidadeMusica={TOM_C as Tonalidade}
        onSelect={onSelect}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Tom: C\./ }));
    fireEvent.click(screen.getByRole("radio", { name: TOM_E.tom }));

    expect(onSelect).toHaveBeenCalledWith(TOM_E.id);
  });
});
