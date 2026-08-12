/**
 * Helpers reutilizáveis para autenticação nos testes E2E.
 *
 * Centraliza o fluxo de login para evitar duplicação em specs
 * que necessitam de sessão autenticada.
 */

import { expect, type Page } from "@playwright/test";

/** Igreja usada pelos testes — a semeada por `seeds/admin.ts`. */
const IGREJA_PADRAO = "Igreja Padrão";

/**
 * Realiza login como usuário admin via formulário da página de login.
 *
 * Navega a `/login`, preenche email e senha do admin seed,
 * submete o formulário e aguarda o redirect ao Dashboard.
 *
 * Se o admin estiver vinculado a mais de uma igreja, a API responde
 * `requires_tenant_selection` e o app vai para `/selecionar-igreja` em vez de
 * `/` — acontece quando uma execução interrompida deixa para trás uma igreja de
 * teste com o admin vinculado. Nesse caso escolhemos a igreja padrão e seguimos,
 * para que um resíduo de dados não derrube a suíte inteira.
 *
 * @param page - Instância da página do Playwright.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill("admin@louvorflow.com");
  await page.getByRole("textbox", { name: "Senha" }).fill("Admin@123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL(/\/(selecionar-igreja)?$/, { timeout: 10_000 });

  if (new URL(page.url()).pathname === "/selecionar-igreja") {
    await page.getByRole("button", { name: IGREJA_PADRAO }).click();
    await page.waitForURL("/", { timeout: 10_000 });
  }

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 10_000,
  });
}
