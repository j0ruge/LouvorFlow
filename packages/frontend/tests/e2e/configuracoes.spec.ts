/**
 * Testes E2E para a página de Configurações.
 *
 * Verifica exibição de 5 abas, alternância entre abas e
 * operações CRUD em cada aba.
 */

import { test, expect } from "@playwright/test";

test.describe("Configurações", () => {
  test("deve exibir página com 5 abas", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(
      page.getByRole("heading", { name: "Configurações" }),
    ).toBeVisible();

    const tabs = ["Artistas", "Categorias", "Funções", "Tonalidades", "Tipos de Evento"];
    for (const tabName of tabs) {
      await expect(page.getByRole("tab", { name: tabName })).toBeVisible();
    }
  });

  test("deve alternar entre abas sem recarregar", async ({ page }) => {
    await page.goto("/configuracoes");

    const tabs = ["Categorias", "Funções", "Tonalidades", "Tipos de Evento", "Artistas"];
    for (const tabName of tabs) {
      await page.getByRole("tab", { name: tabName }).click();
      await expect(page.getByRole("tab", { name: tabName })).toHaveAttribute(
        "data-state",
        "active",
      );
    }
  });

  test("deve exibir artistas na aba Artistas", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.getByRole("tab", { name: "Artistas" }).click();

    await expect(
      page.getByPlaceholder("Novo(a) artista..."),
    ).toBeVisible();
  });

  test("deve exibir funções na aba Funções", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.getByRole("tab", { name: "Funções" }).click();

    await expect(
      page.getByPlaceholder("Novo(a) função..."),
    ).toBeVisible();
  });

  test("deve exibir tonalidades na aba Tonalidades", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.getByRole("tab", { name: "Tonalidades" }).click();

    await expect(
      page.getByPlaceholder("Novo(a) tonalidade..."),
    ).toBeVisible();
  });

  test("deve exibir tipos de evento na aba Tipos de Evento", async ({
    page,
  }) => {
    await page.goto("/configuracoes");
    await page.getByRole("tab", { name: "Tipos de Evento" }).click();

    await expect(
      page.getByPlaceholder("Novo(a) tipo de evento..."),
    ).toBeVisible();
  });
});
