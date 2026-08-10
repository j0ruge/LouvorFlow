/**
 * Combobox multi-seleção reutilizável com suporte a criação inline de novos itens.
 *
 * Construído sobre os componentes shadcn/ui `Popover` e `Command` (cmdk).
 * Permite buscar e filtrar opções existentes, selecionar múltiplos itens
 * exibidos como badges, e criar novos itens inline sem sair do formulário.
 * O popover permanece aberto após cada seleção para facilitar múltiplas escolhas.
 */

import { useId, useState, useMemo, useRef } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react";
import { normalizeForSearch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { ComboboxOption } from "@/components/CreatableCombobox";

/** Propriedades do componente CreatableMultiCombobox. */
interface CreatableMultiComboboxProps {
  /** Lista de opções disponíveis para seleção. */
  options: ComboboxOption[];
  /** Array de UUIDs dos itens selecionados. */
  value: string[];
  /** Callback ao alterar a seleção (adicionar ou remover itens). */
  onValueChange: (value: string[]) => void;
  /**
   * Callback para criar um novo item inline.
   * Recebe o texto digitado e deve retornar o UUID do item criado,
   * ou `undefined` se a criação falhar.
   */
  onCreate: (inputValue: string) => Promise<string | undefined>;
  /** Texto exibido no trigger quando nenhum valor está selecionado. */
  placeholder?: string;
  /** Texto exibido no campo de busca dentro do popover. */
  searchPlaceholder?: string;
  /**
   * Função para formatar o label do botão de criação.
   *
   * @param input - Texto digitado pelo usuário.
   * @returns Label do botão de criação (ex: `Criar "Louvor"`).
   */
  createLabel?: (input: string) => string;
  /** Desabilita o combobox. */
  disabled?: boolean;
  /** Exibe indicador de carregamento no trigger. */
  isLoading?: boolean;
}

/**
 * Combobox multi-seleção com busca e criação inline de novos itens.
 *
 * Exibe itens selecionados como badges com botão de remoção individual.
 * O popover permanece aberto após cada seleção para facilitar a escolha múltipla.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o combobox multi-seleção.
 */
export function CreatableMultiCombobox({
  options,
  value,
  onValueChange,
  onCreate,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  createLabel = (input) => `Criar "${input}"`,
  disabled = false,
  isLoading = false,
}: CreatableMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  /** ID único do listbox para wiring de `aria-controls` no trigger. */
  const listboxId = useId();
  /** Opções criadas localmente, exibidas até o refetch das options externas. */
  const [optimisticOptions, setOptimisticOptions] = useState<ComboboxOption[]>([]);

  /** Ref que mantém o valor atualizado de `value` para uso em callbacks assíncronos. */
  const valueRef = useRef(value);
  valueRef.current = value;

  /**
   * Opções mescladas: inclui opções otimistas que ainda não aparecem
   * nas options vindas do React Query.
   */
  const mergedOptions = useMemo(() => {
    const novas = optimisticOptions.filter(
      (opt) => !options.some((o) => o.value === opt.value),
    );
    return [...options, ...novas];
  }, [options, optimisticOptions]);

  /** Opções disponíveis para seleção (excluindo já selecionadas). */
  const availableOptions = useMemo(
    () => mergedOptions.filter((opt) => !value.includes(opt.value)),
    [mergedOptions, value],
  );

  /**
   * Verifica se o texto de busca tem correspondência exata em todas as opções
   * (incluindo já selecionadas), ignorando caso e diacríticos — "Adoração" e
   * "adoracao" comparam iguais. Usado para decidir se exibe o botão "Criar X",
   * evitando a criação de duplicatas que diferem apenas por acentuação.
   */
  const hasExactMatch = useMemo(() => {
    if (!search.trim()) return false;
    const needle = normalizeForSearch(search);
    return mergedOptions.some((opt) => normalizeForSearch(opt.label) === needle);
  }, [mergedOptions, search]);

  /**
   * Adiciona um item à seleção.
   *
   * @param itemValue - UUID do item a adicionar.
   */
  function handleSelect(itemValue: string) {
    onValueChange([...value, itemValue]);
    setSearch("");
  }

  /**
   * Remove um item da seleção.
   *
   * @param itemValue - UUID do item a remover.
   */
  function handleRemove(itemValue: string) {
    onValueChange(value.filter((v) => v !== itemValue));
  }

  /**
   * Cria um novo item inline e adiciona-o automaticamente à seleção.
   * Armazena a opção criada localmente para exibição imediata nos badges,
   * evitando flash enquanto o React Query refaz o fetch.
   */
  async function handleCreate() {
    if (!search.trim() || creating) return;
    setCreating(true);
    try {
      const label = search.trim();
      const newValue = await onCreate(label);
      if (newValue) {
        setOptimisticOptions((prev) => [...prev, { value: newValue, label }]);
        onValueChange([...valueRef.current, newValue]);
        setSearch("");
      }
    } finally {
      setCreating(false);
    }
  }

  /** Labels dos itens selecionados para exibição nos badges. */
  const selectedLabels = useMemo(
    () => value.map((v) => {
      const opt = mergedOptions.find((o) => o.value === v);
      return { value: v, label: opt?.label ?? v };
    }),
    [value, mergedOptions],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          className="w-full min-h-10 h-auto justify-between font-normal"
          disabled={disabled || isLoading}
          type="button"
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </span>
          ) : selectedLabels.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {selectedLabels.map((item) => (
                <Badge
                  key={item.value}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {item.label}
                  <button
                    type="button"
                    className="rounded-full outline-none hover:bg-muted-foreground/20 p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.value);
                    }}
                    aria-label={`Remover ${item.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          /**
           * Filtro explícito: o item de criação (sentinel `__create__:`) sempre
           * pontua 1 (sempre visível, independente da versão do cmdk — `forceMount`
           * sozinho não garante visibilidade contra o score). Demais itens usam
           * match por substring normalizada (ignora caso e diacríticos), coerente
           * com `hasExactMatch`.
           */
          filter={(value, searchTerm) => {
            if (value.startsWith("__create__:")) return 1;
            return normalizeForSearch(value).includes(normalizeForSearch(searchTerm))
              ? 1
              : 0;
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList id={listboxId}>
            {/*
              CommandEmpty só é renderizado quando NÃO há opção "Criar" disponível,
              evitando duplicar a ação de criação (uma no empty, outra no grupo abaixo).
            */}
            {!(search.trim() && !hasExactMatch) && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {availableOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {/*
              Botão "Criar" como CommandItem com forceMount — navegável por teclado
              (setas/Enter) mesmo quando a lista filtrada está vazia. O `value` usa
              um sentinel com separador (`:`) improvável de colidir com labels reais.
            */}
            {search.trim() && !hasExactMatch && (
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
