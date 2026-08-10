/**
 * Testes do `ResponsiveFormDialog` — shell de formulário responsivo que renderiza
 * um `Drawer` (bottom-sheet) no mobile e um `Dialog` centralizado no desktop.
 *
 * Cobre: renderização do ramo desktop (título, campos e rodapé), disparo do
 * `onSubmit` ao enviar o formulário, e renderização do ramo mobile. O hook
 * `useIsMobile` é mockado para escolher o ramo de forma determinística.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import { useIsMobile } from "@/hooks/use-mobile";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn() }));
const useIsMobileMock = vi.mocked(useIsMobile);

/**
 * Renderiza o `ResponsiveFormDialog` aberto com um campo e um botão de submit.
 *
 * @param onSubmit - Espião chamado quando o formulário é enviado.
 */
function renderDialog(onSubmit: () => void = () => {}) {
  render(
    <ResponsiveFormDialog
      open
      onOpenChange={() => {}}
      title="Título de Teste"
      description="Descrição de teste"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      footer={<button type="submit">Salvar</button>}
    >
      <input aria-label="campo" />
    </ResponsiveFormDialog>,
  );
}

describe("ResponsiveFormDialog", () => {
  /** Reseta o mock de viewport entre os casos. */
  beforeEach(() => {
    useIsMobileMock.mockReset();
  });

  /** No desktop, renderiza o Dialog com título, campos e rodapé. */
  it("renderiza o ramo desktop com título, campo e rodapé", () => {
    useIsMobileMock.mockReturnValue(false);
    renderDialog();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
    expect(screen.getByLabelText("campo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  /** Enviar o formulário (clicar em Salvar) dispara o onSubmit. */
  it("dispara onSubmit ao enviar o formulário", () => {
    useIsMobileMock.mockReturnValue(false);
    const onSubmit = vi.fn();
    renderDialog(onSubmit);
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  /** No mobile, renderiza o ramo Drawer exibindo o título. */
  it("renderiza o ramo mobile com o título", () => {
    useIsMobileMock.mockReturnValue(true);
    renderDialog();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
  });
});
