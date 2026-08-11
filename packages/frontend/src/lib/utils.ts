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

/**
 * Mapeamento de nomes técnicos de role para rótulos amigáveis em PT-BR.
 *
 * Centralizado aqui para evitar duplicação em componentes (UserMenu, badges,
 * páginas administrativas). Roles desconhecidas caem para capitalização do
 * próprio nome técnico via `formatRoleLabel`.
 */
export const ROLE_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  lider: "Líder",
  integrante: "Integrante",
};

/**
 * Formata o nome técnico de uma role para exibição em PT-BR.
 *
 * Procura primeiro em `ROLE_LABELS`; se não houver entrada, capitaliza a
 * primeira letra do nome técnico como fallback determinístico.
 *
 * @param roleName - Nome técnico da role (ex: `"admin"`, `"lider"`).
 * @returns Rótulo amigável para exibição.
 */
export function formatRoleLabel(roleName: string): string {
  return (
    ROLE_LABELS[roleName] ??
    roleName.charAt(0).toUpperCase() + roleName.slice(1)
  );
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
 * Para timestamps com componente de hora (ex: `2026-03-21T10:00:00Z`) usa o
 * timezone local do navegador, coerente com `toDatetimeLocalValue` e
 * `localDatetimeToISO`. Para strings _date-only_ (`YYYY-MM-DD`), usa getters
 * UTC para evitar deslocamento de um dia em fusos ocidentais (ex: Brasil
 * mostraria 26 ao receber `2026-03-27`).
 *
 * Em caso de data inválida, retorna `{ dia: NaN, mes: "" }` para evitar
 * `undefined` no DOM.
 *
 * @param iso - Data em formato ISO 8601 ou parsável pelo construtor `Date`.
 * @returns Objeto com `dia` (1-31, ou `NaN` se inválida) e `mes` (3 letras).
 */
export function formatDateBlock(iso: string): { dia: number; mes: string } {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return { dia: NaN, mes: "" };

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const dia = isDateOnly ? date.getUTCDate() : date.getDate();
  const mesIndex = isDateOnly ? date.getUTCMonth() : date.getMonth();
  return { dia, mes: MESES_ABREV[mesIndex] };
}

/**
 * Formata uma data ISO 8601 por extenso em PT-BR (ex: `"27 de março"`).
 *
 * Espelha exatamente a regra de fuso horário de `formatDateBlock`: strings
 * _date-only_ (`YYYY-MM-DD`) são lidas com `timeZone: "UTC"` no formatador;
 * timestamps com componente de hora usam o fuso local do navegador (omitindo
 * `timeZone`). Isso evita que o bloco de data (`formatDateBlock`) e esta linha
 * por extenso divirjam em um dia quando exibidos lado a lado em fusos
 * ocidentais (ex: Brasil).
 *
 * Usa `Intl.DateTimeFormat("pt-BR", …).formatToParts` para extrair dia e mês
 * separadamente, o que permite capitalizar apenas o nome do mês quando
 * solicitado — o dia é sempre numérico, então capitalizar a string inteira
 * não teria efeito visível.
 *
 * @param iso - Data em formato ISO 8601 ou parsável pelo construtor `Date`. `null`/`undefined`
 * são tratados explicitamente como inválidos: `new Date(null)` resolveria para o epoch
 * (1970-01-01) em vez de lançar ou virar `Invalid Date`, o que mascararia o problema.
 * @param opcoes - Opções de formatação.
 * @param opcoes.capitalizar - Quando `true`, capitaliza a primeira letra do
 * nome do mês (ex: `"27 de Março"`). Padrão: `false` (`"27 de março"`, forma
 * gramaticalmente correta em PT-BR para uso em texto corrido).
 * @returns Texto no formato `"{dia} de {mês}"`, ou string vazia se a data for inválida.
 */
export function formatDataExtenso(
  iso: string,
  { capitalizar = false }: { capitalizar?: boolean } = {},
): string {
  if (iso == null) return "";

  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: isDateOnly ? "UTC" : undefined,
  });

  return formatter
    .formatToParts(date)
    .map((parte) =>
      capitalizar && parte.type === "month"
        ? parte.value.charAt(0).toUpperCase() + parte.value.slice(1)
        : parte.value,
    )
    .join("");
}

/**
 * Normaliza uma string removendo acentos/diacríticos e baixando o caso
 * para permitir comparação insensível em PT-BR.
 *
 * Usa decomposição Unicode NFD para separar letras e diacríticos, então
 * filtra a faixa combining marks (`U+0300`–`U+036F`). Resultado: `"Adoração"`
 * e `"adoracao"` comparam iguais.
 *
 * @param value - Texto a normalizar.
 * @returns Texto sem acentos, em minúsculas.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Helper de acessibilidade para elementos com `role="button"` que devem ser
 * acionados por Enter ou Space (WCAG 2.1.4 — Keyboard accessible).
 *
 * Retorna um handler `onKeyDown` que invoca `action` ao detectar Enter ou
 * Space, prevenindo o scroll padrão do navegador no caso do Space. Eventos
 * com `event.repeat === true` (tecla mantida pressionada) são ignorados
 * para evitar disparos múltiplos consecutivos da ação.
 *
 * @param action - Função a ser executada quando o usuário aciona via teclado.
 * @returns Handler de evento `onKeyDown` para anexar ao elemento clicável.
 */
export function handleClickableKeyDown(
  action: () => void,
): (event: React.KeyboardEvent) => void {
  return (event) => {
    if (event.repeat) return;
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
