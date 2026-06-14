/**
 * Testes do preview de lista CifraClub no formulário de evento (T035).
 *
 * Cobre o comportamento debounced de `EventoForm`: ao digitar uma URL de lista
 * válida, o componente busca o preview via `fetchListPreview` e exibe nome,
 * dono, total de músicas e visibilidade; mostra aviso quando a lista não é
 * pública; e, para listas-sistema, exibe texto fixo sem disparar a busca.
 *
 * O hook de debounce é mockado como passthrough (sem temporizador) para tornar
 * o efeito síncrono, e `fetchListPreview` é mockado para isolar a rede —
 * `validateCifraclubListUrl` permanece real (decide idle/system/válido).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EventoForm } from "@/components/EventoForm";

/** Spy hoisted para a busca de preview, observável dentro do `vi.mock`. */
const { fetchListPreviewMock } = vi.hoisted(() => ({
  fetchListPreviewMock: vi.fn(),
}));

/** `useNavigate` é mockado: o componente não navega nos fluxos testados. */
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

/** Mutações e hooks de apoio mockados — não influenciam o preview. */
vi.mock("@/hooks/use-eventos", () => ({
  useCreateEvento: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateEvento: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-support", () => ({
  useTiposEventos: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));

/** Permite escrita para renderizar o input habilitado (sem tooltip de bloqueio). */
vi.mock("@/hooks/use-can", () => ({
  useCan: () => ({ can: true }),
}));

/** Debounce passthrough: torna o efeito de preview síncrono no teste. */
vi.mock("@/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: unknown) => value,
}));

/** Mantém `validateCifraclubListUrl` real; só `fetchListPreview` é mockado. */
vi.mock("@/lib/cifraclub-list-url", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cifraclub-list-url")>();
  return { ...actual, fetchListPreview: fetchListPreviewMock };
});

/** URL de lista custom válida usada nos testes de preview. */
const URL_LISTA_VALIDA = "https://www.cifraclub.com.br/musico/123/repertorio/456/";

/** URL de lista do sistema (slug `favoritas`) — não deve buscar preview. */
const URL_LISTA_SISTEMA =
  "https://www.cifraclub.com.br/musico/123/repertorio/favoritas/";

/**
 * Localiza o input de URL da lista CifraClub pelo placeholder e digita `valor`.
 *
 * @param valor - Texto a inserir no campo.
 */
function digitarUrlLista(valor: string) {
  const campo = screen.getByPlaceholderText(/cifraclub\.com\.br\/musico/);
  fireEvent.change(campo, { target: { value: valor } });
}

/**
 * Suite do preview de lista CifraClub em `EventoForm`.
 */
describe("EventoForm — preview da lista CifraClub (T035)", () => {
  /** Reseta o spy de busca antes de cada teste para isolar as asserções. */
  beforeEach(() => {
    fetchListPreviewMock.mockReset();
  });

  /** URL válida e pública deve exibir nome, dono, total de músicas e "pública". */
  it("exibe os metadados da lista para URL válida e pública", async () => {
    fetchListPreviewMock.mockResolvedValue({
      name: "Repertório de Domingo",
      ownerName: "João",
      totalSongs: 12,
      isPublic: true,
    });

    render(<EventoForm open onOpenChange={vi.fn()} />);
    digitarUrlLista(URL_LISTA_VALIDA);

    await waitFor(() =>
      expect(fetchListPreviewMock).toHaveBeenCalledWith(
        URL_LISTA_VALIDA,
        expect.any(AbortSignal),
      ),
    );

    expect(await screen.findByText(/Repertório de Domingo/)).toBeInTheDocument();
    expect(screen.getByText(/por João/)).toBeInTheDocument();
    expect(screen.getByText(/12 músicas/)).toBeInTheDocument();
    expect(screen.getByText(/pública/)).toBeInTheDocument();
    expect(
      screen.queryByText(/não marcada como pública/),
    ).not.toBeInTheDocument();
  });

  /** Lista não pública deve exibir o aviso de visibilidade. */
  it("exibe aviso quando a lista não é pública", async () => {
    fetchListPreviewMock.mockResolvedValue({
      name: "Lista Privada",
      ownerName: "Maria",
      totalSongs: 3,
      isPublic: false,
    });

    render(<EventoForm open onOpenChange={vi.fn()} />);
    digitarUrlLista(URL_LISTA_VALIDA);

    expect(
      await screen.findByText(/⚠ Lista não marcada como pública/),
    ).toBeInTheDocument();
  });

  /** Lista do sistema deve mostrar texto fixo e não disparar a busca. */
  it("não busca preview para lista do sistema", async () => {
    render(<EventoForm open onOpenChange={vi.fn()} />);
    digitarUrlLista(URL_LISTA_SISTEMA);

    expect(
      await screen.findByText(/Lista do sistema — preview indisponível/),
    ).toBeInTheDocument();
    expect(fetchListPreviewMock).not.toHaveBeenCalled();
  });
});
