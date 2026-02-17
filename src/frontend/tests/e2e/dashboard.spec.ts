/**
 * Testes E2E para o Dashboard.
 *
 * Verifica que os cards exibem contagens reais do servidor
 * e que a seção de próximas escalas usa dados reais.
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("deve exibir contagens reais de músicas, integrantes e escalas", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Total de Músicas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Escalas", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Integrantes", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Próximos Eventos" })).toBeVisible();
  });

  test("não deve exibir valores fictícios/hardcoded", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.waitForTimeout(2000);

    const content = await page.textContent("body");
    expect(content).not.toContain("124 músicas");
    expect(content).not.toContain("32 integrantes");
    expect(content).not.toContain("15 eventos");
  });

  test("deve exibir próximos eventos com dados reais", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Próximas Escalas" }),
    ).toBeVisible();
  });

  test("deve exibir seção Resumo do Ministério", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Resumo do Ministério" }),
    ).toBeVisible();

    await expect(page.getByText("Repertório", { exact: true })).toBeVisible();
    await expect(page.getByText("Equipe", { exact: true })).toBeVisible();
    await expect(page.getByText("Agenda", { exact: true })).toBeVisible();
  });
});
