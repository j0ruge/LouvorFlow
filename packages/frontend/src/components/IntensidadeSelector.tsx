/**
 * Seletor visual de intensidade para versões de música.
 *
 * Exibe três pill buttons (Calma, Média, Agitada) com ícones de barras
 * progressivas (3, 4 e 5 barras respectivamente). Distribuição igualitária
 * na largura do container. Suporta toggle deselect: clicar na opção já
 * selecionada limpa o valor para nulo. Usado em MusicaForm e VersaoForm.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com os pill buttons de intensidade.
 */

import { cn } from "@/lib/utils";

/** Valores possíveis de intensidade. */
type Intensidade = "calma" | "media" | "agitada";

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
function IntensityBars({ bars, className }: { bars: number; className?: string }) {
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

/** Configuração das opções de intensidade com label e número de barras. */
const OPTIONS: { value: Intensidade; label: string; bars: number }[] = [
  { value: "calma", label: "Calma", bars: 3 },
  { value: "media", label: "Média", bars: 4 },
  { value: "agitada", label: "Agitada", bars: 5 },
];

export function IntensidadeSelector({ value, onChange }: IntensidadeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(isActive ? "" : opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              "border",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <IntensityBars bars={opt.bars} className="h-4 w-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
