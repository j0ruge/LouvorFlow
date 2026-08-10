/**
 * Seletor visual de intensidade (tempo) e ícone de barras progressivas.
 * Usado em `MusicaForm`, `VersaoForm` e nos chips de filtro de `Songs.tsx`.
 */

import { cn } from "@/lib/utils";
import { INTENSIDADE_OPTIONS, type Intensidade } from "./intensidade-options";

/** Propriedades do componente IntensidadeSelector. */
interface IntensidadeSelectorProps {
  /** Valor atualmente selecionado ou vazio/undefined para nenhum. */
  value: Intensidade | "" | undefined;
  /** Callback ao alterar a seleção (toggle deselect envia ""). */
  onChange: (value: Intensidade | "") => void;
}

/**
 * Ícone de barras progressivas de intensidade.
 *
 * @param props - Propriedades do ícone.
 * @param props.bars - Número de barras a exibir (3, 4 ou 5).
 * @param props.className - Classes CSS adicionais.
 * @returns Elemento SVG com barras de altura crescente.
 */
export function IntensityBars({ bars, className }: { bars: number; className?: string }) {
  const allBars = Array.from({ length: bars }, (_, i) => ({
    height: 4 + i * 2.5,
    x: i * 3.5,
  }));
  const width = (bars - 1) * 3.5 + 2;
  const maxHeight = 4 + (bars - 1) * 2.5;

  return (
    <svg
      viewBox={`0 0 ${width} ${maxHeight}`}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {allBars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={maxHeight - bar.height}
          width="2"
          height={bar.height}
          rx="0.5"
        />
      ))}
    </svg>
  );
}

/**
 * Seletor visual de intensidade para versões de música.
 *
 * Exibe três pill buttons (Calma, Média, Agitada) com ícones de barras
 * progressivas (3, 4 e 5 barras respectivamente), distribuídos igualitariamente
 * na largura e com quebra de linha (`flex-wrap`) em telas muito estreitas.
 * Suporta toggle deselect: clicar na opção já selecionada limpa o valor (`""`).
 *
 * @param props - Propriedades do componente (`value` e `onChange`).
 * @returns Elemento React com os pill buttons de intensidade.
 */
export function IntensidadeSelector({ value, onChange }: IntensidadeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {INTENSIDADE_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(isActive ? "" : opt.value)}
            className={cn(
              "flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all",
              "border",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <IntensityBars bars={opt.bars} className="h-4 w-4 shrink-0" />
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
