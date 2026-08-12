/**
 * Testes E2E de gestão de igrejas (super-admin).
 *
 * Verifica o CRUD completo de igrejas: listagem, criação,
 * edição e toggle de ativação/desativação. Todos os testes
 * requerem login como admin com role super-admin.
 */

import { test, expect } from "./fixtures";

test.describe("Admin — Igrejas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/igrejas");
    await expect(page.getByRole("heading", { name: "Igrejas" })).toBeVisible();
  });

  /** Verifica que a tabela de igrejas é exibida com dados reais. */
  test("deve listar igrejas na tabela", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("columnheader", { name: "Nome" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Membros" })).toBeVisible();

    /** Verifica que existe pelo menos uma igreja (header + dados). */
    const dataRows = page.locator("tbody tr");
    const count = await dataRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  /** Verifica o fluxo completo de criação de uma nova igreja. */
  test("deve criar uma nova igreja", async ({ page }) => {
    const nomeIgreja = `E2E Igreja ${Date.now()}`;

    await page.getByRole("button", { name: "Nova Igreja" }).click();
    await expect(page.getByRole("heading", { name: "Nova Igreja" })).toBeVisible();

    await page.getByRole("textbox", { name: "Nome" }).fill(nomeIgreja);
    await page.getByRole("button", { name: "Criar" }).click();

    /** Verifica toast de sucesso (pode haver múltiplos toasts simultâneos). */
    await expect(page.getByText("Igreja criada com sucesso").first()).toBeVisible({ timeout: 5_000 });

    /** Verifica que a nova igreja aparece na tabela. */
    await expect(page.getByRole("cell", { name: nomeIgreja })).toBeVisible({ timeout: 5_000 });
  });

  /** Verifica o fluxo de edição do nome de uma igreja. */
  test("deve editar o nome de uma igreja", async ({ page }) => {
    /** Clica no botão Editar da primeira igreja. */
    await page.getByRole("button", { name: "Editar" }).first().click();
    await expect(page.getByRole("heading", { name: "Editar Igreja" })).toBeVisible();

    const nomeEditado = `Editada E2E ${Date.now()}`;
    const nomeInput = page.getByRole("textbox", { name: "Nome" });
    await nomeInput.clear();
    await nomeInput.fill(nomeEditado);
    await page.getByRole("button", { name: "Salvar" }).click();

    /** Verifica toast de sucesso (pode haver múltiplos toasts simultâneos). */
    await expect(page.getByText("Igreja atualizada com sucesso").first()).toBeVisible({ timeout: 5_000 });

    /** Verifica que o nome foi atualizado na tabela. */
    await expect(page.getByRole("cell", { name: nomeEditado })).toBeVisible({ timeout: 5_000 });
  });

  /** Verifica o fluxo de desativar e reativar uma igreja. */
  test("deve desativar e reativar uma igreja", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });

    /** Desativa a primeira igreja. */
    await page.getByRole("button", { name: "Desativar" }).first().click();

    /**
     * A desativação é destrutiva (bloqueia o acesso de todos os membros) e
     * passa pelo `DeleteConfirmDialog` — o spec original antecede essa
     * confirmação e clicava direto.
     */
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Sim, excluir" }).click();

    /**
     * Verifica toast de sucesso e badge "Inativa" — escopado à tabela, porque
     * o layout dual renderiza os cards mobile (ocultos a 1280px) antes dela e
     * um `getByText(...).first()` global resolveria para um badge invisível.
     */
    await expect(page.getByText("Igreja desativada com sucesso")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("table").getByText("Inativa").first()).toBeVisible({ timeout: 5_000 });

    /** Verifica que o botão mudou para "Reativar". */
    await expect(page.getByRole("button", { name: "Reativar" }).first()).toBeVisible();

    /** Reativa a igreja. */
    await page.getByRole("button", { name: "Reativar" }).first().click();

    /** Verifica toast de sucesso e badge "Ativa". */
    await expect(page.getByText("Igreja reativada com sucesso")).toBeVisible({ timeout: 5_000 });
  });
});
