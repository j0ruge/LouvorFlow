/**
 * Testes E2E para a página de detalhe de música.
 *
 * Verifica que os selects de tags e funções requeridas ficam desabilitados
 * e exibem mensagem informativa quando todos os itens já foram adicionados
 * ou quando não existem itens cadastrados no sistema.
 */

import { test, expect } from "@playwright/test";

test.describe("Música Detalhe — Select desabilitado sem itens disponíveis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/musicas");
    await expect(
      page.getByRole("heading", { name: "Músicas" }),
    ).toBeVisible();

    const detalhesBtn = page
      .getByRole("button")
      .filter({ hasText: "Detalhes" })
      .first();
    await expect(detalhesBtn).toBeVisible({ timeout: 10_000 });
    await detalhesBtn.click();

    await expect(
      page.getByRole("heading", { name: "Detalhes da Música" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("deve desabilitar select de tags quando não há opções disponíveis", async ({
    page,
  }) => {
    /**
     * Quando NÃO estamos editando o nome, os comboboxes visíveis são:
     * - índice 0: tags
     * - índice 1: funções requeridas
     */
    const tagSelect = page.getByRole("combobox").nth(0);
    const addTagBtn = page
      .locator("div.flex.items-center.gap-2")
      .filter({ has: tagSelect })
      .getByRole("button")
      .last();

    const MAX_ITERATIONS = 50;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const isDisabled = await tagSelect.isDisabled();
      if (isDisabled) break;

      await tagSelect.click();

      const options = page.getByRole("option");
      const count = await options.count();

      if (count === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addTagBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(tagSelect).toBeDisabled();
    await expect(tagSelect).toContainText(
      /Nenhuma tag cadastrada no sistema|Todas as tags já foram adicionadas/,
    );
  });

  test("deve desabilitar select de funções requeridas quando não há opções disponíveis", async ({
    page,
  }) => {
    /** Combobox de funções requeridas é o segundo visível (índice 1). */
    const funcaoSelect = page.getByRole("combobox").nth(1);
    const addFuncaoBtn = page
      .locator("div.flex.items-center.gap-2")
      .filter({ has: funcaoSelect })
      .getByRole("button")
      .last();

    const MAX_ITERATIONS = 50;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const isDisabled = await funcaoSelect.isDisabled();
      if (isDisabled) break;

      await funcaoSelect.click();

      const options = page.getByRole("option");
      const count = await options.count();

      if (count === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addFuncaoBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(funcaoSelect).toBeDisabled();
    await expect(funcaoSelect).toContainText(
      /Nenhuma função cadastrada no sistema|Todas as funções já foram adicionadas/,
    );
  });
});
