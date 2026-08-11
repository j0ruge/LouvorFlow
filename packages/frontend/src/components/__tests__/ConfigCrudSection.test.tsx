/**
 * Testes do `ConfigCrudSection` — seção CRUD genérica usada nas abas da
 * página de Configurações.
 *
 * Cobre a regressão do bug de `onCreate`/`onUpdate` rejeitados sem
 * try/catch (unhandled rejection + texto digitado perdido, tanto na criação
 * quanto na edição inline), a checagem client-side de duplicado
 * case/acento-insensível no formulário de criação (com concordância de
 * gênero na mensagem e no placeholder) e o destaque temporário (2s)
 * aplicado ao item recém-criado.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { ConfigCrudSection } from "@/components/ConfigCrudSection";

/** Entidade mínima usada nos testes (id + nome). */
interface EntidadeTeste {
  /** Identificador único da entidade de teste. */
  id: string;
  /** Nome exibido/comparado da entidade de teste. */
  nome: string;
}

/** Subconjunto de props do `ConfigCrudSection` que os testes deste arquivo variam. */
interface RenderSectionOverrides {
  /** Lista de itens a exibir (substitui o padrão de um item). */
  items?: EntidadeTeste[];
  /** Indica se os itens estão sendo carregados. */
  isLoading?: boolean;
  /** Callback de criação a espionar/substituir. */
  onCreate?: (name: string) => Promise<void>;
  /** Callback de atualização a espionar/substituir. */
  onUpdate?: (id: string, name: string) => Promise<void>;
  /** Callback de exclusão a espionar/substituir. */
  onDelete?: (id: string) => Promise<void>;
  /** Alterna o modo somente-leitura. */
  readOnly?: boolean;
}

/** Configuração de entidade reaproveitada por todos os testes deste arquivo. */
const config = {
  label: "Artista",
  genero: "m" as const,
  getName: (item: EntidadeTeste) => item.nome,
  getId: (item: EntidadeTeste) => item.id,
  emptyTitle: "Nenhum artista cadastrado",
  emptyDescription: "Adicione artistas usando o campo acima.",
};

/** Item existente reaproveitado nos testes de duplicado. */
const ITEM_EXISTENTE: EntidadeTeste = { id: "1", nome: "Adoração" };

/**
 * Renderiza o `ConfigCrudSection` com props mínimas, permitindo sobrescrever
 * qualquer uma via `overrides` (padrão usado para variar `items`/callbacks
 * entre os testes sem repetir todas as props obrigatórias).
 *
 * @param overrides - Props parciais que sobrescrevem os valores padrão.
 * @returns O resultado do `render` do Testing Library.
 */
function renderSection(overrides: RenderSectionOverrides = {}) {
  return render(
    <ConfigCrudSection<EntidadeTeste>
      config={config}
      items={[ITEM_EXISTENTE]}
      isLoading={false}
      onCreate={vi.fn().mockResolvedValue(undefined)}
      onUpdate={vi.fn().mockResolvedValue(undefined)}
      onDelete={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}

describe("ConfigCrudSection", () => {
  /** Restaura timers reais após cada teste, mesmo que um teste anterior tenha usado `vi.useFakeTimers()`. */
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Nome idêntico a um item existente não deve chamar `onCreate`. */
  it("bloqueia duplicado exato e exibe erro inline sem chamar onCreate", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderSection({ onCreate });

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "Adoração" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });

    expect(onCreate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Já existe um artista com esse nome."),
    ).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby");
  });

  /** Mesmo nome com caixa diferente também é tratado como duplicado. */
  it("bloqueia duplicado por diferença de caixa sem chamar onCreate", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderSection({ onCreate });

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "ADORAÇÃO" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });

    expect(onCreate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Já existe um artista com esse nome."),
    ).toBeInTheDocument();
  });

  /** Mesmo nome sem acento também é tratado como duplicado (normalizeForSearch). */
  it("bloqueia duplicado por diferença de acento sem chamar onCreate", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderSection({ onCreate });

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "adoracao" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });

    expect(onCreate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Já existe um artista com esse nome."),
    ).toBeInTheDocument();
  });

  /**
   * O gênero gramatical do domínio (`config.genero`) concorda no placeholder
   * ("Nova", não "Novo(a)") e na mensagem de erro ("uma", não "um(a)") —
   * fixo por domínio, não um hedge genérico que soa errado para rótulos
   * femininos como "Categoria".
   */
  it("usa concordancia de genero feminina no placeholder e na mensagem de erro", async () => {
    const configFeminino = {
      label: "Categoria",
      genero: "f" as const,
      getName: (item: EntidadeTeste) => item.nome,
      getId: (item: EntidadeTeste) => item.id,
      emptyTitle: "Nenhuma categoria cadastrada",
      emptyDescription: "Adicione categorias usando o campo acima.",
    };
    render(
      <ConfigCrudSection<EntidadeTeste>
        config={configFeminino}
        items={[{ id: "1", nome: "Louvor" }]}
        isLoading={false}
        onCreate={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Nova categoria...");
    fireEvent.change(input, { target: { value: "Louvor" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });

    expect(
      screen.getByText("Já existe uma categoria com esse nome."),
    ).toBeInTheDocument();
  });

  /** O erro de duplicado some assim que o usuário volta a digitar. */
  it("limpa o erro de duplicado ao digitar novamente", async () => {
    renderSection();

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "adoracao" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });
    expect(
      screen.getByText("Já existe um artista com esse nome."),
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "adoracao nova" } });
    expect(
      screen.queryByText("Já existe um artista com esse nome."),
    ).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  /**
   * Regressão do bug principal: antes da correção, `await onCreate(trimmed)`
   * sem try/catch virava unhandled rejection e `setNewName("")` nunca
   * rodava. Verifica as duas pontas — nenhuma rejeição não tratada escapa e
   * o texto digitado permanece no input para o usuário tentar de novo.
   */
  it("onCreate rejeitado nao gera unhandled rejection e mantem o texto digitado", async () => {
    const rejeicoesNaoTratadas: unknown[] = [];
    /** Registra rejeições de Promise não tratadas ocorridas durante o teste. */
    const onUnhandledRejection = (reason: unknown) => {
      rejeicoesNaoTratadas.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    const onCreate = vi.fn().mockRejectedValue(new Error("Nome já cadastrado"));
    renderSection({ onCreate, items: [] });

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "Nome Novo" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });
    /** Dá uma volta extra no event loop para qualquer unhandled rejection tardia se manifestar. */
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onCreate).toHaveBeenCalledWith("Nome Novo");
    expect(input).toHaveValue("Nome Novo");
    expect(rejeicoesNaoTratadas).toHaveLength(0);

    process.off("unhandledRejection", onUnhandledRejection);
  });

  /**
   * Mirror da regressão acima para `handleUpdate`: antes da correção,
   * `await onUpdate(...)` sem try/catch também virava unhandled rejection.
   * Além disso, prova que o `catch` não chama `cancelEditing()` — o modo de
   * edição continua aberto com o texto editado preservado, em vez de
   * descartar o que o usuário digitou.
   */
  it("onUpdate rejeitado nao gera unhandled rejection e mantem o modo de edicao aberto com o texto editado", async () => {
    const rejeicoesNaoTratadas: unknown[] = [];
    /** Registra rejeições de Promise não tratadas ocorridas durante o teste. */
    const onUnhandledRejection = (reason: unknown) => {
      rejeicoesNaoTratadas.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    const onUpdate = vi.fn().mockRejectedValue(new Error("Nome já cadastrado"));
    renderSection({ onUpdate });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Editar artista" }));
    });

    const editInput = screen.getByDisplayValue(ITEM_EXISTENTE.nome);
    fireEvent.change(editInput, { target: { value: "Adoração Nova" } });
    await act(async () => {
      fireEvent.keyDown(editInput, { key: "Enter" });
    });
    /** Dá uma volta extra no event loop para qualquer unhandled rejection tardia se manifestar. */
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onUpdate).toHaveBeenCalledWith(ITEM_EXISTENTE.id, "Adoração Nova");
    /** O input de edição segue montado com o texto digitado — modo de edição não fechou. */
    expect(screen.getByDisplayValue("Adoração Nova")).toBeInTheDocument();
    /** Se `cancelEditing()` tivesse rodado, a linha voltaria ao modo de leitura com este botão. */
    expect(
      screen.queryByRole("button", { name: "Editar artista" }),
    ).not.toBeInTheDocument();
    expect(rejeicoesNaoTratadas).toHaveLength(0);

    process.off("unhandledRejection", onUnhandledRejection);
  });

  /** Quando `onCreate` resolve com sucesso, o input de criação é limpo. */
  it("limpa o input apos onCreate resolver com sucesso", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderSection({ onCreate, items: [] });

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "Nome Valido" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });

    expect(onCreate).toHaveBeenCalledWith("Nome Valido");
    expect(input).toHaveValue("");
  });

  /**
   * O item recém-criado recebe a classe de destaque (`animate-highlight-new`)
   * assim que aparece na lista e a perde 2s depois. Como o componente não
   * busca dados sozinho, o teste simula o refetch do React Query
   * re-renderizando com `items` já contendo o item novo — o mesmo que
   * acontece na aplicação real após a invalidação de cache.
   */
  it("aplica destaque ao item recem-criado e remove apos 2s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <ConfigCrudSection<EntidadeTeste>
        config={config}
        items={[ITEM_EXISTENTE]}
        isLoading={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Novo artista...");
    fireEvent.change(input, { target: { value: "Nova Música" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    });

    /** Simula o refetch: o item novo passa a existir na lista vinda do backend. */
    rerender(
      <ConfigCrudSection<EntidadeTeste>
        config={config}
        items={[ITEM_EXISTENTE, { id: "2", nome: "Nova Música" }]}
        isLoading={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const linhaNova = screen.getByText("Nova Música").closest("div");
    expect(linhaNova?.className).toMatch(/animate-highlight-new/);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(linhaNova?.className).not.toMatch(/animate-highlight-new/);
  });

  /** Em modo somente-leitura, o formulário de criação não é renderizado. */
  it("oculta o formulario de criacao quando readOnly", () => {
    renderSection({ readOnly: true });

    expect(
      screen.queryByPlaceholderText("Novo artista..."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar criação" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar/i }),
    ).not.toBeInTheDocument();
  });
});
