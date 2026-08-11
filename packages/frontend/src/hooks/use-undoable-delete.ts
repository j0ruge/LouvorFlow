/**
 * Hook de exclusão com "Desfazer" client-side (decisão D2 da fase F9).
 *
 * Em vez de soft-delete no backend, o DELETE real é **adiado** por uma janela
 * (~5s) enquanto um toast com a ação "Desfazer" está visível. Durante a
 * janela, o id fica num `Set` local de pendentes e a lista renderizada filtra
 * por `!estaPendente(id)` — o cache do React Query **nunca** é tocado, então
 * qualquer `invalidateQueries`/refetch de outra mutation não traz o item de
 * volta no meio da janela, e "restaurar na posição original" sai de graça
 * (a ordem da lista real nunca foi alterada).
 *
 * - "Desfazer" cancela o timer e remove o id do `Set`: o item reaparece na
 *   lista — esse É o feedback (sem segundo toast). Se o DELETE já iniciou
 *   (o sonner pausa o countdown do toast no hover, mas o `setTimeout` do
 *   hook não — o toast pode sobreviver à janela), "Desfazer" vira um
 *   `toast.error` explicando que a exclusão já foi concluída, em vez de
 *   restaurar um item que o refetch faria sumir de novo (flicker).
 * - Janela expirada: o DELETE dispara via `excluir(id)`, o toast é
 *   dispensado (`toast.dismiss`) para não sobrar um "Desfazer" morto no
 *   cenário de hover, e o id só sai do `Set` no `finally`, depois da
 *   Promise resolver — evita o item "piscar" de volta entre o DELETE e o
 *   refetch da listagem.
 * - Desmonte (troca de rota/aba): flush imediato — timers cancelados,
 *   toasts dispensados e o DELETE dos pendentes disparado na hora, para a
 *   exclusão não se perder nem sobrar toast órfão com action morta.
 *
 * **Risco aceito (D2)**: fechar a aba/janela do navegador durante a janela
 * perde o DELETE — o item reaparece no próximo carregamento. O flush cobre
 * apenas desmontes dentro do app (navegação entre rotas/abas).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Duração padrão (ms) da janela em que a exclusão pode ser desfeita. */
const JANELA_PADRAO_MS = 5000;

/** Copy do aviso quando "Desfazer" chega depois do DELETE já ter iniciado. */
const MSG_DESFAZER_TARDIO = "A exclusão já foi concluída e não pôde ser desfeita.";

/** Registro de uma exclusão agendada: o timer da janela e o toast associado. */
interface ExclusaoAgendada {
  /** Timer do `setTimeout` que dispara o DELETE ao fim da janela. */
  timer: ReturnType<typeof setTimeout>;
  /** Id do toast do sonner, para `toast.dismiss` quando o DELETE antecipa a expiração. */
  toastId: string | number;
}

/** Opções do hook de exclusão com desfazer. */
export interface UseUndoableDeleteOptions {
  /**
   * Executa o DELETE real de um id. Deve ser o `mutateAsync` de uma mutation
   * **silenciosa** (sem toast de sucesso próprio) — o feedback de exclusão é
   * o toast com "Desfazer" deste hook; o toast de erro continua por conta da
   * mutation.
   */
  excluir: (id: string) => Promise<unknown>;
  /** Duração (ms) da janela de desfazer. Padrão: 5000. */
  janelaMs?: number;
}

/** Contrato exposto pelo hook de exclusão com desfazer. */
export interface UndoableDelete {
  /**
   * Agenda a exclusão do id: marca como pendente, exibe o toast com a ação
   * "Desfazer" e dispara o DELETE real quando a janela expirar.
   *
   * @param id - Identificador do item a excluir.
   * @param mensagem - Copy do toast de confirmação (ex.: "Escala excluída.").
   */
  agendar(id: string, mensagem: string): void;
  /**
   * Indica se o id está com exclusão pendente (dentro da janela de desfazer).
   * As listas renderizadas devem filtrar por `!estaPendente(id)`.
   *
   * @param id - Identificador do item a consultar.
   * @returns `true` enquanto a exclusão do id estiver pendente.
   */
  estaPendente(id: string): boolean;
}

/**
 * Hook de exclusão com janela de desfazer client-side.
 *
 * @param options - Configuração com o executor do DELETE e a janela opcional.
 * @returns Objeto com `agendar` e `estaPendente`.
 */
export function useUndoableDelete({
  excluir,
  janelaMs = JANELA_PADRAO_MS,
}: UseUndoableDeleteOptions): UndoableDelete {
  /** Ids com exclusão pendente — estado imutável para disparar re-render das listas. */
  const [pendentes, setPendentes] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  /** Exclusões agendadas por id (timer + toast), para cancelamento no desfazer/flush. */
  const timersRef = useRef<Map<string, ExclusaoAgendada>>(new Map());
  /**
   * Ref sempre atualizada do executor de exclusão: o cleanup do flush roda
   * uma única vez no desmonte e precisa enxergar a versão mais recente sem
   * reexecutar o efeito a cada render.
   */
  const excluirRef = useRef(excluir);
  excluirRef.current = excluir;

  /**
   * Remove um id do `Set` de pendentes, preservando a imutabilidade do estado.
   *
   * @param id - Identificador a desmarcar.
   */
  const desmarcar = useCallback((id: string) => {
    setPendentes((atual) => {
      if (!atual.has(id)) return atual;
      const proximo = new Set(atual);
      proximo.delete(id);
      return proximo;
    });
  }, []);

  /**
   * Confirma a exclusão ao fim da janela: remove o registro do Map (o que
   * também sinaliza ao `desfazer` que o DELETE já iniciou), dispensa o toast
   * — o sonner pausa o countdown no hover, então o toast pode ainda estar
   * visível com um "Desfazer" que já não teria efeito — e dispara o DELETE
   * real. O id só é desmarcado **no `finally`**, aguardando a Promise:
   * desmarcar antes faria o item "piscar" de volta entre o DELETE e o
   * refetch. Erros são engolidos aqui: o `onError` da mutation silenciosa
   * já exibiu o `toast.error`.
   *
   * @param id - Identificador do item a excluir de fato.
   */
  const confirmar = useCallback(
    async (id: string) => {
      const agendada = timersRef.current.get(id);
      timersRef.current.delete(id);
      if (agendada) toast.dismiss(agendada.toastId);
      try {
        await excluirRef.current(id);
      } catch {
        /* toast de erro já emitido pelo onError da mutation */
      } finally {
        desmarcar(id);
      }
    },
    [desmarcar],
  );

  /**
   * Desfaz a exclusão pendente: cancela o timer e desmarca o id. O item
   * reaparece na lista na posição original — esse é o feedback, sem um
   * segundo toast.
   *
   * **Corrida do desfazer tardio**: o sonner pausa o countdown do toast no
   * hover, mas o `setTimeout` do hook não. O usuário pode pairar aos 4,5s,
   * o DELETE sair aos 5s e o clique em "Desfazer" chegar depois. Nesse caso
   * o id já saiu do Map (o `confirmar`/flush o removeu antes de disparar):
   * NÃO desmarcamos — restaurar o item aqui causaria um flicker (voltaria e
   * sumiria no refetch) — e avisamos com `toast.error` em vez de um no-op
   * silencioso.
   *
   * @param id - Identificador do item a restaurar.
   */
  const desfazer = useCallback(
    (id: string) => {
      const agendada = timersRef.current.get(id);
      if (!agendada) {
        toast.error(MSG_DESFAZER_TARDIO);
        return;
      }
      clearTimeout(agendada.timer);
      timersRef.current.delete(id);
      desmarcar(id);
    },
    [desmarcar],
  );

  /** Implementação de `agendar` (ver contrato em `UndoableDelete`). */
  const agendar = useCallback(
    (id: string, mensagem: string) => {
      /**
       * Defesa contra reagendamento do mesmo id: cancela o timer anterior e
       * dispensa o toast antigo — sem isso, dois "Desfazer" vivos apontariam
       * para a mesma exclusão e o timer antigo dispararia um DELETE precoce.
       */
      const anterior = timersRef.current.get(id);
      if (anterior) {
        clearTimeout(anterior.timer);
        toast.dismiss(anterior.toastId);
      }

      setPendentes((atual) => new Set(atual).add(id));
      const timer = setTimeout(() => {
        void confirmar(id);
      }, janelaMs);
      const toastId = toast.success(mensagem, {
        duration: janelaMs,
        action: {
          label: "Desfazer",
          onClick: () => desfazer(id),
        },
      });
      timersRef.current.set(id, { timer, toastId });
    },
    [confirmar, desfazer, janelaMs],
  );

  /** Implementação de `estaPendente` (ver contrato em `UndoableDelete`). */
  const estaPendente = useCallback(
    (id: string) => pendentes.has(id),
    [pendentes],
  );

  /**
   * Flush no desmonte: cancela os timers, dispensa os toasts — o toaster do
   * sonner é global e sobreviveria à navegação com um "Desfazer" morto — e
   * dispara imediatamente o DELETE de todos os pendentes. Páginas são
   * elementos de rota — trocar de rota desmonta o componente e este cleanup
   * garante que a exclusão agendada não se perca. O `catch` vazio evita
   * unhandled rejection (o `onError` da mutation já toca o toast de erro).
   */
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(({ timer, toastId }, id) => {
        clearTimeout(timer);
        toast.dismiss(toastId);
        void excluirRef.current(id).catch(() => {
          /* toast de erro já emitido pelo onError da mutation */
        });
      });
      timers.clear();
    };
  }, []);

  return useMemo(() => ({ agendar, estaPendente }), [agendar, estaPendente]);
}
