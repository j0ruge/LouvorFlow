/**
 * Guarda de alterações não salvas para formulários em overlay.
 *
 * Máquina de estados pura: sabe apenas se há alterações a proteger
 * (`temAlteracoes`, um boolean) e o que fazer ao fechar (`aoFechar`).
 * **Não importa react-hook-form** — o consumidor passa
 * `form.formState.isDirty` (ou qualquer outro boolean, ex.: um estado
 * local em páginas sem RHF), preservando a Lei de Demeter: o wrapper
 * de overlay nunca vê `form`, `formState` ou `control`.
 *
 * Fluxo: `pedirFechamento()` fecha direto quando o formulário está
 * limpo e abre o veil de confirmação quando está sujo; o veil só sai
 * por `continuarEditando()` (mantém o overlay aberto) ou `descartar()`
 * (fecha o overlay, opcionalmente limpando efeitos via `aoDescartar` —
 * garantido rodar no máximo uma vez por exibição do veil, mesmo com
 * duplo clique em "Descartar"). Quando `temAlteracoes` cai para `false`
 * (ex.: pós-submit, quando o formulário chama `reset()`), o veil fecha
 * sozinho.
 *
 * Foco: o hook também é o dono da restauração de foco do veil. Em
 * browser real, o `inert` aplicado no mesmo commit que monta o veil
 * rouba o foco ANTES de qualquer effect rodar — quando o veil lesse
 * `document.activeElement`, já seria o `body`. Por isso a captura
 * acontece no momento do EVENTO: `pedirFechamento()` guarda
 * `document.activeElement` num ref antes de abrir o veil, e um effect
 * no falling edge de `veilAberto` restaura o foco depois que o veil
 * fechou e o `inert` saiu (só se o elemento ainda está `isConnected` —
 * no descarte o overlay desmonta junto e nada é restaurado).
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Contrato do guard consumido pelo `ResponsiveFormDialog` e pelos formulários. */
export interface DirtyFormGuard {
  /**
   * Se as saídas nativas (Esc, backdrop, X, swipe) devem ser interceptadas.
   * Continua `true` COM o veil aberto — senão Esc sobre o veil fecharia o
   * drawer por baixo dele.
   */
  readonly bloqueiaSaida: boolean;
  /** Se o veil de confirmação ("Descartar alterações?") está visível. */
  readonly veilAberto: boolean;
  /** Pede o fechamento do overlay: abre o veil se sujo, fecha direto se limpo. */
  pedirFechamento(): void;
  /** Fecha o veil mantendo o overlay (e o que foi digitado) intactos. */
  continuarEditando(): void;
  /** Confirma o descarte: fecha o veil, roda `aoDescartar` e fecha o overlay. */
  descartar(): void;
}

/** Opções do hook `useDirtyFormGuard`. */
export interface UseDirtyFormGuardOptions {
  /** Se há alterações a proteger (passe `form.formState.isDirty`). */
  temAlteracoes: boolean;
  /** Fecha o overlay de fato (normalmente `() => onOpenChange(false)`). */
  aoFechar: () => void;
  /**
   * Efeito extra ao confirmar o descarte (ex.: limpar rascunho). O hook
   * garante no máximo uma execução por exibição do veil (duplo clique em
   * "Descartar" não roda o efeito duas vezes).
   */
  aoDescartar?: () => void;
}

/**
 * Cria a máquina de estados da guarda de alterações não salvas.
 *
 * @param options - Boolean de alterações e callbacks de fechamento/descarte.
 * @returns Guard com o estado do veil e as três transições possíveis.
 */
export function useDirtyFormGuard({
  temAlteracoes,
  aoFechar,
  aoDescartar,
}: UseDirtyFormGuardOptions): DirtyFormGuard {
  const [veilAberto, setVeilAberto] = useState(false);

  /**
   * Elemento focado no momento em que o veil foi pedido (captura no EVENTO,
   * antes do `inert` roubar o foco), para restauração ao fechar o veil.
   */
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  /** Se o veil chegou a abrir — arma a restauração de foco no falling edge. */
  const veilEsteveAbertoRef = useRef(false);

  /** Se `aoDescartar` já rodou nesta exibição do veil (guarda de duplo clique). */
  const jaDescartouRef = useRef(false);

  useEffect(
    /**
     * Fecha o veil quando `temAlteracoes` cai para `false` — cobre o
     * pós-submit, quando o formulário chama `reset()` e não há mais nada
     * a proteger.
     */
    function fecharVeilQuandoLimpo() {
      if (!temAlteracoes) setVeilAberto(false);
    },
    [temAlteracoes],
  );

  useEffect(
    /**
     * Restaura o foco capturado em `pedirFechamento()` no falling edge de
     * `veilAberto` — este commit já removeu o `inert` do formulário, então
     * o `.focus()` funciona. Se o elemento saiu do documento (ex.: descarte
     * desmontou o overlay junto), nada é restaurado.
     */
    function restaurarFocoAoFecharVeil() {
      if (veilAberto) {
        veilEsteveAbertoRef.current = true;
        return;
      }
      if (!veilEsteveAbertoRef.current) return;
      veilEsteveAbertoRef.current = false;

      const alvo = focoAnteriorRef.current;
      focoAnteriorRef.current = null;
      if (alvo?.isConnected) alvo.focus();
    },
    [veilAberto],
  );

  /**
   * Abre o veil se há alterações; fecha o overlay direto se não há. Na
   * abertura, captura o elemento focado (antes do `inert` agir) e rearma a
   * guarda de descarte; pedidos repetidos com o veil já aberto não
   * sobrescrevem a captura original.
   */
  const pedirFechamento = useCallback(() => {
    if (!temAlteracoes) {
      aoFechar();
      return;
    }
    if (!veilAberto) {
      focoAnteriorRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      jaDescartouRef.current = false;
    }
    setVeilAberto(true);
  }, [temAlteracoes, veilAberto, aoFechar]);

  /** Fecha só o veil — o overlay e o conteúdo digitado permanecem. */
  const continuarEditando = useCallback(() => {
    setVeilAberto(false);
  }, []);

  /**
   * Confirma o descarte: veil fecha, `aoDescartar` roda (no máximo uma vez
   * por exibição do veil) e o overlay fecha.
   */
  const descartar = useCallback(() => {
    setVeilAberto(false);
    if (!jaDescartouRef.current) {
      jaDescartouRef.current = true;
      aoDescartar?.();
    }
    aoFechar();
  }, [aoDescartar, aoFechar]);

  return {
    bloqueiaSaida: temAlteracoes,
    veilAberto,
    pedirFechamento,
    continuarEditando,
    descartar,
  };
}
