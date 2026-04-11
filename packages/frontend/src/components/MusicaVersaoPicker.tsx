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

import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Disc3 } from "lucide-react";
import type { VersaoMusica } from "@/schemas/evento";

/**
 * Valor sentinela para a opção "Sem versão" no radio group.
 * Usado porque RadioGroup não aceita string vazia como value.
 */
const SEM_VERSAO_VALUE = "__sem_versao__";

/**
 * Determina o ID da versão padrão a ser selecionada automaticamente.
 *
 * Regras:
 * - Se há 0 versões: retorna null.
 * - Se há seleção atual que ainda existe na lista: retorna o id da seleção atual.
 * - Se há seleção atual stale (não existe mais nas versões): retorna null.
 * - Se não há seleção e há exatamente 1 versão: retorna o id dessa versão (auto-select).
 * - Se não há seleção e há múltiplas versões: retorna null (não adivinha).
 *
 * @param versoes - Lista de versões disponíveis para a música.
 * @param current - Versão atualmente selecionada, ou null.
 * @returns ID da versão a selecionar, ou null.
 */
export function selectDefaultVersaoId(
  versoes: VersaoMusica[],
  current: VersaoMusica | null,
): string | null {
  if (versoes.length === 0) return null;

  if (current !== null) {
    const stillExists = versoes.some((v) => v.id === current.id);
    return stillExists ? current.id : null;
  }

  if (versoes.length === 1) return versoes[0].id;

  return null;
}

/**
 * Calcula o label do badge considerando o estado da seleção.
 *
 * @param versaoSelecionada - Versão selecionada (pode estar stale).
 * @param versoesDisponiveis - Lista atualizada de versões.
 * @returns Label a exibir no badge.
 */
function computeBadgeLabel(
  versaoSelecionada: VersaoMusica | null,
  versoesDisponiveis: VersaoMusica[],
): string {
  if (versaoSelecionada === null) return "Sem versão";

  const stillExists = versoesDisponiveis.some((v) => v.id === versaoSelecionada.id);
  if (!stillExists) return "Sem versão";

  return versaoSelecionada.artista_nome ?? "Sem artista";
}

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
  /**
   * Guard composto do auto-select: reseta sempre que `musicaId` muda ou que a quantidade
   * de versões disponíveis muda (ex.: versão adicionada/deletada no catálogo).
   */
  const autoSelectKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (readOnly) return;

    const currentKey = `${musicaId}:${versoesDisponiveis.length}`;
    if (autoSelectKeyRef.current === currentKey) return;

    // Caso 1: seleção stale — limpar silenciosamente.
    if (
      versaoSelecionada !== null &&
      !versoesDisponiveis.some((v) => v.id === versaoSelecionada.id)
    ) {
      autoSelectKeyRef.current = currentKey;
      onSelect(null, { silent: true });
      return;
    }

    // Caso 2: auto-select quando há exatamente uma versão e nenhuma seleção.
    if (versoesDisponiveis.length === 1 && versaoSelecionada === null) {
      autoSelectKeyRef.current = currentKey;
      onSelect(versoesDisponiveis[0].id, { silent: true });
      return;
    }

    autoSelectKeyRef.current = currentKey;
  }, [musicaId, versoesDisponiveis, versaoSelecionada, onSelect, readOnly]);

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
        <Disc3 className="h-3 w-3 mr-1" />
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
          aria-label={`Versão: ${badgeLabel}. Clique para alterar.`}
        >
          <Disc3 className="h-3 w-3 mr-1" />
          {badgeLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-sm font-medium mb-2">Selecionar versão</p>
        <RadioGroup
          value={radioValue}
          onValueChange={handleValueChange}
          className="gap-2"
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
