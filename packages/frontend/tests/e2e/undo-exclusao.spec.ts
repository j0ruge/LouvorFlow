/**
 * Testes E2E do undo de exclusão client-side (fase F9, decisão D2) na
 * página de Escalas.
 *
 * O DELETE real é adiado ~5s enquanto o toast com "Desfazer" está visível:
 * - Desfazer dentro da janela restaura o card e o DELETE **nunca** sai — a
 *   prova é recarregar a página e a escala continuar existindo.
 * - Janela expirada dispara o DELETE de verdade — a prova é recarregar e a
 *   escala ter sumido.
 *
 * Auto-suficiente: cria a escala via API (mesmo padrão de
 * `helpers/eventos-fixture.ts`) com descrição única por execução e remove o
 * que sobrar no `afterEach` (tolerante a 404 quando o teste já excluiu).
 */

import { test, expect } from "./fixtures";
import type { APIRequestContext, Page } from "@playwright/test";
import { obterSessaoAdmin } from "./helpers/sessao";

/** Um dia em milissegundos, para posicionar a escala no futuro (aba "Próximas"). */
const UM_DIA_MS = 24 * 60 * 60 * 1000;

test.describe("Undo de exclusão — Escalas", () => {
  let api: APIRequestContext;
  let authHeader: { Authorization: string };
  /** UUID da escala criada para o teste corrente. */
  let eventoId: string;
  /** Descrição única da escala do teste corrente (título do card). */
  let descricao: string;

  /** Toma a sessão de API compartilhada da suíte (um único login por worker). */
  test.beforeAll(async () => {
    ({ api, auth: authHeader } = await obterSessaoAdmin());
  });

  /** Cria uma escala futura via API (aba "Próximas", a default) antes de cada teste. */
  test.beforeEach(async ({ page }) => {
    descricao = `E2E Undo Escala ${Date.now()}`;

    /** Reaproveita o primeiro tipo de evento semeado (ordem não garantida pela API). */
    const tiposResponse = await api.get("/api/tipos-eventos", { headers: authHeader });
    const tipos: Array<{ id: string }> = await tiposResponse.json();

    const response = await api.post("/api/eventos", {
      headers: authHeader,
      data: {
        data: new Date(Date.now() + 7 * UM_DIA_MS).toISOString(),
        fk_tipo_evento: tipos[0].id,
        descricao,
      },
    });
    const body = await response.json();
    eventoId = body.evento.id;

    await page.goto("/escalas");
  });

  /** Remove a escala do teste via API se ela ainda existir (404 é aceitável). */
  test.afterEach(async () => {
    await api.delete(`/api/eventos/${eventoId}`, { headers: authHeader });
  });

  /**
   * Localiza o card da escala do teste corrente pelo texto da descrição.
   *
   * @param page - Página do Playwright.
   * @returns Locator do card raiz (Card com `shadow-soft`).
   */
  function cardDaEscala(page: Page) {
    return page.locator("div.shadow-soft").filter({ hasText: descricao });
  }

  /** "Desfazer" restaura o card e, após recarregar, a escala ainda existe — o DELETE nunca saiu. */
  test("desfazer restaura o card e a escala sobrevive ao reload", async ({ page }) => {
    const card = cardDaEscala(page);
    await expect(card).toBeVisible({ timeout: 10_000 });

    /** Conta requisições DELETE da escala do teste — nenhuma pode sair neste fluxo. */
    let deletesDisparados = 0;
    page.on("request", (request) => {
      if (
        request.method() === "DELETE" &&
        request.url().includes(`/api/eventos/${eventoId}`)
      ) {
        deletesDisparados += 1;
      }
    });

    await card.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Sim, excluir" }).click();

    /** O card some na hora (filtro de pendentes), com o toast de desfazer visível. */
    await expect(card).toBeHidden();
    await expect(page.getByText("Escala excluída.")).toBeVisible();

    await page.getByRole("button", { name: "Desfazer" }).click();

    /** O item reaparece na posição original — esse é o feedback do desfazer. */
    await expect(card).toBeVisible();
    expect(deletesDisparados).toBe(0);

    /** Prova definitiva: recarregar e a escala continuar lá (o DELETE não saiu). */
    const eventosRecarregados = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/eventos"),
    );
    await page.reload();
    await eventosRecarregados;
    await expect(cardDaEscala(page)).toBeVisible({ timeout: 10_000 });
    expect(deletesDisparados).toBe(0);
  });

  /** Janela expirada dispara o DELETE real e, após recarregar, a escala sumiu. */
  test("janela expirada dispara o DELETE e a escala some apos reload", async ({ page }) => {
    const card = cardDaEscala(page);
    await expect(card).toBeVisible({ timeout: 10_000 });

    /** Registra a espera pelo DELETE real ANTES de confirmar (ele só sai ~5s depois). */
    const deleteDisparado = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes(`/api/eventos/${eventoId}`),
      { timeout: 15_000 },
    );

    await card.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Sim, excluir" }).click();

    await expect(card).toBeHidden();

    /** Sem "Desfazer": a janela de ~5s expira e o DELETE real sai com sucesso. */
    const deleteResponse = await deleteDisparado;
    expect(deleteResponse.ok()).toBe(true);

    /** Prova definitiva: recarregar e a escala não existir mais. */
    const eventosRecarregados = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/eventos"),
    );
    await page.reload();
    await eventosRecarregados;
    await expect(page.getByRole("heading", { name: "Escalas" })).toBeVisible();
    await expect(cardDaEscala(page)).toHaveCount(0);
  });
});
