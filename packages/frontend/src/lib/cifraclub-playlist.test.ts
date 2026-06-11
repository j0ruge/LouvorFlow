import { describe, it, expect } from "vitest";
import {
  formatCifraclubPlaylist,
  type PlaylistItem,
  type PlaylistStats,
  type EventoInfo,
} from "./cifraclub-playlist";

/** Evento de exemplo reutilizado nos testes. */
const evento: EventoInfo = {
  data: "2026-06-14T19:30:00.000Z",
  descricao: "Ensaio geral",
  tipo_evento: "Culto de Domingo",
};

/** Testes do formatador de playlist CifraClub para texto plano. */
describe("cifraclub-playlist", () => {
  /** Deve renderizar o link quando a música possui cifraclub_url. */
  it("inclui o link das músicas com cifra", () => {
    const playlist: PlaylistItem[] = [
      {
        ordem: 1,
        nome: "Oceanos",
        tom_final: "D",
        artista_nome: "Hillsong",
        cifraclub_url:
          "https://www.cifraclub.com.br/hillsong/oceanos/#key=D",
      },
    ];
    const stats: PlaylistStats = { total: 1, com_link: 1, sem_link: 0 };

    const texto = formatCifraclubPlaylist(evento, playlist, stats);

    expect(texto).toContain("1. Oceanos (D) — Hillsong");
    expect(texto).toContain(
      "https://www.cifraclub.com.br/hillsong/oceanos/#key=D",
    );
    expect(texto).toContain("1 de 1 músicas com cifra");
  });

  /** Deve indicar músicas sem cifra com o microcopy apropriado. */
  it("marca músicas sem cifra cadastrada", () => {
    const playlist: PlaylistItem[] = [
      {
        ordem: 1,
        nome: "Música Sem Link",
        tom_final: null,
        artista_nome: "",
        cifraclub_url: null,
      },
    ];
    const stats: PlaylistStats = { total: 1, com_link: 0, sem_link: 1 };

    const texto = formatCifraclubPlaylist(evento, playlist, stats);

    expect(texto).toContain("1. Música Sem Link");
    expect(texto).toContain("_(sem cifra cadastrada)_");
    expect(texto).toContain("0 de 1 músicas com cifra");
  });

  /** Deve omitir o sufixo de artista quando artista_nome é vazio. */
  it("omite artista quando vazio", () => {
    const playlist: PlaylistItem[] = [
      {
        ordem: 2,
        nome: "Hino",
        tom_final: "G",
        artista_nome: "",
        cifraclub_url: "https://www.cifraclub.com.br/x/hino/",
      },
    ];
    const stats: PlaylistStats = { total: 1, com_link: 1, sem_link: 0 };

    const texto = formatCifraclubPlaylist(evento, playlist, stats);

    expect(texto).toContain("2. Hino (G)");
    expect(texto).not.toContain("Hino (G) —");
  });
});
