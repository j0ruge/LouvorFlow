/**
 * Helpers de contraste para os testes E2E.
 *
 * Centraliza a checagem objetiva de legibilidade (WCAG 2.1) usada pelos specs
 * que verificam badges e rótulos de status. Existe porque o defeito que
 * originou este helper — o badge "Inativa" de `admin/Igrejas.tsx` renderizando
 * a 1.08:1, praticamente invisível — passava despercebido por qualquer teste
 * que só assertasse a presença do texto.
 */

import { expect, type Page } from "@playwright/test";

/** Razão mínima do WCAG 2.1 AA para texto normal (abaixo de 18.66px bold). */
export const CONTRASTE_MINIMO_AA = 4.5;

/**
 * Mede a razão de contraste entre a cor do texto de um elemento e o primeiro
 * fundo opaco acima dele na árvore.
 *
 * Roda no browser porque só o estilo computado revela o resultado real da
 * cascata — a combinação de `variant` do `Badge` com overrides de `className`
 * não é decidível lendo o JSX.
 *
 * @param page - Instância da página do Playwright.
 * @param texto - Texto exato do elemento a medir (ex.: "Inativa").
 * @returns A razão de contraste, arredondada em duas casas.
 */
export async function medirContraste(page: Page, texto: string): Promise<number> {
  const razao = await page.evaluate((alvo) => {
    /**
     * Converte uma cor CSS `rgb()`/`rgba()` em luminância relativa (WCAG).
     *
     * @param css - Cor no formato devolvido por `getComputedStyle`.
     * @returns Luminância relativa entre 0 e 1.
     */
    function luminancia(css: string): number {
      const canais = (css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
      const linear = (c: number): number => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const [r, g, b] = canais;
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    }

    /**
     * Sobe a árvore até encontrar um fundo não transparente.
     *
     * @param el - Elemento de partida.
     * @returns A cor de fundo efetiva atrás do elemento.
     */
    function fundoEfetivo(el: Element): string {
      let atual: Element | null = el;
      while (atual) {
        const bg = getComputedStyle(atual).backgroundColor;
        if (bg && !bg.includes("rgba(0, 0, 0, 0)")) return bg;
        atual = atual.parentElement;
      }
      return "rgb(255, 255, 255)";
    }

    /**
     * Só elementos efetivamente renderizados entram na medição.
     *
     * As telas com layout dual (cards no mobile + tabela no desktop) mantêm as
     * duas variantes no DOM e escondem uma com `display:none`. Sem este filtro,
     * a medição pegaria a variante oculta — a primeira na ordem do documento —
     * e o teste passaria a falar de um elemento que ninguém vê.
     */
    const el = [...document.querySelectorAll("*")].find(
      (e) =>
        e.textContent?.trim() === alvo &&
        e.children.length === 0 &&
        e.getClientRects().length > 0,
    );
    if (!el) return -1;

    const lTexto = luminancia(getComputedStyle(el).color);
    const lFundo = luminancia(fundoEfetivo(el));
    const claro = Math.max(lTexto, lFundo);
    const escuro = Math.min(lTexto, lFundo);
    return Number(((claro + 0.05) / (escuro + 0.05)).toFixed(2));
  }, texto);

  expect(razao, `elemento com texto "${texto}" não encontrado na página`).toBeGreaterThan(0);
  return razao;
}

/**
 * Verifica que um texto atinge o mínimo de contraste do WCAG AA.
 *
 * @param page - Instância da página do Playwright.
 * @param texto - Texto exato do elemento a medir.
 */
export async function expectContrasteAA(page: Page, texto: string): Promise<void> {
  const razao = await medirContraste(page, texto);

  expect(
    razao,
    `"${texto}" tem contraste ${razao}:1, abaixo do mínimo AA de ${CONTRASTE_MINIMO_AA}:1`,
  ).toBeGreaterThanOrEqual(CONTRASTE_MINIMO_AA);
}
