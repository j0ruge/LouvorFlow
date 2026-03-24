/**
 * Helpers reutilizáveis para autenticação nos testes E2E.
 *
 * Centraliza o fluxo de login para evitar duplicação em specs
 * que necessitam de sessão autenticada.
 */

import type { Page } from "@playwright/test";

/**
 * Realiza login como usuário admin via formulário da página de login.
 *
 * Navega a `/login`, preenche email e senha do admin seed,
 * submete o formulário e aguarda o redirect ao Dashboard.
 *
 * @param page - Instância da página do Playwright.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill("admin@louvorflow.com");
  await page.getByRole("textbox", { name: "Senha" }).fill("Admin@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
}
