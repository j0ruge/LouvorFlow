/**
 * Testes do hook `useFocusShortcut` e do helper `isElementoEditavel`.
 *
 * Cobre as guardas do atalho, nesta ordem de avaliação: tecla diferente da
 * configurada, modificadores (Ctrl/Cmd/Alt — garante zero conflito com o
 * Ctrl/Cmd+B da sidebar), `event.repeat`, foco em elemento editável e
 * presença de um dialog aberto na página; além do caminho feliz (foca e
 * seleciona o conteúdo do input referenciado).
 */
import { describe, it, expect, afterEach } from "vitest";
import { useRef } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { useFocusShortcut, isElementoEditavel } from "@/hooks/use-focus-shortcut";

/**
 * Componente de apoio que registra o atalho padrão ("/") sobre um input de
 * busca, para exercitar o hook em um DOM real.
 */
function BuscaDeTeste() {
  const ref = useRef<HTMLInputElement>(null);
  useFocusShortcut(ref);
  return <input ref={ref} defaultValue="conteudo previamente digitado" aria-label="Buscar" />;
}

/** Desmonta os componentes renderizados após cada teste, evitando vazamento de listeners entre casos. */
afterEach(() => {
  cleanup();
});

describe("useFocusShortcut", () => {
  /** Caminho feliz: fora de campos editáveis e sem dialog aberto, a tecla configurada foca e seleciona o input. */
  it("foca e seleciona o input ao pressionar a tecla configurada", () => {
    render(<BuscaDeTeste />);
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;

    fireEvent.keyDown(window, { key: "/" });

    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  /** Tecla diferente da configurada não deve disparar o atalho. */
  it("ignora teclas diferentes da configurada", () => {
    render(<BuscaDeTeste />);
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;

    fireEvent.keyDown(window, { key: "k" });

    expect(document.activeElement).not.toBe(input);
  });

  /** Ctrl, Cmd (Meta) ou Alt pressionados junto da tecla cancelam o atalho — é esta guarda que evita colisão com o Ctrl/Cmd+B da sidebar. */
  it("ignora o atalho quando Ctrl, Cmd ou Alt estão pressionados", () => {
    render(<BuscaDeTeste />);
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;

    fireEvent.keyDown(window, { key: "/", ctrlKey: true });
    expect(document.activeElement).not.toBe(input);

    fireEvent.keyDown(window, { key: "/", metaKey: true });
    expect(document.activeElement).not.toBe(input);

    fireEvent.keyDown(window, { key: "/", altKey: true });
    expect(document.activeElement).not.toBe(input);
  });

  /** Tecla mantida pressionada (repeat) não deve disparar o atalho. */
  it("ignora eventos com event.repeat = true", () => {
    render(<BuscaDeTeste />);
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;

    fireEvent.keyDown(window, { key: "/", repeat: true });

    expect(document.activeElement).not.toBe(input);
  });

  /** Foco já em um campo editável não deve ser roubado pelo atalho. */
  it("ignora o atalho quando o foco está em um campo editável", () => {
    render(
      <>
        <BuscaDeTeste />
        <textarea aria-label="Outro campo" />
      </>,
    );
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;
    const outroCampo = screen.getByLabelText("Outro campo");
    outroCampo.focus();

    fireEvent.keyDown(outroCampo, { key: "/" });

    expect(document.activeElement).toBe(outroCampo);
    expect(document.activeElement).not.toBe(input);
  });

  /** Um dialog aberto na página bloqueia o atalho, evitando roubar o foco de um formulário em overlay (MusicaForm, drawers de filtro). */
  it("ignora o atalho quando há um dialog aberto na página", () => {
    render(<BuscaDeTeste />);
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    fireEvent.keyDown(window, { key: "/" });

    expect(document.activeElement).not.toBe(input);

    document.body.removeChild(dialog);
  });

  /** Um dialog fechado (data-state="closed") não deve bloquear o atalho. */
  it("permite o atalho quando o único dialog presente está fechado", () => {
    render(<BuscaDeTeste />);
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "closed");
    document.body.appendChild(dialog);

    fireEvent.keyDown(window, { key: "/" });

    expect(document.activeElement).toBe(input);

    document.body.removeChild(dialog);
  });
});

describe("isElementoEditavel", () => {
  /** Reconhece INPUT, TEXTAREA e SELECT como elementos editáveis. */
  it("retorna true para INPUT, TEXTAREA e SELECT", () => {
    expect(isElementoEditavel(document.createElement("input"))).toBe(true);
    expect(isElementoEditavel(document.createElement("textarea"))).toBe(true);
    expect(isElementoEditavel(document.createElement("select"))).toBe(true);
  });

  /** Reconhece elementos com `isContentEditable` habilitado. */
  it("retorna true para elementos contentEditable", () => {
    const div = document.createElement("div");
    Object.defineProperty(div, "isContentEditable", { value: true });
    expect(isElementoEditavel(div)).toBe(true);
  });

  /** Reconhece elementos dentro de um widget `role="textbox"` ou `role="combobox"`. */
  it("retorna true para elementos dentro de role=textbox ou role=combobox", () => {
    const combobox = document.createElement("div");
    combobox.setAttribute("role", "combobox");
    const filhoDoCombobox = document.createElement("span");
    combobox.appendChild(filhoDoCombobox);
    expect(isElementoEditavel(filhoDoCombobox)).toBe(true);

    const textbox = document.createElement("div");
    textbox.setAttribute("role", "textbox");
    expect(isElementoEditavel(textbox)).toBe(true);
  });

  /** Retorna false para elementos comuns e para alvos que não são elementos DOM. */
  it("retorna false para elementos não editáveis e alvos inválidos", () => {
    expect(isElementoEditavel(document.createElement("div"))).toBe(false);
    expect(isElementoEditavel(document.createElement("button"))).toBe(false);
    expect(isElementoEditavel(null)).toBe(false);
  });
});
