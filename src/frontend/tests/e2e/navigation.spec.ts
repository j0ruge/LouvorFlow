/**
 * Testes E2E de navegação geral da aplicação.
 *
 * Verifica que todas as rotas do menu lateral funcionam,
 * a alternância de tema, a navegação entre páginas de música,
 * a alternância de abas em configurações e a página 404.
 */

import { test, expect } from "@playwright/test";

test.describe("Navegação", () => {
  test("deve navegar para todas as páginas do menu lateral", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const menuItems = [
      { name: "Músicas", heading: "Músicas" },
      { name: "Escalas", heading: "Escalas" },
      { name: "Integrantes", heading: "Integrantes" },
      { name: "Configurações", heading: "Configurações" },
    ];

    for (const item of menuItems) {
      await page.getByRole("link", { name: item.name }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: item.heading }),
      ).toBeVisible();
    }
  });

  test("deve exibir página 404 para rotas inexistentes", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    await expect(page.getByText(/não encontrada|404/i)).toBeVisible();
  });

  test("deve alternar entre tema claro e escuro", async ({ page }) => {
    await page.goto("/");
    const themeButton = page.getByRole("button", { name: "Alternar tema" });
    await themeButton.click();

    const html = page.locator("html");
    const classBefore = await html.getAttribute("class");
    await themeButton.click();
    const classAfter = await html.getAttribute("class");

    expect(classBefore).not.toBe(classAfter);
  });

  test("deve navegar de /musicas para /musicas/:id ao clicar em uma música", async ({
    page,
  }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const firstSong = page.getByRole("button").filter({ hasText: "Detalhes" }).first();
    await expect(firstSong).toBeVisible({ timeout: 10_000 });

    await firstSong.click();
    await expect(page).toHaveURL(/\/musicas\/.+/);
    await expect(
      page.getByRole("heading", { name: "Detalhes da Música" }),
    ).toBeVisible();
  });

  test("deve voltar de /musicas/:id para /musicas via botão voltar", async ({
    page,
  }) => {
    await page.goto("/musicas");

    const firstSong = page.getByRole("button").filter({ hasText: "Detalhes" }).first();
    await expect(firstSong).toBeVisible({ timeout: 10_000 });

    await firstSong.click();
    await expect(page).toHaveURL(/\/musicas\/.+/);

    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/musicas$/);
  });

  test("deve navegar para /configuracoes e alternar entre abas", async ({
    page,
  }) => {
    await page.goto("/configuracoes");
    await expect(
      page.getByRole("heading", { name: "Configurações" }),
    ).toBeVisible();

    const tabs = ["Artistas", "Categorias", "Funções", "Tonalidades", "Tipos de Evento"];
    for (const tabName of tabs) {
      await page.getByRole("tab", { name: tabName }).click();
      await expect(page.getByRole("tab", { name: tabName })).toHaveAttribute(
        "data-state",
        "active",
      );
    }
  });
});

/**
 * Testes E2E de navegação mobile.
 *
 * Verifica que o menu lateral (Sheet) fecha automaticamente
 * após o usuário clicar em um item de navegação no viewport mobile.
 */
test.describe("Navegação Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("deve fechar o menu ao clicar em um link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await expect(
      page.locator("[data-state='open'][data-sidebar='sidebar']"),
    ).toBeVisible();

    await page.getByRole("link", { name: "Escalas" }).click();
    await expect(
      page.locator("[data-state='open'][data-sidebar='sidebar']"),
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Escalas" }),
    ).toBeVisible();
  });

  test("deve navegar para múltiplas páginas em sequência", async ({ page }) => {
    await page.goto("/");

    const routes = [
      { name: "Músicas", heading: "Músicas" },
      { name: "Integrantes", heading: "Integrantes" },
      { name: "Configurações", heading: "Configurações" },
    ];

    for (const route of routes) {
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await expect(
        page.locator("[data-state='open'][data-sidebar='sidebar']"),
      ).toBeVisible();

      await page.getByRole("link", { name: route.name }).click();
      await expect(
        page.locator("[data-state='open'][data-sidebar='sidebar']"),
      ).not.toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
    }
  });
});
