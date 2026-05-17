/**
 * Hook genérico de debounce de valor.
 *
 * Retorna a versão "estabilizada" do valor de entrada após decorrer
 * `delayMs` milissegundos sem novas atualizações. Útil para evitar
 * disparos excessivos de busca/efeito enquanto o usuário digita.
 */

import { useEffect, useState } from "react";

/**
 * Hook que devolve o valor de entrada com atraso, garantindo que ele
 * só seja propagado após `delayMs` sem mudanças.
 *
 * @typeParam T - Tipo do valor monitorado.
 * @param value - Valor de entrada a ser observado.
 * @param delayMs - Tempo em milissegundos sem atualização antes de
 * propagar o valor.
 * @returns Valor mais recente após o período de inatividade.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(
    /**
     * Agenda a atualização do valor debounceado após `delayMs` e
     * cancela o agendamento anterior em mudanças subsequentes.
     */
    function scheduleDebouncedUpdate() {
      const timer = setTimeout(() => setDebounced(value), delayMs);
      return () => clearTimeout(timer);
    },
    [value, delayMs],
  );

  return debounced;
}
