/**
 * Testes E2E mobile (Galaxy S8, 360×740) da página de Histórico.
 *
 * Verifica a regra mobile-first do projeto sobre a anatomia unificada do
 * `EventoRow`: o `flex-wrap` do container joga as ações para a própria
 * linha em telas estreitas, sem gerar rolagem horizontal.
 *
 * O evento usado nos testes é criado via API em `beforeAll`
 * (`criarEventosHistorico`, `./helpers/eventos-fixture.ts`) e removido em
 * `afterAll` — o spec não depende de dados fixos do banco de dev.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { expectSemOverflowHorizontal } from "./helpers/viewport";
import {
  criarEventosHistorico,
  type EventosHistoricoFixture,
} from "./helpers/eventos-fixture";

test.describe("Mobile — Histórico (360×740)", () => {
  let fixture: EventosHistoricoFixture;

  /** Cria os dois eventos de teste via API antes de toda a suíte. */
  test.beforeAll(async () => {
    fixture = await criarEventosHistorico();
  });

  /** Remove os eventos de teste criados via API ao final da suíte. */
  test.afterAll(async () => {
    await fixture.limpar();
  });

  /** Autentica e abre `/historico` antes de cada caso. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/historico");
    /**
     * `exact: true`: sem isso, a busca por substring bate também no `<h3>`
     * de qualquer linha de evento cuja descrição contenha "histórico" —
     * agora que `EventoRow` expõe o título como heading, a página tem mais
     * de um heading candidato para uma busca não-exata.
     */
    await expect(
      page.getByRole("heading", { name: "Histórico", exact: true }),
    ).toBeVisible();
  });

  /** A listagem de eventos não pode exigir rolagem horizontal a 360px. */
  test("nao deve ter overflow horizontal na listagem", async ({ page }) => {
    await expect(page.getByText(fixture.recente.descricao)).toBeVisible({
      timeout: 10_000,
    });

    await expectSemOverflowHorizontal(page);
  });

  /** O botão "Detalhes" do slot de ações continua acessível e tocável a 360px. */
  test("exibe a linha do evento com o botao Detalhes acessivel", async ({ page }) => {
    const linha = page
      .locator('[role="button"]')
      .filter({ hasText: fixture.recente.descricao });
    await expect(linha).toBeVisible({ timeout: 10_000 });

    await expect(linha.getByRole("button", { name: "Detalhes" })).toBeVisible();
  });

  /** Tocar na linha (fora das ações) navega ao detalhe da escala, mesmo no mobile. */
  test("navega ao detalhe ao tocar na linha", async ({ page }) => {
    const linha = page
      .locator('[role="button"]')
      .filter({ hasText: fixture.recente.descricao });
    await expect(linha).toBeVisible({ timeout: 10_000 });

    await linha.getByText(fixture.recente.descricao, { exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/escalas/${fixture.recente.id}$`));
  });
});
