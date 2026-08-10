/**
 * Testes do diálogo de Playlist CifraClub: o badge de cada música deve exibir a
 * tonalidade escolhida pela líder ("Em") — e não a raiz canônica usada apenas no
 * fragmento #key=N da URL ("E"). Regressão do bug "Em exibido como E".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CifraclubPlaylistDialog } from "@/components/CifraclubPlaylistDialog";
import type { CifraclubPlaylistResponse } from "@/services/eventos";

// Mock do hook de dados: substitui a chamada à API por um retorno controlado,
// permitindo exercitar apenas a renderização do diálogo.
const { mockUseCifraclubPlaylist } = vi.hoisted(() => ({
  mockUseCifraclubPlaylist: vi.fn(),
}));

vi.mock("@/hooks/use-eventos", () => ({
  useCifraclubPlaylist: mockUseCifraclubPlaylist,
}));

/**
 * Monta uma resposta de playlist com uma única música "A Ele a Glória".
 *
 * @param tom - Tonalidade escolhida (ex.: "Em") ou null.
 * @param tomFinal - Raiz canônica usada no #key=N (ex.: "E") ou null.
 * @returns Resposta no formato do endpoint de playlist CifraClub.
 */
function buildData(
  tom: string | null,
  tomFinal: string | null,
): CifraclubPlaylistResponse {
  return {
    evento: {
      id: "evento-1",
      data: "2026-06-20T00:00:00.000Z",
      descricao: "Vigília Regional",
      tipo_evento: "Vigília Regional",
    },
    playlist: [
      {
        ordem: 1,
        musica_id: "musica-1",
        nome: "A Ele a Glória",
        tom,
        tom_final: tomFinal,
        tom_ajustado: true,
        artista_nome: "Diante do Trono",
        cifraclub_url:
          "https://www.cifraclub.com.br/diante-do-trono/a-ele-a-gloria/#key=7",
      },
    ],
    stats: { total: 1, com_link: 1, sem_link: 0 },
  };
}

/**
 * Renderiza o diálogo e o abre clicando no botão gatilho "CifraClub".
 */
function openDialog(): void {
  render(<CifraclubPlaylistDialog eventoId="evento-1" />);
  fireEvent.click(screen.getByRole("button", { name: /cifraclub/i }));
}

describe("CifraclubPlaylistDialog", () => {
  /** Garante isolamento entre os casos resetando o mock do hook. */
  beforeEach(() => {
    mockUseCifraclubPlaylist.mockReset();
  });

  /** O badge deve mostrar o tom escolhido "Em", nunca a raiz "E". */
  it("exibe a tonalidade escolhida (Em), não a raiz do #key (E)", () => {
    mockUseCifraclubPlaylist.mockReturnValue({
      data: buildData("Em", "E"),
      isLoading: false,
    });

    openDialog();

    expect(screen.getByText("A Ele a Glória")).toBeInTheDocument();
    expect(screen.getByText("Em")).toBeInTheDocument();
    expect(screen.queryByText("E")).not.toBeInTheDocument();
  });

  /** Sem tonalidade definida, o badge de tom não deve ser renderizado. */
  it("oculta o badge quando o tom é nulo", () => {
    mockUseCifraclubPlaylist.mockReturnValue({
      data: buildData(null, null),
      isLoading: false,
    });

    openDialog();

    expect(screen.getByText("A Ele a Glória")).toBeInTheDocument();
    expect(screen.queryByText("Em")).not.toBeInTheDocument();
    expect(screen.queryByText("E")).not.toBeInTheDocument();
  });
});
