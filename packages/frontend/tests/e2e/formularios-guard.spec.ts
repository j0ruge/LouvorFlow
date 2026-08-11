/**
 * Testes E2E (desktop) da guarda de alterações não salvas nos formulários
 * em overlay (`useDirtyFormGuard` + `DiscardChangesVeil` via
 * `ResponsiveFormDialog`).
 *
 * Usa o formulário "Nova Escala" (`EventoForm`) como representante: com o
 * formulário sujo, Esc e o botão "Cancelar" exibem o veil "Descartar
 * alterações?" em vez de fechar; "Continuar editando" preserva o que foi
 * digitado; "Descartar" fecha de fato; e com o formulário limpo o
 * fechamento segue direto, sem veil.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Formulários — guarda de alterações não salvas", () => {
  /**
   * Autentica, abre a página de Escalas e o formulário "Nova Escala".
   * `.first()` porque, com a lista vazia, o EmptyState renderiza um segundo
   * botão "Nova Escala" além do botão do header.
   */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/escalas");
    await page.getByRole("button", { name: "Nova Escala" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Nova Escala" }),
    ).toBeVisible();
  });

  /** Sem alterações, Esc fecha o formulário direto, sem exibir o veil. */
  test("fecha direto no Esc quando o formulário está limpo", async ({
    page,
  }) => {
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });

  /**
   * Com alterações, Esc abre o veil e a modal continua montada. Com o veil
   * aberto o formulário fica `inert`/`aria-hidden` (o título sai da árvore
   * de acessibilidade por design), então a asserção de "continua montada" é
   * o próprio `role="dialog"`, que permanece acessível.
   */
  test("Esc com alterações abre o veil e mantém a modal", async ({ page }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.keyboard.press("Escape");

    const veil = page.getByRole("alertdialog");
    await expect(veil).toBeVisible();
    await expect(veil.getByText("Descartar alterações?")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  /** Com alterações, o botão Cancelar do rodapé abre o veil. */
  test("Cancelar com alterações abre o veil", async ({ page }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  /** "Continuar editando" fecha só o veil e preserva o que foi digitado. */
  test("Continuar editando preserva o conteúdo digitado", async ({ page }) => {
    const descricao = page.getByLabel("Descrição (opcional)");
    await descricao.fill("Ensaio geral");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.getByRole("button", { name: "Continuar editando" }).click();

    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(descricao).toHaveValue("Ensaio geral");
  });

  /** Esc sobre o veil equivale a "Continuar editando" — não fecha a modal. */
  test("Esc sobre o veil volta a editar em vez de fechar", async ({ page }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Nova Escala" }),
    ).toBeVisible();
  });

  /** "Descartar" no veil fecha o formulário de fato. */
  test("Descartar fecha o formulário", async ({ page }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.getByRole("button", { name: "Descartar" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });
});
