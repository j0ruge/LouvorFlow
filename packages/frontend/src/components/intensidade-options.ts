/**
 * Opções de intensidade (tempo) de uma versão de música.
 *
 * Fonte única de verdade compartilhada entre o seletor do formulário
 * (`IntensidadeSelector`) e os chips de filtro de tempo na página de
 * Músicas (`Songs.tsx`). Mantido como módulo de dados puro (sem JSX)
 * para não acoplar a lista a um componente e evitar avisos de Fast
 * Refresh ao reexportar de um arquivo de componente.
 */

/** Valores possíveis de intensidade. */
export type Intensidade = "calma" | "media" | "agitada";

/** Configuração das opções de intensidade com label e número de barras (3/4/5). */
export const INTENSIDADE_OPTIONS: { value: Intensidade; label: string; bars: number }[] = [
  { value: "calma", label: "Calma", bars: 3 },
  { value: "media", label: "Média", bars: 4 },
  { value: "agitada", label: "Agitada", bars: 5 },
];
