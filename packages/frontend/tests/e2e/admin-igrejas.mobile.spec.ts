/**
 * Testes E2E de responsividade mobile das páginas de gestão de igrejas.
 *
 * Roda apenas no projeto `mobile` do Playwright (Galaxy S8, 360×740) — o alvo
 * primário do app segundo o CLAUDE.md. Verifica o que a suíte desktop não
 * consegue ver: que a variante de cards é renderizada no lugar da tabela e que
 * a página não gera rolagem horizontal.
 */

import { test, expect } from "./fixtures";
import { expectSemOverflowHorizontal } from "./helpers/viewport";

test.describe("Mobile — Igrejas (360×740)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/igrejas");
    await expect(page.getByRole("heading", { name: "Igrejas" })).toBeVisible();
  });

  /** A tabela de desktop fica oculta e os cards assumem o lugar dela. */
  test("deve exibir cards no lugar da tabela", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Editar" }).first()).toBeVisible({
      timeout: 10_000,
    });

    /** `hidden sm:block` remove a tabela da árvore de acessibilidade a 360px. */
    await expect(page.getByRole("table")).toBeHidden();

    /** O contador de membros do card confirma que os dados vieram junto. */
    await expect(page.getByText(/membro\(s\)/).first()).toBeVisible();
  });

  /** A listagem não pode exigir rolagem horizontal. */
  test("não deve ter overflow horizontal na listagem", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Editar" }).first()).toBeVisible({
      timeout: 10_000,
    });

    await expectSemOverflowHorizontal(page);
  });

  /** A tela de membros de uma igreja também usa cards e não transborda. */
  test("não deve ter overflow horizontal na tela de membros", async ({ page }) => {
    await page.getByRole("link", { name: "Membros" }).first().click();
    await page.waitForURL(/\/admin\/igrejas\/[^/]+\/usuarios$/, { timeout: 10_000 });

    await expect(page.getByRole("button", { name: "Vincular Usuário" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("table")).toBeHidden();

    await expectSemOverflowHorizontal(page);
  });
});
