import { useEffect, type RefObject } from "react";

/**
 * Verifica se o alvo de um evento é um elemento editável (campo de formulário
 * ou região de texto de um widget ARIA), caso em que atalhos de teclado
 * globais devem ser ignorados para não interferir na digitação normal.
 *
 * Considera editável: `INPUT`, `TEXTAREA`, `SELECT`; elementos com
 * `isContentEditable` habilitado; e qualquer elemento dentro de um
 * `[role="textbox"]` ou `[role="combobox"]` (widgets compostos, como
 * comboboxes customizados, cujo campo de digitação real pode não ser um
 * `<input>` nativo).
 *
 * @param alvo - Alvo do evento de teclado (`event.target`).
 * @returns `true` se o alvo for um elemento editável.
 */
export function isElementoEditavel(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof HTMLElement)) return false;

  if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.tagName === "SELECT") {
    return true;
  }

  if (alvo.isContentEditable) return true;

  if (alvo.closest('[role="textbox"], [role="combobox"]')) return true;

  return false;
}

/**
 * Registra um atalho de teclado global que foca e seleciona o conteúdo do
 * elemento referenciado por `ref` ao pressionar `tecla`.
 *
 * As guardas são avaliadas nesta ordem (a primeira que bater cancela o
 * atalho):
 * 1. Tecla pressionada diferente de `tecla`.
 * 2. Algum modificador (`Ctrl`, `Cmd`/`Meta` ou `Alt`) pressionado junto —
 *    é esta guarda que garante zero conflito com o atalho `Ctrl`/`Cmd+B` da
 *    sidebar (`ui/sidebar.tsx`), que usa a mesma tecla base em alguns layouts
 *    de teclado.
 * 3. `event.repeat` (tecla mantida pressionada, evita disparos repetidos).
 * 4. Foco já em um elemento editável (`isElementoEditavel`).
 * 5. Existe um dialog aberto na página (`[role="dialog"][data-state="open"]`)
 *    — guarda única que cobre qualquer formulário em overlay (ex:
 *    `MusicaForm`, drawers de filtro), evitando roubar o foco de um campo
 *    dentro do overlay.
 *
 * Passadas todas as guardas, previne o comportamento padrão do navegador
 * para a tecla e foca + seleciona o conteúdo do elemento referenciado.
 *
 * @param ref - Referência ao elemento (tipicamente um `<input>` de busca) a focar.
 * @param tecla - Tecla que aciona o atalho. Padrão: `"/"`.
 */
export function useFocusShortcut(ref: RefObject<HTMLInputElement>, tecla = "/"): void {
  useEffect(() => {
    /**
     * Handler de `keydown` global que aplica as guardas do atalho e, se
     * nenhuma delas se aplicar, foca e seleciona o elemento referenciado.
     *
     * @param event - Evento de teclado nativo capturado em `window`.
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== tecla) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.repeat) return;
      if (isElementoEditavel(event.target)) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;

      event.preventDefault();
      ref.current?.focus();
      ref.current?.select();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ref, tecla]);
}
