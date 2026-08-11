/**
 * Componente de seleção de tom (tonalidade) de uma música em uma escala.
 *
 * Exibe um badge com o tom efetivo da música nesta escala (override do
 * evento ?? tom global da música). Quando o usuário tem permissão de
 * escrita, o badge é clicável e abre um Popover com grid de tons
 * disponíveis. Em modo read-only exibe apenas o badge.
 *
 * Ao contrário do irmão `MusicaVersaoPicker`, este componente NÃO tem
 * auto-seleção via `useEffect`: o fallback para o tom global já é resolvido
 * no servidor (o campo `tonalidade` da API chega com o efetivo calculado) —
 * não há estado stale para corrigir no cliente, e um efeito aqui só geraria
 * PATCHes espúrios sem necessidade.
 */

import { useId, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Guitar } from "lucide-react";
import { useTonalidades } from "@/hooks/use-support";
import { cn } from "@/lib/utils";
import type { Tonalidade } from "@/schemas/shared";

/**
 * Valor sentinela para a opção "Tom da música (global)" no radio group.
 * Usado porque RadioGroup não aceita string vazia como value.
 */
const TOM_GLOBAL_VALUE = "__tom_global__";

/** Props do componente MusicaTomPicker. */
interface MusicaTomPickerProps {
  /** ID da música no contexto do evento (eventos_musicas.fk_musica). */
  musicaId: string;
  /** Tom efetivo da música nesta escala: override do evento, ou o tom global na ausência dele. */
  tonalidadeEfetiva: Tonalidade | null;
  /** Tom global de referência da música, independente de override na escala. */
  tonalidadeMusica: Tonalidade | null;
  /** Callback disparado ao selecionar um tom. Recebe o ID, ou `null` para voltar ao tom global. */
  onSelect: (fkTonalidade: string | null) => void;
  /** Indica se a mutation está em andamento. */
  isPending: boolean;
  /** Quando true, exibe apenas o badge sem interação (para usuários sem permissão de escrita). */
  readOnly?: boolean;
}

/**
 * Badge com Popover para seleção de tom de música na escala.
 *
 * O anel âmbar (token `primary`) sinaliza visualmente quando a escala tem um
 * tom próprio diferente do tom global da música. A comparação é feita por
 * ID entre o tom efetivo e o tom global — a API não expõe uma flag "tem
 * override" separada, só os dois toms já resolvidos.
 *
 * @param props - Props do componente.
 * @returns Elemento React com o badge/popover de tom.
 */
export function MusicaTomPicker({
  musicaId,
  tonalidadeEfetiva,
  tonalidadeMusica,
  onSelect,
  isPending,
  readOnly = false,
}: MusicaTomPickerProps) {
  const [open, setOpen] = useState(false);
  /** Liga o título do popover ao `radiogroup`, que não tem nome acessível próprio. */
  const tituloId = useId();
  const { data: tonalidades, isLoading } = useTonalidades();

  const efetivoId = tonalidadeEfetiva?.id ?? null;
  const globalId = tonalidadeMusica?.id ?? null;
  /** A escala só diverge do tom global quando há um override — só assim os IDs divergem. */
  const temOverride = efetivoId !== globalId;

  const badgeLabel = tonalidadeEfetiva?.tom ?? "Sem tom";
  const radioValue = efetivoId ?? TOM_GLOBAL_VALUE;
  const globalLabel = tonalidadeMusica
    ? `Tom da música (${tonalidadeMusica.tom})`
    : "Tom da música (nenhum)";

  const badgeClass = cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-primary/30 bg-primary/10 text-primary flex-shrink-0",
    temOverride && "ring-2 ring-primary ring-offset-1 ring-offset-background",
  );

  /**
   * Handler de mudança no radio group.
   * Converte o valor sentinela de volta para `null` e fecha o popover.
   *
   * @param value - Valor selecionado no radio group.
   */
  function handleValueChange(value: string) {
    onSelect(value === TOM_GLOBAL_VALUE ? null : value);
    setOpen(false);
  }

  if (readOnly) {
    return (
      <span className={badgeClass} aria-label={`Tom selecionado: ${badgeLabel}`}>
        <Guitar className="h-3 w-3 mr-1 flex-shrink-0" />
        {badgeLabel}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className={`${badgeClass} transition-colors outline-none focus:outline-2 focus:outline-ring hover:bg-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={`Tom: ${badgeLabel}. Clique para alterar.`}
        >
          <Guitar className="h-3 w-3 mr-1 flex-shrink-0" />
          {badgeLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-[calc(100vw-2rem)] p-3" align="start">
        <p id={tituloId} className="text-sm font-medium mb-2">
          Selecionar tom
        </p>
        <RadioGroup
          value={radioValue}
          onValueChange={handleValueChange}
          className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto"
          aria-labelledby={tituloId}
        >
          {/* Sentinela "tom global": ocupa a largura inteira para o rótulo mais longo não truncar. */}
          <Label
            htmlFor={`tom-${musicaId}-global`}
            className={cn(
              "col-span-3 flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-sm font-normal transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1",
              radioValue === TOM_GLOBAL_VALUE
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <RadioGroupItem
              value={TOM_GLOBAL_VALUE}
              id={`tom-${musicaId}-global`}
              className="sr-only"
            />
            {globalLabel}
          </Label>

          {isLoading && (
            <p className="col-span-3 py-2 text-center text-xs text-muted-foreground">
              Carregando tons...
            </p>
          )}

          {(tonalidades ?? []).map((tom) => (
            <Label
              key={tom.id}
              htmlFor={`tom-${musicaId}-${tom.id}`}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-sm font-normal transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1",
                radioValue === tom.id
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              <RadioGroupItem
                value={tom.id}
                id={`tom-${musicaId}-${tom.id}`}
                className="sr-only"
              />
              {tom.tom}
            </Label>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}
