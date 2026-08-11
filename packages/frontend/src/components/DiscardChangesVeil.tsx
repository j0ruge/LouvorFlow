/**
 * Veil de confirmação de descarte de alterações não salvas.
 *
 * Camada `absolute inset-0` pintada **dentro** do `DialogContent`/
 * `DrawerContent` (ambos `position: fixed`, logo bloco de contenção) —
 * não é um segundo `Dialog`, evitando stacking de foco entre portais.
 * O `role="alertdialog"` + `aria-modal="true"` só é honesto porque o
 * irmão (o formulário) recebe `inert` + `aria-hidden` enquanto o veil
 * está aberto; o `inert` também contém o Tab, e o `FocusScope` do Radix
 * já limita o foco ao conteúdo do overlay — não há trap manual aqui.
 *
 * Foco inicial em "Continuar editando" (ação segura). A restauração do
 * foco anterior NÃO mora aqui: em browser real o `inert` aplicado no
 * mesmo commit que monta o veil rouba o foco antes de qualquer effect
 * rodar — quando este componente lesse `document.activeElement`, já
 * seria o `body`. Quem captura (no momento do evento) e restaura (no
 * falling edge do veil) é o `useDirtyFormGuard`. `Escape` equivale a
 * "Continuar editando".
 */

import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

/** Propriedades do componente `DiscardChangesVeil`. */
interface DiscardChangesVeilProps {
  /** Fecha o veil mantendo o formulário e o conteúdo digitado. */
  onKeepEditing: () => void;
  /** Confirma o descarte das alterações e fecha o formulário. */
  onDiscard: () => void;
}

/**
 * Camada de confirmação "Descartar alterações?" sobre o formulário.
 *
 * @param props - Callbacks de continuar editando e descartar.
 * @returns Elemento React do veil acessível (`alertdialog`).
 */
export function DiscardChangesVeil({
  onKeepEditing,
  onDiscard,
}: DiscardChangesVeilProps) {
  const tituloId = useId();
  const descricaoId = useId();
  const continuarRef = useRef<HTMLButtonElement>(null);

  useEffect(
    /**
     * Move o foco para "Continuar editando" ao abrir. A restauração do foco
     * anterior é responsabilidade do `useDirtyFormGuard` (ver docstring do
     * componente).
     */
    function focarContinuarEditando() {
      continuarRef.current?.focus();
    },
    [],
  );

  /**
   * Trata `Escape` como "Continuar editando". O `stopPropagation` NÃO
   * impede o Radix de reagir — o `DismissableLayer` escuta `keydown` no
   * `document` com `capture: true`, então o listener dele roda ANTES deste
   * handler de bolha. O que segura o overlay é a combinação: o Radix chama
   * `pedirFechamento()`, que é idempotente com o veil aberto (não fecha
   * nada), e o `onKeepEditing` daqui fecha só o veil no mesmo batch. O
   * `stopPropagation` fica apenas como defesa contra outros listeners de
   * bolha no `document`.
   *
   * @param event - Evento de teclado dentro do veil.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onKeepEditing();
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[hsl(var(--card)/0.97)] p-6 text-center animate-in fade-in-0 duration-150"
    >
      <div className="space-y-1.5">
        <h2
          id={tituloId}
          className="font-display text-lg font-bold text-foreground"
        >
          Descartar alterações?
        </h2>
        <p id={descricaoId} className="text-sm text-muted-foreground">
          Você tem alterações não salvas. Se sair agora, elas serão perdidas.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button ref={continuarRef} type="button" onClick={onKeepEditing}>
          Continuar editando
        </Button>
        <Button type="button" variant="destructive" onClick={onDiscard}>
          Descartar
        </Button>
      </div>
    </div>
  );
}
