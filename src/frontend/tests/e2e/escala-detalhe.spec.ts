/**
 * Testes E2E para a página de detalhe de escala.
 *
 * Verifica que os selects de integrantes e músicas ficam desabilitados
 * e exibem mensagem informativa quando todos os itens já foram adicionados
 * ou quando não existem itens cadastrados no sistema.
 */

import { test, expect } from "@playwright/test";

test.describe("Escala Detalhe — Select desabilitado sem itens disponíveis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/escalas");
    await expect(
      page.getByRole("heading", { name: "Escalas" }),
    ).toBeVisible();

    const detalhesBtn = page
      .getByRole("button", { name: "Ver Detalhes" })
      .first();
    await expect(detalhesBtn).toBeVisible({ timeout: 10_000 });
    await detalhesBtn.click();

    await expect(page.getByText("Detalhes da Escala")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("deve desabilitar select de integrantes quando não há opções disponíveis", async ({
    page,
  }) => {
    /** Localiza os dois comboboxes: músicas (índice 0) e integrantes (índice 1). */
    const integranteSelect = page.getByRole("combobox").nth(1);
    const addIntegranteBtn = page
      .locator("div.flex.items-center.gap-2")
      .nth(1)
      .getByRole("button")
      .last();

    const MAX_ITERATIONS = 50;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const isDisabled = await integranteSelect.isDisabled();
      if (isDisabled) break;

      await integranteSelect.click();

      const options = page.getByRole("option");
      const count = await options.count();

      if (count === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addIntegranteBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(integranteSelect).toBeDisabled();
    await expect(integranteSelect).toContainText(
      /Nenhum integrante cadastrado no sistema|Todos os integrantes já foram adicionados/,
    );
  });

  test("deve desabilitar select de músicas quando não há opções disponíveis", async ({
    page,
  }) => {
    /** Localiza os dois comboboxes: músicas (índice 0) e integrantes (índice 1). */
    const musicaSelect = page.getByRole("combobox").nth(0);
    const addMusicaBtn = page
      .locator("div.flex.items-center.gap-2")
      .nth(0)
      .getByRole("button")
      .last();

    const MAX_ITERATIONS = 100;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const isDisabled = await musicaSelect.isDisabled();
      if (isDisabled) break;

      await musicaSelect.click();

      const options = page.getByRole("option");
      const count = await options.count();

      if (count === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addMusicaBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(musicaSelect).toBeDisabled();
    await expect(musicaSelect).toContainText(
      /Nenhuma música cadastrada no sistema|Todas as músicas já foram adicionadas/,
    );
  });
});
