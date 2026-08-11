/**
 * Testes do Dashboard focados no filtro de status das escalas (F13):
 * rascunhos ficam fora do Dashboard por inteiro — não inflam o tile
 * "Escalas" nem aparecem na lista "Próximas Escalas" — coerente com os
 * relatórios do backend, que também os excluem.
 *
 * Os hooks de dados são mockados — o alvo do teste é a derivação de
 * `escalasPublicadas` da página, não a camada React Query.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Dashboard from "@/pages/Dashboard";
import { useMusicas } from "@/hooks/use-musicas";
import { useEventos } from "@/hooks/use-eventos";
import { useIntegrantes } from "@/hooks/use-integrantes";
import { useRelatorioResumo } from "@/hooks/use-relatorios";
import type { EventoIndex } from "@/schemas/evento";

/** Mock dos hooks de dados consumidos pelo Dashboard. */
vi.mock("@/hooks/use-musicas", () => ({ useMusicas: vi.fn() }));
vi.mock("@/hooks/use-eventos", () => ({ useEventos: vi.fn() }));
vi.mock("@/hooks/use-integrantes", () => ({ useIntegrantes: vi.fn() }));
vi.mock("@/hooks/use-relatorios", () => ({ useRelatorioResumo: vi.fn() }));

const useMusicasMock = vi.mocked(useMusicas);
const useEventosMock = vi.mocked(useEventos);
const useIntegrantesMock = vi.mocked(useIntegrantes);
const useRelatorioResumoMock = vi.mocked(useRelatorioResumo);

/** Um dia em milissegundos, para gerar datas relativas a agora. */
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Cria um evento de teste com data relativa a agora.
 *
 * @param id - Identificador do evento.
 * @param descricao - Descrição/título do evento.
 * @param diasAPartirDeHoje - Deslocamento em dias (negativo = passado).
 * @param status - Status de publicação do evento.
 * @returns Evento pronto para o mock de `useEventos`.
 */
function makeEvento(
  id: string,
  descricao: string,
  diasAPartirDeHoje: number,
  status: EventoIndex["status"],
): EventoIndex {
  return {
    id,
    data: new Date(Date.now() + diasAPartirDeHoje * UM_DIA_MS).toISOString(),
    descricao,
    tipoEvento: null,
    musicas: [],
    integrantes: [],
    status,
  };
}

/** Duas publicadas (uma futura, uma passada) e um rascunho futuro. */
const futuraPublicada = makeEvento("e1", "Culto futuro publicado", 1, "publicada");
const passadaPublicada = makeEvento("e2", "Culto passado publicado", -1, "publicada");
const rascunhoFuturo = makeEvento("e3", "Culto futuro em rascunho", 2, "rascunho");

describe("Dashboard — rascunhos fora do tile e das próximas escalas", () => {
  /** Reseta os mocks e devolve os retornos padrão com as três escalas de teste. */
  beforeEach(() => {
    useMusicasMock.mockReset();
    useEventosMock.mockReset();
    useIntegrantesMock.mockReset();
    useRelatorioResumoMock.mockReset();
    useMusicasMock.mockReturnValue({
      data: { meta: { total: 12 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useMusicas>);
    useEventosMock.mockReturnValue({
      data: [futuraPublicada, passadaPublicada, rascunhoFuturo],
      isLoading: false,
    } as unknown as ReturnType<typeof useEventos>);
    useIntegrantesMock.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useIntegrantes>);
    useRelatorioResumoMock.mockReturnValue({
      data: { novasMusicasNoMes: 0 },
      isLoading: false,
    } as unknown as ReturnType<typeof useRelatorioResumo>);
  });

  /** O tile "Escalas" conta só as publicadas (2), não as 3 escalas totais. */
  it("conta apenas escalas publicadas no tile Escalas", () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    /** O valor vive no card do tile — escopo pelo heading para não colidir com outros números da página. */
    const tile = screen.getByRole("heading", { name: "Escalas" }).parentElement!;
    expect(within(tile).getByText("2")).toBeInTheDocument();
    expect(within(tile).queryByText("3")).not.toBeInTheDocument();
  });

  /** A lista "Próximas Escalas" mostra a publicada futura e omite o rascunho futuro. */
  it("omite rascunhos da lista de próximas escalas", () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    expect(screen.getByText(futuraPublicada.descricao)).toBeInTheDocument();
    expect(
      screen.queryByText(rascunhoFuturo.descricao),
    ).not.toBeInTheDocument();
  });
});
