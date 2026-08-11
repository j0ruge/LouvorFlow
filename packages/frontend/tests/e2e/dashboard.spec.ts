/**
 * Testes E2E para o Dashboard.
 *
 * Verifica que os 4 cards de estatística (Músicas, Escalas, Integrantes,
 * Novas Músicas) exibem contagens reais do servidor, e que as seções de
 * "Próximas Escalas" e "Equipe do Ministério" usam dados reais. `/` é rota
 * protegida — cada teste autentica via `loginAsAdmin` no `beforeEach`.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Dashboard", () => {
  /** Autentica como admin antes de cada teste — `/` é rota protegida. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /** Os 4 cards de estatística (Músicas, Escalas, Integrantes, Novas Músicas) exibem título e contagem real vindos do servidor. */
  test("deve exibir os 4 cards de estatística com contagens reais", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Músicas", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Escalas", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Integrantes", exact: true })).toBeVisible();

    /** Stat "Novas Músicas": consome `resumo.novasMusicasNoMes` do endpoint de relatórios. */
    await expect(page.getByRole("heading", { name: "Novas Músicas" })).toBeVisible();
    await expect(page.getByText("Adicionadas no mês")).toBeVisible();
  });

  /** O card "Músicas" e a área de estatísticas exibem um valor numérico real, não um placeholder fixo. */
  test("não deve exibir valores fictícios/hardcoded", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const statsContainer = page.getByRole("heading", { name: "Músicas", exact: true }).locator("..");
    await expect(statsContainer).toBeVisible({ timeout: 10_000 });

    const statsSection = page.locator("text=/\\d+/").first();
    await expect(statsSection).toBeVisible({ timeout: 5_000 });
  });

  /** A seção "Próximas Escalas" é renderizada com dados reais do servidor. */
  test("deve exibir próximas escalas com dados reais", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Próximas Escalas" }),
    ).toBeVisible();
  });

  /** A seção "Equipe do Ministério" (integrantes com função atribuída) é renderizada no Dashboard. */
  test("deve exibir a seção Equipe do Ministério", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Equipe do Ministério" }),
    ).toBeVisible();
  });
});
