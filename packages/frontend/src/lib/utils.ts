import type React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma string de data (ISO 8601 ou similar) para o formato
 * esperado pelo input `datetime-local` (`YYYY-MM-DDThh:mm`).
 *
 * Utiliza o objeto `Date` para parsing robusto, evitando dependência
 * do formato exato da string retornada pela API.
 *
 * @param dateString - String de data a ser formatada.
 * @returns String no formato `YYYY-MM-DDThh:mm` ou string vazia se inválida.
 */
export function toDatetimeLocalValue(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Extrai as iniciais do nome para exibir em avatares.
 *
 * @param name - Nome completo do usuário.
 * @returns Até duas iniciais em maiúsculo.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Verifica se uma URL de redirecionamento é segura (interna).
 *
 * Previne open redirect validando que a URL começa com `/`
 * e não com `//` (protocolo relativo que levaria a domínio externo).
 *
 * @param url - String da URL de redirecionamento.
 * @returns `true` se a URL for um caminho interno seguro.
 */
export function isSafeRedirect(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * Verifica se a URL usa protocolo seguro (http ou https).
 *
 * Previne XSS via protocolos perigosos como `javascript:` ou `data:`
 * ao validar URLs dinâmicas antes de renderizá-las em atributos `href`.
 *
 * @param url - String da URL a ser validada.
 * @returns `true` se a URL usar http ou https, `false` caso contrário.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Abreviações de mês em PT-BR (3 letras, primeira maiúscula). */
export const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/**
 * Extrai dia e mês abreviado em PT-BR de uma data ISO 8601.
 *
 * Usa intencionalmente o **timezone local do navegador** (`getDate`/`getMonth`),
 * coerente com `toDatetimeLocalValue` e `localDatetimeToISO` no mesmo módulo.
 * O backend armazena `data` como `DateTime` (timestamp completo); a renderização
 * do dia/mês reflete o fuso do usuário, que é o que se espera ao exibir uma
 * agenda local. Para datas-only sem componente de hora, considere normalizar
 * antes de chamar esta função.
 *
 * @param iso - Data em formato ISO 8601 ou parsável pelo construtor `Date`.
 * @returns Objeto com `dia` (1-31) e `mes` (3 letras, primeira maiúscula).
 */
export function formatDateBlock(iso: string): { dia: number; mes: string } {
  const date = new Date(iso);
  return { dia: date.getDate(), mes: MESES_ABREV[date.getMonth()] };
}

/**
 * Helper de acessibilidade para elementos com `role="button"` que devem ser
 * acionados por Enter ou Space (WCAG 2.1.4 — Keyboard accessible).
 *
 * Retorna um handler `onKeyDown` que invoca `action` ao detectar Enter ou
 * Space, prevenindo o scroll padrão do navegador no caso do Space.
 *
 * @param action - Função a ser executada quando o usuário aciona via teclado.
 * @returns Handler de evento `onKeyDown` para anexar ao elemento clicável.
 */
export function handleClickableKeyDown(
  action: () => void,
): (event: React.KeyboardEvent) => void {
  return (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };
}

/**
 * Converte valor do input datetime-local para string ISO 8601 UTC.
 *
 * O input `datetime-local` produz strings no formato `YYYY-MM-DDThh:mm`,
 * que são interpretadas como horário local pelo construtor `Date`.
 * Esta função converte para ISO UTC (`...Z`) para envio ao backend.
 *
 * @param datetimeLocal - Valor do input datetime-local (ex: `"2026-03-21T10:00"`).
 * @returns String ISO 8601 em UTC, ou string vazia se a data for inválida.
 */
export function localDatetimeToISO(datetimeLocal: string): string {
  const date = new Date(datetimeLocal);
  if (isNaN(date.getTime())) return "";

  return date.toISOString();
}
