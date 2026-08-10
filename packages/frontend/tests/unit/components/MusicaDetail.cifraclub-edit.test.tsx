/**
 * Teste de regressão para a edição de versão em `MusicaDetail`.
 *
 * Captura o bug em que editar uma versão existente e preencher o campo
 * "Link CifraClub (opcional)" não persistia o valor: o `handleVersaoSubmit`
 * montava o payload de atualização campo a campo e omitia `cifraclub_url`,
 * então o backend nunca recebia o link (apesar do toast de sucesso) e ao
 * reabrir a edição o campo voltava vazio.
 *
 * O teste renderiza o componente real, abre o diálogo de edição, digita uma
 * URL do CifraClub, salva e verifica que a mutação de atualização recebeu o
 * `cifraclub_url` — comportamento que falha enquanto o campo estiver ausente
 * do payload.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MusicaDetail } from "@/components/MusicaDetail";
import type { Musica } from "@/schemas/musica";

/** Spy compartilhado para a mutação de atualização de versão (hoisted p/ o vi.mock). */
const { updateVersaoMutate } = vi.hoisted(() => ({ updateVersaoMutate: vi.fn() }));

/** Mocka os hooks de músicas; só a mutação de update precisa ser observável. */
vi.mock("@/hooks/use-musicas", () => ({
  useUpdateMusica: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteMusica: () => ({ mutate: vi.fn(), isPending: false }),
  useAddVersao: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateVersao: () => ({ mutate: updateVersaoMutate, isPending: false }),
  useRemoveVersao: () => ({ mutate: vi.fn(), isPending: false }),
  useAddCategoriaMusica: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveCategoriaMusica: () => ({ mutate: vi.fn(), isPending: false }),
  useAddFuncaoMusica: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFuncaoMusica: () => ({ mutate: vi.fn(), isPending: false }),
}));

/** Hooks de apoio retornam listas vazias — não influenciam o fluxo testado. */
vi.mock("@/hooks/use-support", () => ({
  useTonalidades: () => ({ data: [] }),
  useCategorias: () => ({ data: [] }),
  useFuncoes: () => ({ data: [] }),
}));

/** Permite escrita para que os botões de edição da versão sejam renderizados. */
vi.mock("@/hooks/use-can", () => ({
  useCan: () => ({ can: true }),
}));

/** Artistas vazios; admin para liberar o campo de artista no diálogo. */
vi.mock("@/hooks/use-artistas", () => ({
  useArtistas: () => ({ data: [], isLoading: false }),
  useCreateArtista: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isAdmin: true, isSuperAdmin: false }),
}));

/** Música com uma versão já existente (com artista) para exercer o caminho de edição. */
function musicaComVersao(): Musica {
  return {
    id: "0b490d4e-f666-4d65-9b1b-70b98bd07df7",
    nome: "A Ele Glória",
    tonalidade: null,
    categorias: [],
    funcoes: [],
    versoes: [
      {
        id: "9fd9ebb4-6f1b-41fd-9dfb-fc6c77eda710",
        artista: { id: "dc035c6c-71de-4415-9ac0-7dcc7a1991a0", nome: "Diante do Trono" },
        bpm: null,
        cifras: null,
        lyrics: null,
        link_versao: null,
        cifraclub_url: null,
        intensidade: null,
      },
    ],
  };
}

/**
 * Suite que garante que o fluxo de edição de versão envia o `cifraclub_url`
 * para a mutação de atualização — protegendo contra a regressão em que o
 * payload montado à mão em `handleVersaoSubmit` omitia o campo.
 */
describe("MusicaDetail — edição de versão persiste cifraclub_url", () => {
  /** Limpa o spy da mutação antes de cada teste para isolar as asserções. */
  beforeEach(() => {
    updateVersaoMutate.mockClear();
  });

  /** Editar a versão e preencher o link do CifraClub deve enviar `cifraclub_url` na atualização. */
  it("envia cifraclub_url no payload ao editar a versão", async () => {
    const url = "https://www.cifraclub.com.br/diante-do-trono/a-ele-gloria/";
    render(<MusicaDetail musica={musicaComVersao()} onDeleted={vi.fn()} />);

    // Abre o diálogo de edição da versão.
    fireEvent.click(screen.getByLabelText(/Editar versão de Diante do Trono/));

    // Aguarda o diálogo e localiza o campo do CifraClub pelo placeholder.
    const campo = await screen.findByPlaceholderText(
      "https://www.cifraclub.com.br/artista/musica/",
    );
    fireEvent.change(campo, { target: { value: url } });

    // Salva.
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    // A mutação de atualização deve ter recebido o cifraclub_url.
    await waitFor(() => expect(updateVersaoMutate).toHaveBeenCalled());
    const payload = updateVersaoMutate.mock.calls[0][0];
    expect(payload.dados.cifraclub_url).toBe(url);
  });
});
