/**
 * Componente de seleção de versão de música em uma escala.
 *
 * Exibe um badge com o nome do artista da versão selecionada (ou "Sem versão" / "Sem artista").
 * Quando o usuário tem permissão de escrita, o badge é clicável e abre um Popover com
 * lista de rádio das versões disponíveis. Em modo read-only exibe apenas o badge.
 *
 * Auto-seleciona silenciosamente quando há exatamente uma versão disponível e nenhuma
 * selecionada. Se a versão atual fica stale (não existe mais na lista disponível),
 * dispara uma limpeza silenciosa para sincronizar com o backend.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Disc3 } from "lucide-react";
import type { VersaoMusica } from "@/schemas/evento";
import {
  selectDefaultVersaoId,
  computeBadgeLabel,
} from "@/lib/versao-selection";

/**
 * Valor sentinela para a opção "Sem versão" no radio group.
 * Usado porque RadioGroup não aceita string vazia como value.
 */
const SEM_VERSAO_VALUE = "__sem_versao__";


/**
 * Props do componente MusicaVersaoPicker.
 */
interface MusicaVersaoPickerProps {
  /** ID da música no contexto do evento (eventos_musicas.fk_musica). */
  musicaId: string;
  /** Versão atualmente selecionada, ou null. */
  versaoSelecionada: VersaoMusica | null;
  /** Lista de versões disponíveis para a música. */
  versoesDisponiveis: VersaoMusica[];
  /** Callback disparado ao selecionar uma versão. Recebe o ID (ou null) e uma flag silent. */
  onSelect: (artistasMusicasId: string | null, options?: { silent?: boolean }) => void;
  /** Indica se a mutation está em andamento. */
  isPending: boolean;
  /** Quando true, exibe apenas o badge sem interação (para usuários sem permissão de escrita). */
  readOnly?: boolean;
}

/**
 * Badge com Popover para seleção de versão de música na escala.
 *
 * Comportamento:
 * - 0 versões: renderiza null (invisível).
 * - readOnly: renderiza badge estático com o label da versão atual.
 * - 1 versão sem seleção: auto-seleciona silenciosamente (efeito único por musicaId+tamanho).
 * - Seleção stale: dispara onSelect(null, silent) para limpar o FK no backend.
 * - 2+ versões: badge clicável com Popover contendo radio list.
 *
 * @param props - Props do componente.
 * @returns Elemento React ou null.
 */
export function MusicaVersaoPicker({
  musicaId,
  versaoSelecionada,
  versoesDisponiveis,
  onSelect,
  isPending,
  readOnly = false,
}: MusicaVersaoPickerProps) {
  const [open, setOpen] = useState(false);
  /** Liga o título do popover ao `radiogroup`, que não tem nome acessível próprio. */
  const tituloId = useId();
  /**
   * Guard composto do auto-select: reseta sempre que `musicaId` muda ou quando o
   * conjunto de IDs de versões disponíveis muda (swap com mesma cardinalidade
   * também dispara o efeito — fix do caso "stale não limpo" quando A sai e B entra).
   */
  const autoSelectKeyRef = useRef<string | null>(null);

  /**
   * Mantém `onSelect` acessível ao efeito sem entrar nas dependências dele.
   *
   * O consumidor (`EventoDetail`) passa uma arrow inline, cuja identidade muda
   * a cada render do card — inclusive durante o arraste. Listá-la nas deps faria
   * o efeito reexecutar nessas horas, sem que nada relevante tivesse mudado.
   */
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /**
   * Aplica silenciosamente a seleção padrão: limpa uma versão que saiu da lista
   * e auto-seleciona quando só existe uma opção.
   *
   * A decisão vem de `selectDefaultVersaoId` — a mesma função coberta pelos
   * testes unitários. Reimplementar as regras aqui deixaria duas cópias da
   * mesma lógica, e a suíte continuaria verde se elas divergissem.
   */
  useEffect(() => {
    if (readOnly) return;

    const currentKey = `${musicaId}:${versoesDisponiveis.map((v) => v.id).join(",")}`;
    if (autoSelectKeyRef.current === currentKey) return;
    autoSelectKeyRef.current = currentKey;

    const desejado = selectDefaultVersaoId(versoesDisponiveis, versaoSelecionada);
    const atual = versaoSelecionada?.id ?? null;
    if (desejado !== atual) {
      onSelectRef.current(desejado, { silent: true });
    }
  }, [musicaId, versoesDisponiveis, versaoSelecionada, readOnly]);

  if (versoesDisponiveis.length === 0) return null;

  const badgeLabel = computeBadgeLabel(versaoSelecionada, versoesDisponiveis);
  const radioValue = versaoSelecionada?.id ?? SEM_VERSAO_VALUE;

  /**
   * Handler de mudança no radio group.
   * Converte o valor sentinela de volta para null e fecha o popover.
   *
   * @param value - Valor selecionado no radio group.
   */
  function handleValueChange(value: string) {
    const newId = value === SEM_VERSAO_VALUE ? null : value;
    onSelect(newId);
    setOpen(false);
  }

  const badgeClass =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-primary/30 bg-primary/10 text-primary flex-shrink-0";

  if (readOnly) {
    return (
      <span
        className={badgeClass}
        aria-label={`Versão selecionada: ${badgeLabel}`}
      >
        <Disc3 className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="truncate max-w-[10rem]">{badgeLabel}</span>
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
          aria-label={`Versão: ${badgeLabel}. Clique para alterar.`}
        >
          <Disc3 className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate max-w-[10rem]">{badgeLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-[calc(100vw-2rem)] p-3" align="start">
        <p id={tituloId} className="text-sm font-medium mb-2">
          Selecionar versão
        </p>
        <RadioGroup
          value={radioValue}
          onValueChange={handleValueChange}
          className="gap-2"
          aria-labelledby={tituloId}
        >
          {versoesDisponiveis.map((versao) => (
            <div key={versao.id} className="flex items-center space-x-2">
              <RadioGroupItem value={versao.id} id={`versao-${musicaId}-${versao.id}`} />
              <Label
                htmlFor={`versao-${musicaId}-${versao.id}`}
                className="text-sm cursor-pointer"
              >
                {versao.artista_nome ?? "Sem artista"}
              </Label>
            </div>
          ))}
          <div className="flex items-center space-x-2 border-t pt-2">
            <RadioGroupItem
              value={SEM_VERSAO_VALUE}
              id={`versao-${musicaId}-none`}
            />
            <Label
              htmlFor={`versao-${musicaId}-none`}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Sem versão
            </Label>
          </div>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}
