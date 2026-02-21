/**
 * Testes E2E para o módulo de Integrantes.
 *
 * Verifica gestão de funções, exibição de badges e busca com filtragem.
 */

import { test, expect } from "@playwright/test";

test.describe("Integrantes", () => {
  test("deve exibir lista de integrantes", async ({ page }) => {
    await page.goto("/integrantes");
    await expect(
      page.getByRole("heading", { name: "Integrantes" }),
    ).toBeVisible();

    const editButton = page.getByRole("button", { name: "Editar" }).first();
    await expect(editButton).toBeVisible({ timeout: 10_000 });
  });

  test("deve abrir formulário de edição com seção de funções", async ({
    page,
  }) => {
    await page.goto("/integrantes");
    await page.getByRole("button", { name: "Editar" }).first().click();

    await expect(
      page.getByRole("heading", { name: "Editar Integrante" }),
    ).toBeVisible();

    await expect(page.getByText("Funções")).toBeVisible();
  });

  test("deve filtrar integrantes pelo campo de busca", async ({ page }) => {
    await page.goto("/integrantes");
    await expect(page.getByRole("button", { name: "Editar" }).first()).toBeVisible({
      timeout: 10_000,
    });

    const searchInput = page.getByPlaceholder(
      "Buscar integrantes por nome...",
    );
    await searchInput.fill("Jorge");
    await page.waitForTimeout(500);

    await expect(page.getByText("Jorge Ferrari")).toBeVisible();
  });

  test("deve exibir estado vazio quando busca não encontra resultados", async ({
    page,
  }) => {
    await page.goto("/integrantes");
    const searchInput = page.getByPlaceholder(
      "Buscar integrantes por nome...",
    );

    await searchInput.fill("nomequenoexiste999");
    await page.waitForTimeout(500);

    await expect(
      page.getByText("Nenhum resultado encontrado"),
    ).toBeVisible();
  });
});
