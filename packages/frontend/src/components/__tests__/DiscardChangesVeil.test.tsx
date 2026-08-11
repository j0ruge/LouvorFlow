/**
 * Testes do `DiscardChangesVeil` — camada de confirmação de descarte de
 * alterações não salvas pintada sobre o formulário.
 *
 * Cobre: papel `alertdialog` com `aria-modal` e rótulos ligados via
 * `aria-labelledby`/`aria-describedby`, foco inicial em "Continuar
 * editando", `Escape` como "continuar editando" e os cliques nos dois
 * botões. A restauração do foco anterior NÃO é papel deste componente —
 * ela mora no `useDirtyFormGuard` (captura no evento, antes do `inert`
 * roubar o foco) e é testada em `use-dirty-form-guard.test.ts`.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiscardChangesVeil } from "@/components/DiscardChangesVeil";

/**
 * Renderiza o veil com espiões nos dois callbacks.
 *
 * @returns Espiões `onKeepEditing` e `onDiscard` e o resultado do render.
 */
function renderVeil() {
  const onKeepEditing = vi.fn();
  const onDiscard = vi.fn();
  const utils = render(
    <DiscardChangesVeil onKeepEditing={onKeepEditing} onDiscard={onDiscard} />,
  );
  return { onKeepEditing, onDiscard, ...utils };
}

describe("DiscardChangesVeil", () => {
  /** Expõe role alertdialog com aria-modal e título/descrição associados. */
  it("expõe alertdialog acessível com título e descrição associados", () => {
    renderVeil();

    const veil = screen.getByRole("alertdialog");
    expect(veil).toHaveAttribute("aria-modal", "true");
    expect(veil).toHaveAccessibleName("Descartar alterações?");
    expect(veil).toHaveAccessibleDescription(
      "Você tem alterações não salvas. Se sair agora, elas serão perdidas.",
    );
  });

  /** O foco inicial vai para o botão "Continuar editando" (ação segura). */
  it("foca o botão Continuar editando ao abrir", () => {
    renderVeil();

    expect(
      screen.getByRole("button", { name: "Continuar editando" }),
    ).toHaveFocus();
  });

  /** Escape dentro do veil equivale a "Continuar editando". */
  it("chama onKeepEditing ao pressionar Escape", () => {
    const { onKeepEditing, onDiscard } = renderVeil();

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(onKeepEditing).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  /** Clicar em "Continuar editando" chama apenas onKeepEditing. */
  it("chama onKeepEditing ao clicar em Continuar editando", () => {
    const { onKeepEditing, onDiscard } = renderVeil();

    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));

    expect(onKeepEditing).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  /** Clicar em "Descartar" chama apenas onDiscard. */
  it("chama onDiscard ao clicar em Descartar", () => {
    const { onKeepEditing, onDiscard } = renderVeil();

    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onKeepEditing).not.toHaveBeenCalled();
  });
});
