/**
 * Hooks de rolagem do container interno da aplicação.
 *
 * Em `AppLayout`, o scroll não é da janela: ocorre num `<div data-scroll-root>`
 * interno e compartilhado entre páginas. Estes hooks salvam/restauram a posição
 * de rolagem (back/forward na SPA) e permitem abrir uma página no topo.
 */
import { useEffect, useLayoutEffect, useRef } from "react";

/** Posições de rolagem em memória, keyed por chave de página. */
const scrollPositions = new Map<string, number>();

/**
 * Localiza o container de rolagem interno (`<div data-scroll-root>` do AppLayout).
 *
 * @returns O elemento de rolagem, ou null se ainda não montado.
 */
function getScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-scroll-root]");
}

/**
 * Salva e restaura a posição de rolagem do container interno.
 *
 * - Enquanto montado, salva `scrollTop` (throttle via rAF) e também ao desmontar.
 * - Ao montar: com posição salva e `ready=true`, restaura; sem posição salva,
 *   leva ao topo (corrige o carry-over do container compartilhado).
 *
 * @param key - Chave única da página (ex.: `escala:<id>`).
 * @param ready - Indica que o conteúdo carregou (altura disponível p/ restaurar).
 */
export function useScrollRestoration(key: string, ready: boolean): void {
  const restoredRef = useRef(false);

  useLayoutEffect(() => {
    if (restoredRef.current) return;
    const el = getScrollRoot();
    if (!el) return;
    const saved = scrollPositions.get(key);
    if (saved == null) {
      el.scrollTop = 0;
      restoredRef.current = true;
      return;
    }
    if (!ready) return;
    el.scrollTop = saved;
    restoredRef.current = true;
  }, [key, ready]);

  useEffect(() => {
    const el = getScrollRoot();
    if (!el) return;
    let raf = 0;
    /** Persiste a posição atual de forma throttled (uma vez por frame). */
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => scrollPositions.set(key, el.scrollTop));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      scrollPositions.set(key, el.scrollTop); // captura o valor final
    };
  }, [key]);
}

/**
 * Leva o container de rolagem interno ao topo ao montar.
 *
 * Usado em páginas de detalhe para abrir sempre no topo, já que o container de
 * rolagem é compartilhado entre páginas e pode herdar o `scrollTop` da anterior.
 */
export function useScrollToTopOnMount(): void {
  useLayoutEffect(() => {
    const el = getScrollRoot();
    if (el) el.scrollTop = 0;
  }, []);
}
