/**
 * Configuração global dos testes do frontend.
 *
 * Registra os matchers customizados do @testing-library/jest-dom
 * (ex: toBeInTheDocument, toHaveTextContent) para uso em todos os testes.
 *
 * Importa matchers diretamente em vez de usar o sub-path `@testing-library/jest-dom/vitest`
 * para evitar problemas de resolução de módulos no monorepo com hoisting.
 */
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

/**
 * Polyfill de `ResizeObserver` para ambiente jsdom.
 * Necessário porque bibliotecas como `cmdk` (usada no `CreatableCombobox`)
 * instanciam `ResizeObserver` no mount, mas jsdom não implementa a API.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

/**
 * Polyfill de `Element.scrollIntoView` para ambiente jsdom.
 * `cmdk` (usada no `CreatableCombobox`) chama `scrollIntoView` ao navegar opções
 * com teclado/mount; jsdom não implementa nenhum método de layout.
 */
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {};
}

/**
 * Polyfill de `window.matchMedia` para ambiente jsdom.
 * Necessário porque `useIsMobile` (usado por `DateTimePicker`/`Drawer` e demais
 * componentes que adaptam o layout mobile) instancia `matchMedia` no mount;
 * jsdom não implementa a API. Retorna sempre "não-mobile" (`matches: false`).
 */
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = function matchMedia(query: string): MediaQueryList {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}
