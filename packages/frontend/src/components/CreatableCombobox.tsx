/**
 * Combobox reutilizável com busca e suporte opcional a criação inline.
 *
 * Construído sobre os componentes shadcn/ui `Popover` e `Command` (cmdk).
 * Permite buscar e filtrar opções existentes. Quando `onCreate` é fornecido
 * e o texto digitado não corresponde a nenhuma opção, exibe um botão
 * "Criar X" para adicionar o item sem sair do formulário.
 * Quando `onCreate` é omitido, funciona como um select com busca puro.
 */

import { useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn, normalizeForSearch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/** Opção individual do combobox. */
export interface ComboboxOption {
  /** Valor único identificador (ex: UUID). */
  value: string;
  /** Texto exibido na lista e no trigger. */
  label: string;
}

/** Propriedades comuns a qualquer modo de operação do combobox. */
interface CreatableComboboxBaseProps {
  /** Lista de opções disponíveis para seleção. */
  options: ComboboxOption[];
  /** Valor atualmente selecionado (UUID). */
  value: string | undefined;
  /** Callback ao selecionar uma opção existente ou recém-criada. */
  onSelect: (value: string) => void;
  /**
   * Callback para criar um novo item inline.
   * Recebe o texto digitado e deve retornar o UUID do item criado,
   * ou `undefined` se a criação falhar.
   * Quando omitido, o combobox funciona apenas como select com busca.
   */
  onCreate?: (inputValue: string) => Promise<string | undefined>;
  /** Texto exibido no trigger quando nenhum valor está selecionado. */
  placeholder?: string;
  /** Texto exibido no campo de busca dentro do popover. */
  searchPlaceholder?: string;
  /**
   * Função para formatar o label do botão de criação.
   * @param input - Texto digitado pelo usuário.
   * @returns Label do botão de criação (ex: `Criar "Dó Maior"`).
   */
  createLabel?: (input: string) => string;
  /** Desabilita o combobox. */
  disabled?: boolean;
  /** Exibe indicador de carregamento no trigger. */
  isLoading?: boolean;
  /**
   * ID(s) de elemento(s) descritivos associados ao combobox para
   * leitores de tela (encaminhado ao trigger via `aria-describedby`).
   */
  "aria-describedby"?: string;
  /**
   * Mensagem exibida quando não há opções e nenhuma busca está em
   * andamento. Padrão: "Nenhum resultado encontrado.".
   */
  emptyMessage?: string;
}

/** Modo padrão: filtro client-side via cmdk. */
interface CreatableComboboxInternalSearchProps extends CreatableComboboxBaseProps {
  /** Em modo interno, `searchValue` não é aceito. */
  searchValue?: undefined;
  /** Em modo interno, `onSearchChange` não é aceito. */
  onSearchChange?: undefined;
  /** Em modo interno, `isSearching` não faz sentido. */
  isSearching?: undefined;
}

/**
 * Modo de busca externa (server-side): consumidor controla o texto
 * e dispara consultas ao servidor com debounce. `searchValue` e
 * `onSearchChange` DEVEM ser passados juntos para ativar este modo.
 */
interface CreatableComboboxExternalSearchProps extends CreatableComboboxBaseProps {
  /** Valor controlado do campo de busca. */
  searchValue: string;
  /** Callback executado a cada alteração no campo de busca. */
  onSearchChange: (value: string) => void;
  /** Indica que uma busca externa está em andamento (renderiza loading). */
  isSearching?: boolean;
}

/**
 * Props do combobox — união discriminada que força o consumidor a
 * passar `searchValue` + `onSearchChange` juntos (modo externo) ou
 * nenhum dos dois (modo interno). Previne uso incorreto detectável
 * em tempo de compilação.
 */
type CreatableComboboxProps =
  | CreatableComboboxInternalSearchProps
  | CreatableComboboxExternalSearchProps;

/**
 * Combobox com busca e criação inline de novos itens.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o combobox.
 */
export function CreatableCombobox({
  options,
  value,
  onSelect,
  onCreate,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  createLabel = (input) => `Criar "${input}"`,
  disabled = false,
  isLoading = false,
  "aria-describedby": ariaDescribedBy,
  searchValue,
  onSearchChange,
  isSearching = false,
  emptyMessage = "Nenhum resultado encontrado.",
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  /** Estado interno de busca usado apenas no modo client-side. */
  const [internalSearch, setInternalSearch] = useState("");
  const [creating, setCreating] = useState(false);
  /** ID único do listbox para wiring de `aria-controls` no trigger. */
  const listboxId = useId();
  /** Indica se o combobox opera em modo de busca externa (server-side). */
  const isExternalSearch = onSearchChange !== undefined;
  /** Texto efetivo de busca: vem do parent quando controlado. */
  const search = isExternalSearch ? (searchValue ?? "") : internalSearch;
  /**
   * Encaminha o texto digitado para o parent (modo externo) ou para o
   * estado interno (modo client-side).
   *
   * @param value - Novo valor do campo de busca.
   */
  const handleSearchChange = (value: string) => {
    if (isExternalSearch) {
      onSearchChange(value);
    } else {
      setInternalSearch(value);
    }
  };
  /** Opção criada localmente, exibida até o refetch das options externas. */
  const [optimistic, setOptimistic] = useState<ComboboxOption | null>(null);

  /**
   * Opções mescladas: inclui a opção otimista enquanto ela ainda não
   * aparece nas options vindas do React Query. Memoizado para evitar
   * recriação do array a cada render quando `optimistic` está ativo.
   */
  const mergedOptions = useMemo(
    () =>
      optimistic && !options.some((o) => o.value === optimistic.value)
        ? [...options, optimistic]
        : options,
    [options, optimistic],
  );

  /** Label da opção selecionada para exibir no trigger. */
  const selectedLabel = mergedOptions.find((opt) => opt.value === value)?.label;

  /**
   * Verifica se o texto de busca tem correspondência exata nas opções,
   * ignorando caso e diacríticos. "Adoração" e "adoracao" comparam iguais.
   */
  const hasExactMatch = useMemo(() => {
    if (!search.trim()) return false;
    const needle = normalizeForSearch(search);
    return mergedOptions.some((opt) => normalizeForSearch(opt.label) === needle);
  }, [mergedOptions, search]);

  /**
   * Cria um novo item inline e seleciona-o automaticamente.
   * Armazena a opção criada localmente para exibição imediata no trigger,
   * evitando flash do placeholder enquanto o React Query refaz o fetch.
   */
  async function handleCreate() {
    if (!onCreate || !search.trim() || creating) return;
    setCreating(true);
    try {
      const label = search.trim();
      const newValue = await onCreate(label);
      if (newValue) {
        setOptimistic({ value: newValue, label });
        onSelect(newValue);
        handleSearchChange("");
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  }

  /**
   * Seleciona uma opção existente e fecha o popover.
   *
   * @param selectedValue - UUID da opção selecionada.
   */
  function handleSelect(selectedValue: string) {
    onSelect(selectedValue);
    handleSearchChange("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-describedby={ariaDescribedBy}
          className="w-full justify-between font-normal"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </span>
          ) : selectedLabel ? (
            <span className="truncate">{selectedLabel}</span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={!isExternalSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList id={listboxId}>
            {isExternalSearch && isSearching && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}
            {/*
              CommandEmpty só é renderizado quando NÃO há opção "Criar"
              disponível — evita gap em branco abaixo do spinner e duplicação
              com o CommandItem forceMount de criação abaixo.
            */}
            {!(isExternalSearch && isSearching) &&
              !(onCreate && search.trim() && !hasExactMatch) && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}
            <CommandGroup>
              {mergedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {/*
              Botão "Criar" como CommandItem com forceMount — keyboard-accessível
              via setas/Enter mesmo quando a lista filtrada está vazia.
              O `value` usa um sentinel improvável de colidir com labels reais.
            */}
            {onCreate &&
              search.trim() &&
              !hasExactMatch &&
              !(isExternalSearch && isSearching) && (
                <CommandGroup forceMount>
                  <CommandItem
                    forceMount
                    value={`__create__:${search.trim()}`}
                    onSelect={handleCreate}
                    disabled={creating}
                    className="text-primary"
                  >
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {creating ? "Criando..." : createLabel(search.trim())}
                  </CommandItem>
                </CommandGroup>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
