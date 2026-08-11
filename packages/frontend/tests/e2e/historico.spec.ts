/**
 * Testes E2E para a página de Histórico (`/historico`).
 *
 * Verifica a adoção do `EventoRow` unificado: título/legenda/contagem
 * exibidos na linha, navegação ao detalhe da escala tanto pelo clique na
 * linha inteira quanto pelo botão "Detalhes" do slot de ações.
 *
 * Os dois eventos usados nos testes são criados via API em `beforeAll`
 * (`criarEventosHistorico`, `./helpers/eventos-fixture.ts`) e removidos em
 * `afterAll` — o spec não depende de dados fixos do banco de dev, então
 * roda igual num banco limpo.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import {
  criarEventosHistorico,
  type EventosHistoricoFixture,
} from "./helpers/eventos-fixture";

test.describe("Histórico", () => {
  let fixture: EventosHistoricoFixture;

  /** Cria os dois eventos de teste via API antes de toda a suíte. */
  test.beforeAll(async () => {
    fixture = await criarEventosHistorico();
  });

  /** Remove os eventos de teste criados via API ao final da suíte. */
  test.afterAll(async () => {
    await fixture.limpar();
  });

  /** Autentica e abre `/historico` antes de cada caso — rota protegida. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/historico");
    /**
     * `exact: true`: sem isso, a busca por substring bate também no `<h3>`
     * de qualquer linha de evento cuja descrição contenha "histórico" (ex.:
     * dado ad-hoc do banco de dev "Culto realizado para teste de
     * histórico") — agora que `EventoRow` expõe o título como heading, a
     * página tem mais de um heading candidato para uma busca não-exata.
     */
    await expect(
      page.getByRole("heading", { name: "Histórico", exact: true }),
    ).toBeVisible();
  });

  /** A linha do evento exibe título (descrição), legenda por extenso e contagem pluralizada. */
  test("lista eventos passados com titulo, legenda e contagem", async ({ page }) => {
    const linha = page
      .locator('[role="button"]')
      .filter({ hasText: fixture.recente.descricao });
    await expect(linha).toBeVisible({ timeout: 10_000 });

    /** Título também é um heading (`<h3>`) — navegável por leitor de tela. */
    await expect(
      linha.getByRole("heading", { name: fixture.recente.descricao }),
    ).toBeVisible();

    /** Legenda usa a data por extenso em PT-BR (`formatDataExtenso`, minúsculo). */
    await expect(linha.getByText(fixture.recente.legenda)).toBeVisible();

    /** Contagem de músicas/integrantes pluralizada inline. */
    await expect(linha.getByText(/música/)).toBeVisible();

    /** A pill de tipo de evento continua visível ao lado do título. */
    await expect(linha.getByText(fixture.tipoNome)).toBeVisible();
  });

  /** Clicar em qualquer ponto da linha (fora das ações) navega ao detalhe da escala. */
  test("navega ao detalhe da escala ao clicar na linha", async ({ page }) => {
    const linha = page
      .locator('[role="button"]')
      .filter({ hasText: fixture.recente.descricao });
    await expect(linha).toBeVisible({ timeout: 10_000 });

    await linha.getByText(fixture.recente.descricao, { exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/escalas/${fixture.recente.id}$`));
  });

  /** O botão "Detalhes" do slot de ações também navega ao detalhe da escala. */
  test("navega ao detalhe da escala ao clicar em Detalhes", async ({ page }) => {
    const linha = page
      .locator('[role="button"]')
      .filter({ hasText: fixture.recente.descricao });
    await expect(linha).toBeVisible({ timeout: 10_000 });

    await linha.getByRole("button", { name: "Detalhes" }).click();

    await expect(page).toHaveURL(new RegExp(`/escalas/${fixture.recente.id}$`));
  });

  /** Eventos passados aparecem em ordem cronológica decrescente (mais recente primeiro). */
  test("ordena eventos por data decrescente", async ({ page }) => {
    const linhas = page.locator('[role="button"]');
    await expect(linhas.first()).toBeVisible({ timeout: 10_000 });

    const textos = await linhas.allTextContents();
    const indiceRecente = textos.findIndex((t) => t.includes(fixture.recente.descricao));
    const indiceAntigo = textos.findIndex((t) => t.includes(fixture.antigo.descricao));

    expect(indiceRecente).toBeGreaterThanOrEqual(0);
    expect(indiceAntigo).toBeGreaterThan(indiceRecente);
  });
});
