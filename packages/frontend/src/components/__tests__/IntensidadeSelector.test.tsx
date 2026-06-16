/**
 * Testes do `IntensidadeSelector` — seletor de intensidade (tempo) usado nos
 * formulários de música/versão. Cobre renderização das três opções, reflexo do
 * estado em `aria-pressed`, seleção e o toggle deselect (clicar na opção ativa
 * limpa o valor para `""`).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntensidadeSelector } from "@/components/IntensidadeSelector";

/**
 * Suíte de testes do componente `IntensidadeSelector`: valida a renderização
 * das três opções de intensidade (Calma, Média, Agitada), o reflexo da seleção
 * em `aria-pressed`, a emissão do valor ao selecionar uma opção e o toggle
 * deselect (clicar na opção já ativa limpa o valor para `""`).
 */
describe("IntensidadeSelector", () => {
  /** Renderiza um botão para cada opção (Calma, Média, Agitada). */
  it("renderiza as três opções de intensidade", () => {
    render(<IntensidadeSelector value="" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /calma/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /média/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agitada/i })).toBeInTheDocument();
  });

  /** A opção selecionada recebe `aria-pressed="true"`; as demais, `"false"`. */
  it("reflete a seleção em aria-pressed", () => {
    render(<IntensidadeSelector value="media" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /média/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /calma/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  /** Clicar numa opção não selecionada emite o valor correspondente. */
  it("chama onChange com o valor ao selecionar uma opção", () => {
    const onChange = vi.fn();
    render(<IntensidadeSelector value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /agitada/i }));
    expect(onChange).toHaveBeenCalledWith("agitada");
  });

  /** Clicar na opção já ativa limpa o valor (toggle deselect → `""`). */
  it("chama onChange com string vazia ao clicar na opção já ativa", () => {
    const onChange = vi.fn();
    render(<IntensidadeSelector value="calma" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /calma/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
