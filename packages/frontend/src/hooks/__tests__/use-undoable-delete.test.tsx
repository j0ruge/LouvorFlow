/**
 * Testes do `useUndoableDelete` — exclusão com janela de desfazer
 * client-side (fase F9, decisão D2).
 *
 * Usa `vi.useFakeTimers()` para controlar a janela e `vi.mock("sonner")`
 * para capturar o `options.action.onClick` ("Desfazer") do toast. Cobre:
 * agendamento (pendente + toast com duration), desfazer (timer cancelado,
 * `excluir` nunca chamado), expiração da janela (`excluir` 1x, desmarca no
 * `finally`, toast dispensado), rejeição de `excluir` (desmarca mesmo
 * assim, sem unhandled rejection), flush no desmonte (com dismiss dos
 * toasts órfãos), independência entre dois agendamentos e as corridas:
 * desfazer tardio (após o DELETE iniciar → `toast.error`, sem restaurar),
 * reagendamento do mesmo id (sem timer vazado) e flush com confirmação em
 * voo (`excluir` não repete).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";

vi.mock("sonner", () => {
  /** Contador de ids de toast, imitando o id incremental devolvido pelo sonner real. */
  let proximoToastId = 0;
  return {
    toast: {
      success: vi.fn(() => {
        proximoToastId += 1;
        return proximoToastId;
      }),
      error: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

/** Referência tipada ao mock de `toast.success` para inspecionar as chamadas. */
const toastSuccess = vi.mocked(toast.success);
/** Referência tipada ao mock de `toast.error` (aviso de desfazer tardio). */
const toastError = vi.mocked(toast.error);
/** Referência tipada ao mock de `toast.dismiss` (limpeza de toasts órfãos). */
const toastDismiss = vi.mocked(toast.dismiss);

/** Formato das opções passadas ao `toast.success` pelo hook. */
interface OpcoesToastCapturadas {
  /** Duração do toast — deve coincidir com a janela de desfazer. */
  duration: number;
  /** Ação "Desfazer" exibida no toast. */
  action: { label: string; onClick: () => void };
}

/**
 * Extrai as opções (duration + action) da n-ésima chamada ao `toast.success`.
 *
 * @param indice - Índice da chamada capturada (padrão: 0, a primeira).
 * @returns Opções do toast com a ação "Desfazer".
 */
function opcoesDoToast(indice = 0): OpcoesToastCapturadas {
  return toastSuccess.mock.calls[indice][1] as unknown as OpcoesToastCapturadas;
}

describe("useUndoableDelete", () => {
  /** Ativa fake timers e zera os mocks antes de cada teste. */
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  /** Restaura timers reais após cada teste. */
  afterEach(() => {
    vi.useRealTimers();
  });

  /** `agendar` deve marcar o id como pendente e disparar o toast com duration e ação "Desfazer". */
  it("agendar marca o id como pendente e dispara toast com duration e acao Desfazer", () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    expect(result.current.estaPendente("a1")).toBe(false);

    act(() => result.current.agendar("a1", "Escala excluída."));

    expect(result.current.estaPendente("a1")).toBe(true);
    expect(excluir).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith(
      "Escala excluída.",
      expect.objectContaining({
        duration: 5000,
        action: expect.objectContaining({ label: "Desfazer" }),
      }),
    );
  });

  /** "Desfazer" deve cancelar o timer e desmarcar o id — `excluir` nunca é chamado, nem após a janela. */
  it("desfazer cancela o timer, desmarca o id e excluir nunca e chamado", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));
    expect(result.current.estaPendente("a1")).toBe(true);

    act(() => opcoesDoToast().action.onClick());

    expect(result.current.estaPendente("a1")).toBe(false);

    /** Mesmo com a janela inteira decorrida, o DELETE não pode disparar. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(excluir).not.toHaveBeenCalled();
  });

  /** Janela expirada: `excluir` é chamado exatamente 1x com o id e o pendente é desmarcado no finally. */
  it("janela expirada chama excluir uma unica vez e desmarca no finally", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));

    /** Um instante antes da janela, nada acontece ainda. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });
    expect(excluir).not.toHaveBeenCalled();
    expect(result.current.estaPendente("a1")).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(excluir).toHaveBeenCalledTimes(1);
    expect(excluir).toHaveBeenCalledWith("a1");
    expect(result.current.estaPendente("a1")).toBe(false);

    /**
     * O toast é dispensado quando o DELETE inicia: com o countdown pausado
     * por hover (comportamento do sonner), ele sobreviveria à janela com um
     * "Desfazer" que já não teria efeito.
     */
    expect(toastDismiss).toHaveBeenCalledWith(toastSuccess.mock.results[0].value);
  });

  /** `janelaMs` customizada deve substituir o padrão de 5000ms. */
  it("respeita janelaMs customizada", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useUndoableDelete({ excluir, janelaMs: 1000 }),
    );

    act(() => result.current.agendar("a1", "Item excluído."));
    expect(opcoesDoToast().duration).toBe(1000);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(excluir).toHaveBeenCalledTimes(1);
  });

  /** `excluir` rejeitado: o pendente é desmarcado mesmo assim (finally) e nenhuma rejeição escapa. */
  it("excluir rejeitado desmarca o pendente sem unhandled rejection", async () => {
    const rejeicoesNaoTratadas: unknown[] = [];
    /** Registra rejeições de Promise não tratadas ocorridas durante o teste. */
    const onUnhandledRejection = (reason: unknown) => {
      rejeicoesNaoTratadas.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    const excluir = vi.fn().mockRejectedValue(new Error("falhou"));
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(excluir).toHaveBeenCalledTimes(1);
    expect(result.current.estaPendente("a1")).toBe(false);
    expect(rejeicoesNaoTratadas).toHaveLength(0);

    process.off("unhandledRejection", onUnhandledRejection);
  });

  /** Flush no desmonte: cancela os timers e dispara `excluir` de todos os pendentes imediatamente. */
  it("flush no desmonte chama excluir dos pendentes e cancela os timers", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => {
      result.current.agendar("a1", "Item excluído.");
      result.current.agendar("b2", "Item excluído.");
    });
    expect(excluir).not.toHaveBeenCalled();

    unmount();

    expect(excluir).toHaveBeenCalledTimes(2);
    expect(excluir).toHaveBeenCalledWith("a1");
    expect(excluir).toHaveBeenCalledWith("b2");

    /** Toasts dispensados: o toaster global sobreviveria à navegação com "Desfazer" morto. */
    expect(toastDismiss).toHaveBeenCalledWith(toastSuccess.mock.results[0].value);
    expect(toastDismiss).toHaveBeenCalledWith(toastSuccess.mock.results[1].value);

    /** Timers cancelados: a janela decorrida não dispara um segundo DELETE. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(excluir).toHaveBeenCalledTimes(2);
  });

  /** Flush no desmonte com `excluir` rejeitado não deixa unhandled rejection escapar. */
  it("flush no desmonte com excluir rejeitado nao gera unhandled rejection", async () => {
    const rejeicoesNaoTratadas: unknown[] = [];
    /** Registra rejeições de Promise não tratadas ocorridas durante o teste. */
    const onUnhandledRejection = (reason: unknown) => {
      rejeicoesNaoTratadas.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    const excluir = vi.fn().mockRejectedValue(new Error("falhou"));
    const { result, unmount } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));
    unmount();

    /** Dá uma volta no event loop para qualquer rejeição tardia se manifestar. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(excluir).toHaveBeenCalledTimes(1);
    expect(rejeicoesNaoTratadas).toHaveLength(0);

    process.off("unhandledRejection", onUnhandledRejection);
  });

  /**
   * Corrida do desfazer tardio: o sonner pausa o countdown no hover, então
   * o clique em "Desfazer" pode chegar DEPOIS do DELETE ter saído. O hook
   * deve avisar com `toast.error` e NÃO restaurar o item (restaurar
   * causaria flicker — o refetch o faria sumir de novo).
   */
  it("desfazer apos a janela expirar emite toast.error e nao restaura o item", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));

    /** Janela expira: DELETE sai e o id é desmarcado. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(excluir).toHaveBeenCalledTimes(1);

    /** Clique tardio em "Desfazer" (toast mantido vivo pelo hover). */
    act(() => opcoesDoToast().action.onClick());

    expect(toastError).toHaveBeenCalledWith(
      "A exclusão já foi concluída e não pôde ser desfeita.",
    );
    expect(result.current.estaPendente("a1")).toBe(false);
    expect(excluir).toHaveBeenCalledTimes(1);
  });

  /** Reagendar o mesmo id cancela o timer anterior — sem DELETE precoce nem duplicado. */
  it("reagendar o mesmo id cancela o timer anterior sem vazar DELETE", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    /** Reagenda o mesmo id no meio da primeira janela. */
    act(() => result.current.agendar("a1", "Item excluído."));

    /** O toast antigo é dispensado — sem dois "Desfazer" vivos para a mesma exclusão. */
    expect(toastDismiss).toHaveBeenCalledWith(toastSuccess.mock.results[0].value);

    /** t=5000 do primeiro agendamento: o timer antigo foi cancelado, nada dispara. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(excluir).not.toHaveBeenCalled();
    expect(result.current.estaPendente("a1")).toBe(true);

    /** t=5000 do segundo agendamento: o DELETE sai exatamente uma vez. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(excluir).toHaveBeenCalledTimes(1);
    expect(result.current.estaPendente("a1")).toBe(false);
  });

  /** Flush no desmonte com a confirmação já em voo não chama `excluir` uma segunda vez. */
  it("flush com confirmacao em voo nao repete o excluir", async () => {
    /** Resolve manualmente o DELETE em voo, para simular a request pendente. */
    let resolverExclusao: (() => void) | undefined;
    const excluir = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolverExclusao = resolve;
        }),
    );
    const { result, unmount } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));

    /** Janela expira: `confirmar` inicia e remove o id do Map ANTES do await. */
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(excluir).toHaveBeenCalledTimes(1);

    /** Desmonte com o DELETE ainda pendente: o flush não deve repetir a chamada. */
    unmount();
    expect(excluir).toHaveBeenCalledTimes(1);

    /** Resolve a request pendente sem deixar rejeição/efeito colateral solto. */
    resolverExclusao?.();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(excluir).toHaveBeenCalledTimes(1);
  });

  /** Dois agendamentos são independentes: desfazer um não afeta a expiração do outro. */
  it("dois agendamentos independentes: desfazer um nao afeta o outro", async () => {
    const excluir = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoableDelete({ excluir }));

    act(() => result.current.agendar("a1", "Item excluído."));
    act(() => result.current.agendar("b2", "Item excluído."));
    expect(result.current.estaPendente("a1")).toBe(true);
    expect(result.current.estaPendente("b2")).toBe(true);

    /** Desfaz apenas o primeiro (toast de índice 0). */
    act(() => opcoesDoToast(0).action.onClick());
    expect(result.current.estaPendente("a1")).toBe(false);
    expect(result.current.estaPendente("b2")).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(excluir).toHaveBeenCalledTimes(1);
    expect(excluir).toHaveBeenCalledWith("b2");
    expect(result.current.estaPendente("b2")).toBe(false);
  });
});
