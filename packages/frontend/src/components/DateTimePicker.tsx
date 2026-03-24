/**
 * Seletor de data e hora no formato brasileiro (dd/MM/yyyy HH:mm, relógio 24h).
 *
 * Utiliza Popover + Calendar (shadcn/ui) para seleção de data
 * e inputs numéricos para hora e minuto.
 * Recebe e emite valores no formato `YYYY-MM-DDThh:mm` (compatível com datetime-local).
 */

import { useState, useEffect, useCallback } from "react";
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
 * Componente de seleção de data e hora com formato brasileiro.
 *
 * Exibe a data no formato dd/MM/yyyy HH:mm e permite seleção
 * via calendário e selects de hora/minuto em formato 24h.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o seletor de data e hora.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecione a data e hora",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    parseValue(value),
  );
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");

  /** Sincroniza o estado interno quando o valor externo muda. */
  useEffect(
    function syncFromExternalValue() {
      const parsed = parseValue(value);
      if (parsed) {
        setSelectedDate(parsed);
        setHour(String(parsed.getHours()).padStart(2, "0"));
        setMinute(String(parsed.getMinutes()).padStart(2, "0"));
      } else {
        setSelectedDate(undefined);
        setHour("09");
        setMinute("00");
      }
    },
    [value],
  );

  /**
   * Emite o valor combinado de data + hora para o formulário pai.
   *
   * @param date - Data selecionada no calendário.
   * @param h - Hora selecionada (string 2 dígitos).
   * @param m - Minuto selecionado (string 2 dígitos).
   */
  const emitChange = useCallback(
    (date: Date | undefined, h: string, m: string) => {
      if (!date) {
        onChange("");
        return;
      }
      const combined = new Date(date);
      combined.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      onChange(formatToValue(combined));
    },
    [onChange],
  );

  /**
   * Handler para seleção de dia no calendário.
   *
   * @param day - Dia selecionado pelo react-day-picker.
   */
  function handleDaySelect(day: Date | undefined) {
    setSelectedDate(day);
    emitChange(day, hour, minute);
  }

  /**
   * Handler para alteração da hora.
   *
   * @param h - Nova hora selecionada.
   */
  function handleHourChange(h: string) {
    setHour(h);
    emitChange(selectedDate, h, minute);
  }

  /**
   * Handler para alteração do minuto.
   *
   * @param m - Novo minuto selecionado.
   */
  function handleMinuteChange(m: string) {
    setMinute(m);
    emitChange(selectedDate, hour, m);
  }

  /** Texto exibido no botão trigger. */
  const displayText = selectedDate
    ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) +
      ` ${hour}:${minute}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          locale={ptBR}
          initialFocus
        />
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">Horário:</span>
          <Select value={hour} onValueChange={handleHourChange}>
            <SelectTrigger className="w-[70px]">
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
          <Select value={minute} onValueChange={handleMinuteChange}>
            <SelectTrigger className="w-[70px]">
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
      </PopoverContent>
    </Popover>
  );
}
