/**
 * Combobox reutilizável com suporte a criação inline de novos itens.
 *
 * Construído sobre os componentes shadcn/ui `Popover` e `Command` (cmdk).
 * Permite buscar e filtrar opções existentes, e quando o texto digitado
 * não corresponde a nenhuma opção, exibe um botão "Criar X" para
 * adicionar o item sem sair do formulário.
 */

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** Propriedades do componente CreatableCombobox. */
interface CreatableComboboxProps {
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
   */
  onCreate: (inputValue: string) => Promise<string | undefined>;
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
}

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
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  /** Opção criada localmente, exibida até o refetch das options externas. */
  const [optimistic, setOptimistic] = useState<ComboboxOption | null>(null);

  /**
   * Opções mescladas: inclui a opção otimista enquanto ela ainda não
   * aparece nas options vindas do React Query.
   */
  const mergedOptions = optimistic && !options.some((o) => o.value === optimistic.value)
    ? [...options, optimistic]
    : options;

  /** Label da opção selecionada para exibir no trigger. */
  const selectedLabel = mergedOptions.find((opt) => opt.value === value)?.label;

  /**
   * Verifica se o texto de busca tem correspondência exata nas opções.
   * Usado para decidir se exibe o botão "Criar X".
   */
  const hasExactMatch = mergedOptions.some(
    (opt) => opt.label.toLowerCase() === search.toLowerCase(),
  );

  /**
   * Cria um novo item inline e seleciona-o automaticamente.
   * Armazena a opção criada localmente para exibição imediata no trigger,
   * evitando flash do placeholder enquanto o React Query refaz o fetch.
   */
  async function handleCreate() {
    if (!search.trim() || creating) return;
    setCreating(true);
    try {
      const label = search.trim();
      const newValue = await onCreate(label);
      if (newValue) {
        setOptimistic({ value: newValue, label });
        onSelect(newValue);
        setSearch("");
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
    setSearch("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
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
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {creating ? "Criando..." : createLabel(search.trim())}
                </button>
              ) : (
                "Nenhum resultado encontrado."
              )}
            </CommandEmpty>
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
            {/* Botão "Criar" exibido abaixo das opções filtradas quando não há match exato */}
            {search.trim() && !hasExactMatch && mergedOptions.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search.trim()}`}
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
