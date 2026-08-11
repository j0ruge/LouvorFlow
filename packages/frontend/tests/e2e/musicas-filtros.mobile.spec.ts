/**
 * Testes E2E mobile (Galaxy S8, 360×740) dos filtros colapsáveis da página
 * de Músicas.
 *
 * Verifica a regra mobile-first do projeto: a busca é a protagonista — os
 * chips de filtro ficam ocultos atrás do botão "Filtros" (bottom-sheet) e a
 * página não gera rolagem horizontal.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { expectSemOverflowHorizontal } from "./helpers/viewport";

test.describe("Mobile — Músicas: filtros colapsáveis (360×740)", () => {
  /** Autentica e abre a página de Músicas antes de cada caso. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();
  });

  /** Os chips inline ficam ocultos e o botão "Filtros" fica visível. */
  test("esconde os chips inline e mostra o botão Filtros", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^filtros/i })).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Filtrar por categoria" }),
    ).toBeHidden();
    await expect(
      page.getByRole("group", { name: "Filtrar por intensidade (tempo)" }),
    ).toBeHidden();
  });

  /** O botão "Filtros" abre o bottom-sheet com os grupos de chips. */
  test("abre o bottom-sheet com os chips ao tocar em Filtros", async ({ page }) => {
    await page.getByRole("button", { name: /^filtros/i }).click();

    const drawer = page.getByRole("dialog");
    await expect(
      drawer.getByRole("group", { name: "Filtrar por intensidade (tempo)" }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("group", { name: "Filtrar por categoria" }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: "Limpar filtros" }),
    ).toBeVisible();
  });

  /** Selecionar um chip aplica o filtro na URL e o contador aparece no botão. */
  test("aplica filtro pela URL e exibe contador no botão", async ({ page }) => {
    await page.getByRole("button", { name: /^filtros/i }).click();

    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: "Calma" }).click();
    await expect(page).toHaveURL(/intensidades=calma/);

    await drawer.getByRole("button", { name: "Ver resultados" }).click();
    await expect(drawer).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^filtros, 1 /i }),
    ).toBeVisible();
  });

  /** A página não pode exigir rolagem horizontal. */
  test("não deve ter overflow horizontal", async ({ page }) => {
    await expectSemOverflowHorizontal(page);
  });

  /**
   * Selecionar um filtro no drawer também exibe o badge removível na linha
   * de resultados (fora do drawer, sem breakpoint de mobile) — coerente com
   * o contador exibido no botão "Filtros".
   */
  test("badge do filtro ativo aparece na linha de resultados", async ({ page }) => {
    await page.getByRole("button", { name: /^filtros/i }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: "Calma" }).click();
    await drawer.getByRole("button", { name: "Ver resultados" }).click();
    await expect(drawer).toBeHidden();

    await expect(
      page.getByRole("button", { name: "Remover filtro Calma" }),
    ).toBeVisible();
  });

  /**
   * Remover um badge de filtro na linha de resultados tira o parâmetro
   * correspondente da URL, sem precisar reabrir o drawer.
   */
  test("remover badge de filtro tira o parâmetro da URL", async ({ page }) => {
    await page.getByRole("button", { name: /^filtros/i }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: "Calma" }).click();
    await expect(page).toHaveURL(/intensidades=calma/);
    await drawer.getByRole("button", { name: "Ver resultados" }).click();

    await page.getByRole("button", { name: "Remover filtro Calma" }).click();

    await expect(page).not.toHaveURL(/intensidades=calma/);
    await expect(
      page.getByRole("button", { name: "Remover filtro Calma" }),
    ).toBeHidden();
  });

  /**
   * Um termo de busca longo (contagem + `para "termo"` + badges na mesma
   * linha) não pode gerar rolagem horizontal — a linha de resultados
   * depende de `flex-wrap` para isso.
   */
  test("não deve ter overflow horizontal com termo de busca longo", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");
    await searchInput.fill(
      "um termo de busca bem comprido para testar a quebra de linha no mobile",
    );
    await expect(page.getByRole("status")).toBeVisible({ timeout: 5_000 });

    await expectSemOverflowHorizontal(page);
  });
});
