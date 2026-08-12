/**
 * Testes do `EventoForm` nos três modos derivados de props (criar/editar/
 * duplicar) e do submit alternativo "Salvar rascunho" (F13).
 *
 * Cobre o contrato do modo derivado — título/descrição/CTA por modo, o
 * pré-preenchimento do modo duplicar (descrição da origem, data VAZIA) e a
 * exclusividade do botão "Salvar rascunho" no modo criação — além da
 * validação Zod compartilhada: o submit de rascunho passa pelo mesmo
 * resolver e não chama a mutation com o formulário inválido.
 *
 * Os hooks de dados (`use-eventos`/`use-support`) são mockados — o alvo do
 * teste é o formulário, não a camada React Query.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { EventoForm } from "@/components/EventoForm";
import {
  useCreateEvento,
  useUpdateEvento,
  useDuplicarEvento,
} from "@/hooks/use-eventos";
import { useTiposEventos } from "@/hooks/use-support";
import type { EventoIndex } from "@/schemas/evento";

/**
 * Mock dos hooks de eventos e de tipos de evento — o teste exercita apenas
 * o formulário, sem tráfego de rede nem cache real do React Query.
 */
vi.mock("@/hooks/use-eventos", () => ({
  useCreateEvento: vi.fn(),
  useUpdateEvento: vi.fn(),
  useDuplicarEvento: vi.fn(),
}));
vi.mock("@/hooks/use-support", () => ({
  useTiposEventos: vi.fn(),
}));

const useCreateEventoMock = vi.mocked(useCreateEvento);
const useUpdateEventoMock = vi.mocked(useUpdateEvento);
const useDuplicarEventoMock = vi.mocked(useDuplicarEvento);
const useTiposEventosMock = vi.mocked(useTiposEventos);

/** Escala de origem usada nos modos edição e duplicação. */
const eventoOrigem: EventoIndex = {
  id: "3f8a2c9e-5b1d-4e6f-8a7b-9c0d1e2f3a4b",
  data: "2026-04-13T19:00:00.000Z",
  descricao: "Culto de Páscoa",
  tipoEvento: { id: "5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d", nome: "Culto" },
  musicas: [],
  integrantes: [],
  status: "publicada",
};

/**
 * Wrapper com o `MemoryRouter` exigido pelo `useNavigate` do formulário.
 *
 * @param props - Filhos a renderizar dentro do router.
 * @returns Elemento React com o router de teste.
 */
function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

/** Mutation ociosa reutilizada como retorno padrão dos hooks mockados. */
function mutationOciosa() {
  return { mutate: vi.fn(), isPending: false };
}

describe("EventoForm — modos derivados de props", () => {
  /** Reseta os mocks e devolve os retornos padrão (mutations ociosas, um tipo de evento). */
  beforeEach(() => {
    useCreateEventoMock.mockReset();
    useUpdateEventoMock.mockReset();
    useDuplicarEventoMock.mockReset();
    useTiposEventosMock.mockReset();
    useCreateEventoMock.mockReturnValue(
      mutationOciosa() as unknown as ReturnType<typeof useCreateEvento>,
    );
    useUpdateEventoMock.mockReturnValue(
      mutationOciosa() as unknown as ReturnType<typeof useUpdateEvento>,
    );
    useDuplicarEventoMock.mockReturnValue(
      mutationOciosa() as unknown as ReturnType<typeof useDuplicarEvento>,
    );
    useTiposEventosMock.mockReturnValue({
      data: [eventoOrigem.tipoEvento],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useTiposEventos>);
  });

  /** Sem `evento` nem `duplicarDe`, o modo é criação: CTA "Salvar" e botão "Salvar rascunho". */
  it('modo criar: exibe "Nova Escala", CTA "Salvar" e o botão "Salvar rascunho"', async () => {
    render(<EventoForm open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    expect(
      await screen.findByRole("heading", { name: "Nova Escala" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar rascunho" }),
    ).toBeInTheDocument();
  });

  /** Com `evento`, o modo é edição: sem "Salvar rascunho" e campos preenchidos. */
  it('modo editar: exibe "Editar Escala", sem "Salvar rascunho", com dados do evento', async () => {
    render(<EventoForm open onOpenChange={vi.fn()} evento={eventoOrigem} />, {
      wrapper: Wrapper,
    });

    expect(
      await screen.findByRole("heading", { name: "Editar Escala" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Salvar rascunho" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Descrição (opcional)")).toHaveValue(
      eventoOrigem.descricao,
    );
    /** Data preenchida: o gatilho do DateTimePicker não mostra o placeholder. */
    expect(
      screen.queryByText("Selecione a data e hora"),
    ).not.toBeInTheDocument();
  });

  /** Com `duplicarDe`, o modo é duplicação: descrição herdada, data VAZIA, CTA "Criar cópia". */
  it('modo duplicar: pré-preenche a origem, deixa a data vazia e usa o CTA "Criar cópia"', async () => {
    render(
      <EventoForm open onOpenChange={vi.fn()} duplicarDe={eventoOrigem} />,
      { wrapper: Wrapper },
    );

    expect(
      await screen.findByRole("heading", { name: "Duplicar Escala" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Revise a data. O repertório e a equipe da escala original serão copiados.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar cópia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Salvar rascunho" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Descrição (opcional)")).toHaveValue(
      eventoOrigem.descricao,
    );
    /** O usuário revisa a data: o gatilho do DateTimePicker mostra o placeholder. */
    expect(screen.getByText("Selecione a data e hora")).toBeInTheDocument();
  });

  /** `evento` tem precedência sobre `duplicarDe` na derivação do modo. */
  it("deriva o modo edição quando evento e duplicarDe são passados juntos", async () => {
    render(
      <EventoForm
        open
        onOpenChange={vi.fn()}
        evento={eventoOrigem}
        duplicarDe={eventoOrigem}
      />,
      { wrapper: Wrapper },
    );

    expect(
      await screen.findByRole("heading", { name: "Editar Escala" }),
    ).toBeInTheDocument();
  });

  /** "Salvar rascunho" passa pela MESMA validação Zod: inválido, não chama a mutation. */
  it("não cria rascunho com o formulário inválido e exibe os erros Zod", async () => {
    const criarMutation = mutationOciosa();
    useCreateEventoMock.mockReturnValue(
      criarMutation as unknown as ReturnType<typeof useCreateEvento>,
    );
    render(<EventoForm open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    fireEvent.click(
      await screen.findByRole("button", { name: "Salvar rascunho" }),
    );

    expect(await screen.findByText("Data é obrigatória")).toBeInTheDocument();
    expect(
      screen.getByText("Selecione um tipo de evento"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(criarMutation.mutate).not.toHaveBeenCalled();
    });
  });
});
