/**
 * Testes dos hooks de rolagem do container interno da aplicação.
 *
 * O jsdom não implementa layout (scrollTop real é sempre 0), então
 * interceptamos `document.querySelector` para devolver um elemento falso
 * inspecionável, isolando a lógica de salvar/restaurar do hook.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useScrollRestoration,
  useScrollToTopOnMount,
  clearScrollPositions,
} from "@/hooks/use-scroll-restoration";

/**
 * Cria um elemento de rolagem falso e faz `document.querySelector` devolvê-lo.
 *
 * @returns Objeto com o elemento falso (`el`) para inspeção do teste.
 */
function mockScrollRoot() {
  const el = {
    scrollTop: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.spyOn(document, "querySelector").mockReturnValue(el as unknown as Element);
  return { el };
}

afterEach(() => {
  vi.restoreAllMocks();
  // O Map de posições é global ao módulo; limpa entre testes para isolamento.
  clearScrollPositions();
});

/** Verifica que clearScrollPositions descarta posições salvas anteriormente. */
describe("clearScrollPositions", () => {
  /** Após limpar, a chave antes salva volta a levar o container ao topo. */
  it("descarta posições salvas", () => {
    const { el } = mockScrollRoot();
    const a = renderHook(() => useScrollRestoration("escala:clear", true));
    el.scrollTop = 400;
    a.unmount(); // salva 400 para "escala:clear"

    clearScrollPositions();

    el.scrollTop = 0;
    renderHook(() => useScrollRestoration("escala:clear", true));
    expect(el.scrollTop).toBe(0); // sem posição salva → topo
  });
});

describe("useScrollRestoration", () => {
  /** Sem posição salva para a chave, o container vai ao topo. */
  it("leva ao topo quando não há posição salva", () => {
    const { el } = mockScrollRoot();
    el.scrollTop = 123;
    renderHook(() => useScrollRestoration("escala:nova", true));
    expect(el.scrollTop).toBe(0);
  });

  /** Salva no unmount e restaura na remontagem com a mesma chave. */
  it("salva ao desmontar e restaura na próxima montagem", () => {
    const { el } = mockScrollRoot();
    const a = renderHook(() => useScrollRestoration("escala:x", true));
    expect(el.scrollTop).toBe(0); // entrada nova → topo
    el.scrollTop = 300; // usuária rola
    a.unmount(); // cleanup salva 300
    el.scrollTop = 0;
    renderHook(() => useScrollRestoration("escala:x", true));
    expect(el.scrollTop).toBe(300); // restaurado
  });

  /** Só restaura a posição salva quando `ready` é true (conteúdo carregado). */
  it("aguarda ready=true para restaurar", () => {
    const { el } = mockScrollRoot();
    const a = renderHook(() => useScrollRestoration("escala:wait", true));
    el.scrollTop = 250;
    a.unmount();
    el.scrollTop = 0;
    const r = renderHook(
      ({ ready }) => useScrollRestoration("escala:wait", ready),
      { initialProps: { ready: false } },
    );
    expect(el.scrollTop).toBe(0); // ainda não restaurou
    r.rerender({ ready: true });
    expect(el.scrollTop).toBe(250); // restaura quando pronto
  });
});

describe("useScrollToTopOnMount", () => {
  /** Leva o container ao topo ao montar. */
  it("zera o scrollTop ao montar", () => {
    const { el } = mockScrollRoot();
    el.scrollTop = 500;
    renderHook(() => useScrollToTopOnMount());
    expect(el.scrollTop).toBe(0);
  });
});
