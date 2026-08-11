/**
 * Testes do formulário de criação de usuário da página `admin/Users.tsx`,
 * migrada para `ResponsiveFormDialog` + `ui/form.tsx` na fase de campos
 * obrigatórios da auditoria de UX.
 *
 * Cobre o contrato de acessibilidade e validação que a migração entrega:
 * submeter vazio exibe as três mensagens Zod, marca os três controles com
 * `aria-invalid="true"` e move o foco para o primeiro campo inválido
 * (`shouldFocusError`, default do react-hook-form); digitar limpa o erro
 * (`reValidateMode: "onChange"`, também default); e o `aria-describedby`
 * do controle aponta para o id da `FormMessage` correspondente
 * (ligação feita pelo `FormControl` de `ui/form.tsx`).
 *
 * Os hooks de dados (`useUsers`/`useCreateUser`) são mockados — o alvo do
 * teste é o formulário, não a camada React Query.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AdminUsers from "@/pages/admin/Users";
import { useUsers, useCreateUser } from "@/hooks/use-admin";

/**
 * Mock dos hooks de administração — o teste exercita apenas o formulário,
 * sem tráfego de rede nem cache real do React Query.
 */
vi.mock("@/hooks/use-admin", () => ({
  useUsers: vi.fn(),
  useCreateUser: vi.fn(),
}));

const useUsersMock = vi.mocked(useUsers);
const useCreateUserMock = vi.mocked(useCreateUser);

/**
 * Cria um wrapper de teste com um `QueryClient` isolado por caso e o
 * `MemoryRouter` exigido pelos `Link` da página — mesmo padrão do
 * `createWrapper()` de `src/hooks/__tests__/use-musicas.test.tsx`.
 *
 * @returns Componente wrapper para uso com `render`.
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

/**
 * Renderiza a página de usuários e abre o dialog de criação clicando em
 * "Novo Usuário".
 *
 * @returns Referências aos três controles do formulário.
 */
function renderComDialogAberto() {
  render(<AdminUsers />, { wrapper: createWrapper() });
  fireEvent.click(screen.getByRole("button", { name: "Novo Usuário" }));

  return {
    nome: screen.getByRole("textbox", { name: /nome/i }),
    email: screen.getByRole("textbox", { name: /e-mail/i }),
    // `/^senha/i` evita casar com o `aria-label` "Mostrar senha" do toggle
    // de visibilidade do `PasswordInput`.
    senha: screen.getByLabelText(/^senha/i),
  };
}

describe("AdminUsers — formulário de criação", () => {
  /** Reseta os mocks e devolve os retornos padrão (lista vazia, mutation ociosa). */
  beforeEach(() => {
    useUsersMock.mockReset();
    useCreateUserMock.mockReset();
    useUsersMock.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useUsers>);
    useCreateUserMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateUser>);
  });

  /** Submeter vazio exibe as três mensagens Zod e marca os três controles como inválidos. */
  it("exibe as três mensagens de erro e aria-invalid ao submeter vazio", async () => {
    const { nome, email, senha } = renderComDialogAberto();

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
    expect(
      screen.getByText("Senha deve ter no mínimo 6 caracteres"),
    ).toBeInTheDocument();

    expect(nome).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(senha).toHaveAttribute("aria-invalid", "true");
  });

  /** O foco vai para o primeiro campo inválido (`shouldFocusError`, default do RHF). */
  it("move o foco para o primeiro campo inválido ao submeter vazio", async () => {
    const { nome } = renderComDialogAberto();

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(nome).toHaveFocus();
    });
  });

  /** Digitar no campo limpa a mensagem de erro (`reValidateMode: "onChange"`, default do RHF). */
  it("limpa o erro do campo ao digitar", async () => {
    const { nome } = renderComDialogAberto();

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();

    fireEvent.change(nome, { target: { value: "Fulana de Tal" } });

    await waitFor(() => {
      expect(screen.queryByText("Nome é obrigatório")).not.toBeInTheDocument();
    });
  });

  /** O `aria-describedby` do controle inclui o id da `FormMessage` com o erro. */
  it("liga o controle à mensagem de erro via aria-describedby", async () => {
    const { nome } = renderComDialogAberto();

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    const mensagem = await screen.findByText("Nome é obrigatório");
    expect(mensagem.id).not.toBe("");
    expect(nome.getAttribute("aria-describedby")).toContain(mensagem.id);
  });

  /**
   * Fechar o dialog após um submit inválido limpa os erros: o `aoFechar` do
   * guard faz `form.reset()` mesmo no fechamento "limpo" (`isDirty` false),
   * senão `formState.errors` persistiria (a página não desmonta o form) e a
   * reabertura mostraria mensagens fantasma.
   */
  it("não mantém erros fantasma ao fechar e reabrir o dialog", async () => {
    renderComDialogAberto();

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();

    /** Nada foi digitado (isDirty false): Cancelar fecha direto, sem veil. */
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Novo Usuário" }));

    expect(screen.getByRole("textbox", { name: /nome/i })).toBeInTheDocument();
    expect(screen.queryByText("Nome é obrigatório")).not.toBeInTheDocument();
    expect(screen.queryByText("Email é obrigatório")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Senha deve ter no mínimo 6 caracteres"),
    ).not.toBeInTheDocument();
  });

  /** A legenda da convenção de obrigatoriedade abre junto com o formulário. */
  it("exibe a legenda '* campo obrigatório' no topo do formulário", () => {
    renderComDialogAberto();

    expect(screen.getByText("* campo obrigatório")).toBeInTheDocument();
  });

  /** Os três controles anunciam obrigatoriedade explícita via aria-required. */
  it("marca os três controles com aria-required", () => {
    const { nome, email, senha } = renderComDialogAberto();

    expect(nome).toHaveAttribute("aria-required");
    expect(email).toHaveAttribute("aria-required");
    expect(senha).toHaveAttribute("aria-required");
  });
});
