/**
 * Utilitários de ordenação alfabética em português do Brasil.
 *
 * Centraliza o `Intl.Collator` pt-BR usado pelos services que retornam
 * listas ordenadas por nome. A ordenação vive no backend (fonte da verdade)
 * e no service — não em `ORDER BY` — para ser determinística independente
 * do locale/collation do banco (um `lc_collate` C ordenaria "Ágape" depois
 * de "Zelo").
 */

/** Collator pt-BR reutilizável (instanciar `Intl.Collator` é custoso; criar uma única vez). */
const collatorPtBr = new Intl.Collator('pt-BR');

/**
 * Compara dois nomes alfabeticamente em pt-BR (acentos junto da letra-base).
 *
 * @param a - Primeiro nome.
 * @param b - Segundo nome.
 * @returns Negativo se `a` vem antes, positivo se vem depois, 0 se equivalentes.
 */
export function compararNomesPtBr(a: string, b: string): number {
    return collatorPtBr.compare(a, b);
}
