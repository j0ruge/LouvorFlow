/**
 * Testes E2E para o módulo de Escalas/Eventos.
 *
 * Verifica listagem, edição e exclusão de escalas com confirmação.
 */

import { test, expect } from "@playwright/test";

test.describe("Escalas", () => {
  test("deve listar escalas do servidor", async ({ page }) => {
    await page.goto("/escalas");
    await expect(page.getByRole("heading", { name: "Escalas" })).toBeVisible();

    const editButton = page.getByRole("button", { name: "Editar" }).first();
    await expect(editButton).toBeVisible({ timeout: 10_000 });
  });

  test("deve exibir diálogo de confirmação antes de excluir", async ({
    page,
  }) => {
    await page.goto("/escalas");
    await expect(page.getByRole("button", { name: "Excluir" }).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Excluir" }).first().click();

    await expect(
      page.getByText("Os vínculos com músicas e integrantes"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancelar" }).click();
  });

  test("deve abrir formulário de edição ao clicar Editar", async ({
    page,
  }) => {
    await page.goto("/escalas");
    await expect(page.getByRole("button", { name: "Editar" }).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Editar" }).first().click();

    await expect(
      page.getByRole("heading", { name: "Editar Escala" }),
    ).toBeVisible();
  });
});
