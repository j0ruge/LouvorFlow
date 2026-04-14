/**
 * Testes de componente para CreatableCombobox no modo "select com busca puro"
 * (`onCreate` omitido). Valida o comportamento compartilhado pelos seletores
 * de músicas e de integrantes em `EventoDetail`.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  CreatableCombobox,
  type ComboboxOption,
} from "@/components/CreatableCombobox";

/**
 * Fábrica de opções de teste.
 *
 * @param overrides - Lista opcional de opções customizadas.
 * @returns Lista de `ComboboxOption`.
 */
function criarOpcoes(overrides?: ComboboxOption[]): ComboboxOption[] {
  return (
    overrides ?? [
      { value: "i1", label: "Ana" },
      { value: "i2", label: "Bruno" },
      { value: "i3", label: "Carlos" },
    ]
  );
}

/**
 * Suite de testes do modo "select com busca puro" (sem `onCreate`): garante
 * que o combobox abre, filtra por texto e dispara `onSelect` com o value certo.
 */
describe("CreatableCombobox — select com busca (sem onCreate)", () => {
  /** Renderiza o placeholder quando nenhum valor está selecionado. */
  it("renderiza placeholder quando value é undefined", () => {
    render(
      <CreatableCombobox
        options={criarOpcoes()}
        value={undefined}
        onSelect={() => {}}
        placeholder="Selecione um integrante para adicionar"
      />,
    );

    expect(
      screen.getByText("Selecione um integrante para adicionar"),
    ).toBeInTheDocument();
  });

  /** Abre o popover ao clicar no trigger e exibe o campo de busca. */
  it("abre popover com campo de busca ao clicar no trigger", () => {
    render(
      <CreatableCombobox
        options={criarOpcoes()}
        value={undefined}
        onSelect={() => {}}
        searchPlaceholder="Buscar integrante..."
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));

    expect(
      screen.getByPlaceholderText("Buscar integrante..."),
    ).toBeInTheDocument();
  });

  /** Filtra a lista conforme o texto digitado no campo de busca. */
  it("filtra opções conforme o texto digitado", () => {
    render(
      <CreatableCombobox
        options={criarOpcoes()}
        value={undefined}
        onSelect={() => {}}
        searchPlaceholder="Buscar integrante..."
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    const search = screen.getByPlaceholderText("Buscar integrante...");
    fireEvent.change(search, { target: { value: "bru" } });

    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).toBeNull();
    expect(screen.queryByText("Carlos")).toBeNull();
  });

  /** Dispara onSelect com o value correto ao clicar em uma opção filtrada. */
  it("chama onSelect com o value da opção clicada", () => {
    const onSelect = vi.fn();
    render(
      <CreatableCombobox
        options={criarOpcoes()}
        value={undefined}
        onSelect={onSelect}
        searchPlaceholder="Buscar integrante..."
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    const search = screen.getByPlaceholderText("Buscar integrante...");
    fireEvent.change(search, { target: { value: "bru" } });
    fireEvent.click(screen.getByText("Bruno"));

    expect(onSelect).toHaveBeenCalledWith("i2");
  });

  /** Não exibe botão "Criar" quando onCreate não é fornecido. */
  it("não exibe botão Criar quando onCreate é omitido", () => {
    render(
      <CreatableCombobox
        options={criarOpcoes()}
        value={undefined}
        onSelect={() => {}}
        searchPlaceholder="Buscar integrante..."
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    const search = screen.getByPlaceholderText("Buscar integrante...");
    fireEvent.change(search, { target: { value: "Inexistente" } });

    const popover = screen.getByRole("dialog");
    expect(within(popover).queryByText(/^Criar/)).toBeNull();
  });

  /** Exibe o label da opção selecionada quando `value` é definido. */
  it("exibe o label da opção selecionada no trigger", () => {
    render(
      <CreatableCombobox
        options={criarOpcoes()}
        value="i3"
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("Carlos")).toBeInTheDocument();
  });
});
