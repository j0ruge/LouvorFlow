/**
 * Hooks de rolagem do container interno da aplicação.
 *
 * Em `AppLayout`, o scroll não é da janela: ocorre num `<div data-scroll-root>`
 * interno e compartilhado entre páginas. Estes hooks salvam/restauram a posição
 * de rolagem (back/forward na SPA) e permitem abrir uma página no topo.
 */
import { useLayoutEffect, useRef } from "react";

/** Posições de rolagem em memória, keyed por chave de página. */
const scrollPositions = new Map<string, number>();

/**
 * Limpa todas as posições de rolagem salvas.
 *
 * Deve ser chamada no logout e na troca de tenant: o `Map` é global ao processo
 * e keyed apenas pela chave da página (ex.: `escala:1`), então sem a limpeza uma
 * página de mesmo id em outro tenant poderia restaurar a rolagem do tenant
 * anterior. Também evita o crescimento ilimitado do `Map` ao longo da sessão.
 */
export function clearScrollPositions(): void {
  scrollPositions.clear();
}

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
 * - Ao montar: com posição salva e `ready=true`, restaura; sem posição salva,
 *   leva ao topo (corrige o carry-over do container compartilhado).
 * - Ao sair: salva `scrollTop` no cleanup de um `useLayoutEffect`. Isso roda na
 *   fase de mutação do commit — **antes** de a página seguinte (ex.: `SongDetail`
 *   com `useScrollToTopOnMount`) zerar o container compartilhado —, garantindo
 *   que a posição salva seja a real, e não 0.
 * - Ao trocar de `key` sem desmontar (ex.: o React Router reaproveita a instância
 *   ao navegar de `/escalas/1` para `/escalas/2`): o flag de "já restaurado" é
 *   resetado no render para que a nova página seja restaurada/zerada corretamente.
 *
 * @param key - Chave única da página (ex.: `escala:<id>`).
 * @param ready - Indica que o conteúdo carregou (altura disponível p/ restaurar).
 */
export function useScrollRestoration(key: string, ready: boolean): void {
  const restoredRef = useRef(false);
  /** Última `key` processada; ao mudar, reseta o flag para tratar a nova página. */
  const lastKeyRef = useRef(key);

  // Reset síncrono durante o render: se a `key` mudou sem o componente
  // desmontar, `restoredRef` ainda estaria `true` da página anterior e o efeito
  // de restauração sairia cedo, deixando a nova página com o scroll herdado.
  if (lastKeyRef.current !== key) {
    lastKeyRef.current = key;
    restoredRef.current = false;
  }

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

  useLayoutEffect(() => {
    return () => {
      const el = getScrollRoot();
      if (el) scrollPositions.set(key, el.scrollTop);
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
