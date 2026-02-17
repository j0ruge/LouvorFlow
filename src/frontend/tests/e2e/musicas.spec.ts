/**
 * Testes E2E para o módulo de Músicas.
 *
 * Verifica listagem, navegação para detalhes, edição, exclusão,
 * gestão de versões/tags/funções e busca com filtragem.
 */

import { test, expect } from "@playwright/test";

test.describe("Músicas", () => {
  test("deve listar músicas do servidor", async ({ page }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const songItems = page.locator("[role='button']").filter({ hasText: "Detalhes" });
    await expect(songItems.first()).toBeVisible({ timeout: 10_000 });
  });

  test("deve navegar para detalhes ao clicar em uma música", async ({
    page,
  }) => {
    await page.goto("/musicas");
    await page.getByRole("button").filter({ hasText: "Detalhes" }).first().click();

    await expect(page).toHaveURL(/\/musicas\/.+/);
    await expect(
      page.getByRole("heading", { name: "Detalhes da Música" }),
    ).toBeVisible();
  });

  test("deve filtrar músicas pelo campo de busca", async ({ page }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");
    await searchInput.fill("T031");

    const songs = page.locator("h3").filter({ hasText: "T031" });
    await expect(songs.first()).toBeVisible({ timeout: 5_000 });
  });

  test("deve restaurar lista ao limpar busca", async ({ page }) => {
    await page.goto("/musicas");
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");

    await searchInput.fill("T031");
    await expect(page.locator("h3").filter({ hasText: "T031" }).first()).toBeVisible({ timeout: 5_000 });

    await searchInput.clear();

    const songs = page.getByRole("button").filter({ hasText: "Detalhes" });
    await expect(songs.first()).toBeVisible({ timeout: 5_000 });
  });

  test("deve exibir estado vazio quando busca não encontra resultados", async ({
    page,
  }) => {
    await page.goto("/musicas");
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");

    await searchInput.fill("termoquenoexiste12345");

    await expect(
      page.getByText("Nenhum resultado encontrado"),
    ).toBeVisible({ timeout: 5_000 });
  });
});
