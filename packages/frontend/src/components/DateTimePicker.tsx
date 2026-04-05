/**
 * Seletor de data e hora no formato brasileiro (dd/MM/yyyy HH:mm, relógio 24h).
 *
 * Utiliza Popover + Calendar (shadcn/ui) no desktop e Drawer (bottom sheet)
 * no mobile para evitar overflow em telas pequenas.
 * Recebe e emite valores no formato `YYYY-MM-DDThh:mm` (compatível com datetime-local).
 */

import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

/** Propriedades do componente DateTimePicker. */
interface DateTimePickerProps {
  /** Valor atual no formato `YYYY-MM-DDThh:mm` ou string vazia. */
  value: string;
  /** Callback chamado ao alterar o valor. */
  onChange: (value: string) => void;
  /** Placeholder exibido quando não há valor selecionado. */
  placeholder?: string;
}

/**
 * Gera um array de opções para selects de hora ou minuto.
 *
 * @param max - Valor máximo exclusivo (24 para horas, 60 para minutos).
 * @returns Array de strings com dois dígitos (ex: "00", "01", ..., "23").
 */
function generateOptions(max: number): string[] {
  return Array.from({ length: max }, (_, i) => String(i).padStart(2, "0"));
}

const HOURS = generateOptions(24);
const MINUTES = generateOptions(60);

/**
 * Converte uma string no formato `YYYY-MM-DDThh:mm` para um objeto Date.
 *
 * @param value - String no formato datetime-local.
 * @returns Objeto Date ou undefined se inválido.
 */
function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(date) ? date : undefined;
}

/**
 * Formata um objeto Date para o formato `YYYY-MM-DDThh:mm`.
 *
 * @param date - Objeto Date a ser formatado.
 * @returns String no formato datetime-local.
 */
function formatToValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Conteúdo compartilhado do picker: calendário, seletores de horário e botões.
 *
 * @param props - Propriedades internas do conteúdo.
 * @returns Elemento React com calendário, hora/minuto e botões confirmar/cancelar.
 */
function DateTimePickerContent({
  draftDate,
  draftHour,
  draftMinute,
  onDaySelect,
  onHourChange,
  onMinuteChange,
  onConfirm,
  onCancel,
}: {
  draftDate: Date | undefined;
  draftHour: string;
  draftMinute: string;
  onDaySelect: (day: Date | undefined) => void;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Calendar
        mode="single"
        selected={draftDate}
        onSelect={onDaySelect}
        locale={ptBR}
        initialFocus
      />
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <span className="text-sm text-muted-foreground">Horário:</span>
        <Select value={draftHour} onValueChange={onHourChange}>
          <SelectTrigger className="w-[70px] min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm font-medium">:</span>
        <Select value={draftMinute} onValueChange={onMinuteChange}>
          <SelectTrigger className="w-[70px] min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={onConfirm} disabled={!draftDate}>
          Confirmar
        </Button>
      </div>
    </>
  );
}

/**
 * Componente de seleção de data e hora com formato brasileiro.
 *
 * No desktop, exibe o calendário em um Popover flutuante.
 * No mobile, exibe o calendário em um Drawer (bottom sheet)
 * para evitar overflow e deslocamento de conteúdo.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o seletor de data e hora.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecione a data e hora",
}: DateTimePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(
    parseValue(value),
  );
  const [draftHour, setDraftHour] = useState("09");
  const [draftMinute, setDraftMinute] = useState("00");

  /** Sincroniza o rascunho interno quando o valor externo muda (e o picker está fechado). */
  useEffect(
    function syncFromExternalValue() {
      if (open) return;
      const parsed = parseValue(value);
      if (parsed) {
        setDraftDate(parsed);
        setDraftHour(String(parsed.getHours()).padStart(2, "0"));
        setDraftMinute(String(parsed.getMinutes()).padStart(2, "0"));
      } else {
        setDraftDate(undefined);
        setDraftHour("09");
        setDraftMinute("00");
      }
    },
    [value, open],
  );

  /**
   * Restaura o rascunho ao valor confirmado ao abrir o picker.
   */
  useEffect(
    function resetDraftOnOpen() {
      if (!open) return;
      const parsed = parseValue(value);
      if (parsed) {
        setDraftDate(parsed);
        setDraftHour(String(parsed.getHours()).padStart(2, "0"));
        setDraftMinute(String(parsed.getMinutes()).padStart(2, "0"));
      } else {
        setDraftDate(undefined);
        setDraftHour("09");
        setDraftMinute("00");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  /**
   * Handler para seleção de dia no calendário (apenas rascunho).
   *
   * @param day - Dia selecionado pelo react-day-picker.
   */
  function handleDaySelect(day: Date | undefined) {
    setDraftDate(day);
  }

  /**
   * Handler para alteração da hora (apenas rascunho).
   *
   * @param h - Nova hora selecionada.
   */
  function handleHourChange(h: string) {
    setDraftHour(h);
  }

  /**
   * Handler para alteração do minuto (apenas rascunho).
   *
   * @param m - Novo minuto selecionado.
   */
  function handleMinuteChange(m: string) {
    setDraftMinute(m);
  }

  /**
   * Confirma a seleção, emitindo o valor combinado de data + hora
   * e fechando o picker.
   */
  function handleConfirm() {
    if (draftDate) {
      const combined = new Date(draftDate);
      combined.setHours(
        parseInt(draftHour, 10),
        parseInt(draftMinute, 10),
        0,
        0,
      );
      onChange(formatToValue(combined));
    }
    setOpen(false);
  }

  /**
   * Cancela a seleção, descartando o rascunho e fechando o picker.
   */
  function handleCancel() {
    setOpen(false);
  }

  /** Texto exibido no botão trigger com base no valor confirmado. */
  const confirmed = parseValue(value);
  const displayText = confirmed
    ? format(confirmed, "dd/MM/yyyy", { locale: ptBR }) +
      ` ${String(confirmed.getHours()).padStart(2, "0")}:${String(confirmed.getMinutes()).padStart(2, "0")}`
    : placeholder;

  /** Props compartilhadas para o conteúdo do picker. */
  const contentProps = {
    draftDate,
    draftHour,
    draftMinute,
    onDaySelect: handleDaySelect,
    onHourChange: handleHourChange,
    onMinuteChange: handleMinuteChange,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  /** Renderização mobile: calendário em Drawer (bottom sheet). */
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !confirmed && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="sr-only">
            Selecione a data e hora
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Escolha uma data no calendário e defina o horário
          </DrawerDescription>
          <div className="flex flex-col items-center px-4 pb-6">
            <DateTimePickerContent {...contentProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  /** Renderização desktop: calendário em Popover flutuante. */
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !confirmed && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" collisionPadding={16}>
        <DateTimePickerContent {...contentProps} />
      </PopoverContent>
    </Popover>
  );
}
