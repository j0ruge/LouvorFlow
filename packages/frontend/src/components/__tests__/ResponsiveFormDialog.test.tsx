/**
 * Testes do `ResponsiveFormDialog` — shell de formulário responsivo que renderiza
 * um `Drawer` (bottom-sheet) no mobile e um `Dialog` centralizado no desktop.
 *
 * Cobre: renderização do ramo desktop (título, campos e rodapé), disparo do
 * `onSubmit` ao enviar o formulário, e renderização do ramo mobile. O hook
 * `useIsMobile` é mockado para escolher o ramo de forma determinística.
 *
 * Cobre também a integração com o `useDirtyFormGuard` (prop `dirtyGuard`):
 * com alterações não salvas, Esc e o X abrem o `DiscardChangesVeil` em vez de
 * fechar, a modal continua montada e o conteúdo digitado sobrevive ao veil
 * (o wrapper do formulário é incondicional — não desmonta).
 */

import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";
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

  /**
   * Regressão: campos com `min`/`max` nativos (ex.: BPM em `MusicaForm.tsx`)
   * disparam a constraint validation do próprio navegador no submit, que
   * bloqueia o evento *antes* do `onSubmit` (e do resolver Zod) rodar — a
   * mensagem de erro em PT-BR do `FormMessage` nunca aparece e o botão
   * "Salvar" parece não fazer nada. Isso também torna registros legados fora
   * da faixa (ex.: BPM=250 gravado antes do `min`/`max` existir) impossíveis
   * de editar. `noValidate` no `<form>` devolve o controle da validação ao
   * Zod, que é a arquitetura de validação do app.
   */
  it("renderiza o <form> com o atributo noValidate", () => {
    useIsMobileMock.mockReturnValue(false);
    renderDialog();
    // `DialogContent` renderiza num portal fora do container do `render()`, então
    // subimos a árvore a partir de um elemento visível (o botão "Salvar") em vez
    // de usar `container.querySelector`, que não alcança o conteúdo portado.
    const form = screen.getByRole("button", { name: /salvar/i }).closest("form");
    expect(form?.noValidate).toBe(true);
  });
});

/** Propriedades do harness que liga o hook real `useDirtyFormGuard` ao dialog. */
interface HarnessComGuardProps {
  /** Se o formulário simulado tem alterações a proteger. */
  temAlteracoes: boolean;
}

/**
 * Harness que espelha o uso real nos formulários consumidores: o hook
 * `useDirtyFormGuard` alimenta a prop `dirtyGuard` e o botão "Cancelar" do
 * rodapé chama `guarda.pedirFechamento()` (a quarta saída, que não passa
 * pelo `onOpenChange` do overlay).
 *
 * @param props - Boolean de alterações simuladas.
 * @returns Dialog aberto com um campo de texto e rodapé com Cancelar.
 */
function HarnessComGuard({ temAlteracoes }: HarnessComGuardProps) {
  const [open, setOpen] = useState(true);
  const guarda = useDirtyFormGuard({
    temAlteracoes,
    aoFechar: () => setOpen(false),
  });

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={setOpen}
      title="Título de Teste"
      description="Descrição de teste"
      onSubmit={(e) => e.preventDefault()}
      dirtyGuard={guarda}
      footer={
        <button type="button" onClick={() => guarda.pedirFechamento()}>
          Cancelar
        </button>
      }
    >
      <input aria-label="campo" />
    </ResponsiveFormDialog>
  );
}

describe("ResponsiveFormDialog + dirtyGuard", () => {
  /** Reseta o mock de viewport entre os casos. */
  beforeEach(() => {
    useIsMobileMock.mockReset();
  });

  /** Com guard limpo, Esc fecha direto, sem exibir o veil. */
  it("fecha direto no Esc quando o guard está limpo", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes={false} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Título de Teste")).not.toBeInTheDocument();
  });

  /** Com guard sujo, Esc abre o veil e a modal continua montada. */
  it("abre o veil no Esc com guard sujo, mantendo a modal montada", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
  });

  /** Com guard sujo, o X do DialogContent abre o veil e a modal continua montada. */
  it("abre o veil no X com guard sujo, mantendo a modal montada", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
  });

  /** O Cancelar do rodapé (quarta saída) abre o veil com guard sujo. */
  it("abre o veil no Cancelar do rodapé com guard sujo", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
  });

  /**
   * O conteúdo digitado sobrevive ao veil: o wrapper do formulário é
   * incondicional, então abrir e fechar o veil não desmonta a subárvore
   * nem apaga o valor do campo.
   */
  it("preserva o conteúdo digitado ao abrir e fechar o veil", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes />);

    const campo = screen.getByLabelText("campo");
    fireEvent.change(campo, { target: { value: "texto digitado" } });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByLabelText("campo")).toHaveValue("texto digitado");

    fireEvent.click(
      screen.getByRole("button", { name: "Continuar editando" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
    expect(screen.getByLabelText("campo")).toHaveValue("texto digitado");
  });

  /** Esc sobre o veil volta a editar (fecha o veil) em vez de fechar a modal. */
  it("Esc sobre o veil fecha só o veil, não a modal", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes />);

    fireEvent.keyDown(document, { key: "Escape" });
    const continuar = screen.getByRole("button", { name: "Continuar editando" });

    fireEvent.keyDown(continuar, { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
  });

  /** Descartar no veil fecha a modal de fato. */
  it("Descartar no veil fecha a modal", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<HarnessComGuard temAlteracoes />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Título de Teste")).not.toBeInTheDocument();
  });

  /** No ramo mobile (Drawer/vaul), Esc com guard sujo abre o veil e o drawer permanece. */
  it("no mobile, Esc com guard sujo abre o veil e mantém o drawer montado", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<HarnessComGuard temAlteracoes />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Título de Teste")).toBeInTheDocument();
  });
});
