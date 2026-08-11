/**
 * Helpers de viewport para os testes E2E.
 *
 * Centraliza as checagens objetivas da regra mobile-first do projeto, usadas
 * por todos os specs `*.mobile.spec.ts`.
 */

import { expect, type Page } from "@playwright/test";

/**
 * Verifica que a página não transborda horizontalmente no viewport atual.
 *
 * A regra mobile do projeto proíbe depender de scroll horizontal; esta é a
 * checagem objetiva equivalente. Tolera 1px de arredondamento de layout.
 *
 * @param page - Instância da página do Playwright.
 */
export async function expectSemOverflowHorizontal(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    scrollWidth,
    `página transborda ${scrollWidth - clientWidth}px além do viewport de ${clientWidth}px`,
  ).toBeLessThanOrEqual(clientWidth + 1);
}
