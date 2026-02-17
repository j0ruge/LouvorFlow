import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
