/**
 * Testes de regressão para o hook `useMusicas`.
 *
 * Garantem que a assinatura por objeto (`GetMusicasParams`) propaga
 * corretamente `page`, `limit` e `q` para a query string da API. Esse
 * teste captura especificamente a regressão histórica em que call sites
 * chamavam o hook com argumentos posicionais (`useMusicas(1, 100)`),
 * desestruturando um número primitivo e caindo nos defaults
 * (`limit=20`), o que truncava a listagem na tela de edição de escala.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useMusicas } from "@/hooks/use-musicas";
import { apiFetch } from "@/lib/api";

/**
 * Mock do módulo de transporte HTTP — substitui `apiFetch` por uma
 * função sob controle do teste, devolvendo uma resposta paginada
 * vazia válida sob o schema Zod do cliente.
 */
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

/**
 * Retorna uma resposta paginada vazia que satisfaz `MusicasPaginadasSchema`.
 *
 * @param overrides - Sobrescritas pontuais nos campos de `meta`.
 * @returns Objeto pronto para ser devolvido pelo mock de `apiFetch`.
 */
function emptyPage(overrides: Partial<{ total: number; page: number; per_page: number; total_pages: number }> = {}) {
  return {
    items: [],
    meta: {
      total: 0,
      page: 1,
      per_page: 20,
      total_pages: 0,
      ...overrides,
    },
  };
}

/**
 * Cria um wrapper de teste com um `QueryClient` isolado por caso.
 * Desabilita retry para que falhas sejam imediatamente observáveis.
 *
 * @returns Componente wrapper para uso com `renderHook`.
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Extrai o último path absoluto chamado em `apiFetch`.
 *
 * @returns Caminho da última chamada (ex: `/musicas?page=1&limit=100`).
 */
function lastFetchedPath(): string {
  const call = apiFetchMock.mock.calls.at(-1);
  if (!call) throw new Error("apiFetch não foi chamado");
  return call[0] as string;
}

/**
 * Suíte que valida a serialização de parâmetros do hook `useMusicas`
 * (page, limit, categorias, q) na query string enviada à API via
 * `apiFetch`, garantindo defaults e a coexistência de filtros.
 */
describe("useMusicas — assinatura por objeto", () => {
  /**
   * Reseta o mock antes de cada caso e prepara uma resposta paginada
   * vazia válida como retorno padrão de `apiFetch`.
   */
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue(emptyPage());
  });

  /**
   * Verifica que valores explícitos de `page` e `limit` são
   * propagados para a query string da API e que o default de
   * `limit=20` não vaza.
   */
  it("deve propagar page e limit explícitos para a query string", async () => {
    const { result } = renderHook(() => useMusicas({ page: 2, limit: 100 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).toContain("page=2");
    expect(path).toContain("limit=100");
    expect(path).not.toContain("limit=20");
  });

  /**
   * Verifica que, sem argumentos, o hook aplica os defaults
   * documentados: `page=1` e `limit=20`.
   */
  it("deve usar defaults page=1 e limit=20 quando chamado sem argumentos", async () => {
    const { result } = renderHook(() => useMusicas(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).toContain("page=1");
    expect(path).toContain("limit=20");
  });

  /**
   * Verifica que o termo de busca textual `q` é serializado na
   * query string e coexiste com `limit` customizado.
   */
  it("deve serializar o parâmetro q (busca textual)", async () => {
    const { result } = renderHook(
      () => useMusicas({ page: 1, limit: 100, q: "amor" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).toContain("q=amor");
    expect(path).toContain("limit=100");
  });

  /**
   * Verifica que múltiplas categorias são serializadas como CSV.
   * O encoding `%2C` é gerado por `URLSearchParams` ao tratar a vírgula
   * como caractere especial em valores; o backend decodifica antes de
   * fazer `split(',')`.
   */
  it("deve serializar o parâmetro categorias como CSV", async () => {
    const { result } = renderHook(
      () =>
        useMusicas({
          page: 1,
          limit: 50,
          categorias: [
            "11111111-1111-1111-1111-111111111111",
            "22222222-2222-2222-2222-222222222222",
          ],
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).toContain(
      "categorias=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222",
    );
  });

  /**
   * Verifica que `q` e `categorias` coexistem na mesma requisição
   * — combinação esperada quando o usuário digita uma busca textual
   * com chips de categoria já ativos.
   */
  it("deve serializar q e categorias simultaneamente", async () => {
    const { result } = renderHook(
      () =>
        useMusicas({
          page: 1,
          limit: 20,
          q: "amor",
          categorias: ["11111111-1111-1111-1111-111111111111"],
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).toContain("q=amor");
    expect(path).toContain("categorias=11111111-1111-1111-1111-111111111111");
  });

  /**
   * Verifica que `categorias` como array vazio não vira parâmetro na URL
   * — equivalente a "sem filtro".
   */
  it("não deve enviar categorias quando o array é vazio", async () => {
    const { result } = renderHook(
      () => useMusicas({ page: 1, limit: 20, categorias: [] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).not.toContain("categorias=");
  });

  /**
   * Verifica que múltiplas intensidades são serializadas como CSV (ordenadas),
   * com a vírgula codificada como `%2C` por `URLSearchParams` — o backend
   * decodifica antes de `split(',')`.
   */
  it("deve serializar o parâmetro intensidades como CSV", async () => {
    const { result } = renderHook(
      () => useMusicas({ page: 1, limit: 20, intensidades: ["calma", "agitada"] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).toContain("intensidades=agitada%2Ccalma");
  });

  /**
   * Verifica que `intensidades` como array vazio não vira parâmetro na URL
   * — equivalente a "sem filtro".
   */
  it("não deve enviar intensidades quando o array é vazio", async () => {
    const { result } = renderHook(
      () => useMusicas({ page: 1, limit: 20, intensidades: [] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const path = lastFetchedPath();
    expect(path).not.toContain("intensidades=");
  });
});
