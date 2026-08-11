/**
 * Testes E2E para o módulo de Escalas/Eventos.
 *
 * Verifica listagem, edição, exclusão com confirmação, duplicação de escala
 * (F13), fluxo de rascunho (criar via "Salvar rascunho" → aba Rascunhos →
 * publicar com confirmação sem repertório) e o zero-result da busca.
 *
 * A escala usada nos testes é criada via API em `beforeAll`
 * (`criarEscalaFutura`, `./helpers/eventos-fixture.ts`); cópias e rascunhos
 * criados pela UI compartilham o prefixo único da descrição e são varridos
 * em `afterAll` — o spec não depende de dados fixos do banco de dev.
 */

import { test, expect, type Page, type Locator } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import {
  criarEscalaFutura,
  type EscalaFuturaFixture,
} from "./helpers/eventos-fixture";

/**
 * Localiza o card de escala pela descrição exibida no heading da linha.
 *
 * @param page - Instância da página do Playwright.
 * @param descricao - Descrição única da escala (título da linha).
 * @returns Locator do card que contém o heading com a descrição.
 */
function cardDaEscala(page: Page, descricao: string): Locator {
  /**
   * `exact: true`: o nome no `getByRole` casa por substring por padrão, e a
   * descrição base é PREFIXO das derivadas criadas pela UI ("… copia",
   * "… rascunho") — sem o exact, o locator violaria o strict mode.
   */
  return page
    .locator("div.shadow-soft")
    .filter({ has: page.getByRole("heading", { name: descricao, exact: true }) });
}

/**
 * Preenche o DateTimePicker com o dia 15 do próximo mês (horário padrão
 * 09:00) — sempre uma data futura, e o dia 15 nunca aparece duplicado como
 * "outside day" na grade do calendário (apenas os dias 23–31 do mês anterior
 * e 1–6 do mês seguinte aparecem fora do mês corrente).
 *
 * @param page - Instância da página do Playwright.
 */
async function preencherDataFutura(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Selecione a data e hora" }).click();
  await page.getByRole("button", { name: "Go to next month" }).click();
  await page.getByRole("gridcell", { name: "15", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
}

test.describe("Escalas", () => {
  let fixture: EscalaFuturaFixture;

  /** Cria a escala futura de teste via API antes de toda a suíte. */
  test.beforeAll(async () => {
    fixture = await criarEscalaFutura();
  });

  /** Varre a escala de teste e as derivadas criadas pela UI (cópias/rascunhos). */
  test.afterAll(async () => {
    await fixture.limpar();
  });

  /** Autentica e abre `/escalas` antes de cada caso — rota protegida. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/escalas");
    await expect(
      page.getByRole("heading", { name: "Escalas", exact: true }),
    ).toBeVisible();
  });

  /** A escala de teste aparece na aba Próximas com as quatro ações do card. */
  test("lista a escala na aba Próximas com as ações do card", async ({
    page,
  }) => {
    const card = cardDaEscala(page, fixture.descricao);
    await expect(card).toBeVisible({ timeout: 10_000 });

    await expect(card.getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Excluir" })).toBeVisible();
    await expect(
      card.getByRole("button", {
        name: `Duplicar escala ${fixture.descricao}`,
      }),
    ).toBeVisible();
    await expect(card.getByRole("button", { name: "Detalhes" })).toBeVisible();
  });

  /** Excluir passa pelo diálogo de confirmação (e Cancelar não exclui). */
  test("deve exibir diálogo de confirmação antes de excluir", async ({
    page,
  }) => {
    const card = cardDaEscala(page, fixture.descricao);
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.getByRole("button", { name: "Excluir" }).click();

    await expect(
      page.getByText("Os vínculos com músicas e integrantes"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(card).toBeVisible();
  });

  /** Editar abre o formulário pré-preenchido com os dados da escala. */
  test("deve abrir formulário de edição ao clicar Editar", async ({
    page,
  }) => {
    const card = cardDaEscala(page, fixture.descricao);
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.getByRole("button", { name: "Editar" }).click();

    await expect(
      page.getByRole("heading", { name: "Editar Escala" }),
    ).toBeVisible();
    await expect(page.getByLabel("Descrição (opcional)")).toHaveValue(
      fixture.descricao,
    );

    /** Formulário limpo (nada digitado): Cancelar fecha direto, sem veil. */
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("heading", { name: "Editar Escala" }),
    ).toBeHidden();
  });

  /** Duplicar abre o dialog pré-preenchido (data vazia) e a cópia aparece na lista. */
  test("duplica a escala pelo dialog pré-preenchido", async ({ page }) => {
    const card = cardDaEscala(page, fixture.descricao);
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card
      .getByRole("button", { name: `Duplicar escala ${fixture.descricao}` })
      .click();

    await expect(
      page.getByRole("heading", { name: "Duplicar Escala" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Revise a data. O repertório e a equipe da escala original serão copiados.",
      ),
    ).toBeVisible();

    /** Tipo e descrição herdados da origem; a data começa VAZIA (placeholder). */
    await expect(
      page.getByRole("combobox", { name: /Tipo de Evento/ }),
    ).toContainText(fixture.tipoNome);
    const descricaoInput = page.getByLabel("Descrição (opcional)");
    await expect(descricaoInput).toHaveValue(fixture.descricao);
    await expect(
      page.getByRole("button", { name: "Selecione a data e hora" }),
    ).toBeVisible();

    const descricaoCopia = `${fixture.descricao} copia`;
    await descricaoInput.fill(descricaoCopia);
    await preencherDataFutura(page);
    await page.getByRole("button", { name: "Criar cópia" }).click();

    /** O dialog fecha sem navegar e a cópia aparece na própria lista. */
    await expect(
      page.getByRole("heading", { name: "Duplicar Escala" }),
    ).toBeHidden();
    await expect(
      page.getByRole("heading", { name: descricaoCopia }),
    ).toBeVisible({ timeout: 10_000 });
  });

  /** Rascunho: criado via "Salvar rascunho", vive só na aba Rascunhos e publica com confirmação. */
  test("cria rascunho, exibe só na aba Rascunhos e publica com confirmação", async ({
    page,
  }) => {
    const descricaoRascunho = `${fixture.descricao} rascunho`;

    /** `.first()`: com a lista vazia o EmptyState renderia um segundo botão. */
    await page.getByRole("button", { name: "Nova Escala" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Nova Escala" }),
    ).toBeVisible();

    await preencherDataFutura(page);
    /**
     * Nome acessível explícito: os selects de Hora/Minuto do DateTimePicker
     * também expõem `role="combobox"` — sem o nome, o locator viola o
     * strict mode.
     */
    await page.getByRole("combobox", { name: /Tipo de Evento/ }).click();
    await page.getByRole("option", { name: fixture.tipoNome }).click();
    await page.getByLabel("Descrição (opcional)").fill(descricaoRascunho);
    await page.getByRole("button", { name: "Salvar rascunho" }).click();

    /** O dialog fecha sem navegar para o detalhe (rascunho é "guardar para depois"). */
    await expect(
      page.getByRole("heading", { name: "Nova Escala" }),
    ).toBeHidden();
    await expect(page).toHaveURL(/\/escalas$/);

    /** Não aparece na aba Próximas (ativa por padrão), apesar da data futura. */
    await expect(
      page.getByRole("heading", { name: descricaoRascunho }),
    ).toBeHidden();

    /** Aparece na aba Rascunhos, com o badge "Rascunho". */
    await page.getByRole("tab", { name: /Rascunhos/ }).click();
    const cardRascunho = cardDaEscala(page, descricaoRascunho);
    await expect(cardRascunho).toBeVisible({ timeout: 10_000 });
    await expect(
      cardRascunho.getByText("Rascunho", { exact: true }),
    ).toBeVisible();

    /** Publicar com ZERO músicas exige a confirmação "Publicar sem repertório?". */
    await cardRascunho
      .getByRole("button", { name: `Publicar rascunho ${descricaoRascunho}` })
      .click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toBeVisible();
    await expect(page.getByText("Publicar sem repertório?")).toBeVisible();

    /** As 3 ações: saída neutra, ir montar o repertório e publicar mesmo assim. */
    await expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeVisible();
    await expect(
      dialogo.getByRole("button", { name: "Adicionar músicas" }),
    ).toBeVisible();

    /** "Cancelar" é neutro: fecha sem publicar nem navegar — o rascunho permanece. */
    await dialogo.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(page).toHaveURL(/\/escalas$/);
    await expect(cardRascunho).toBeVisible();

    await cardRascunho
      .getByRole("button", { name: `Publicar rascunho ${descricaoRascunho}` })
      .click();
    await page.getByRole("button", { name: "Publicar assim mesmo" }).click();

    /** Publicada: sai de Rascunhos e passa a aparecer em Próximas. */
    await expect(cardRascunho).toBeHidden({ timeout: 10_000 });
    await page.getByRole("tab", { name: /Próximas/ }).click();
    await expect(
      page.getByRole("heading", { name: descricaoRascunho }),
    ).toBeVisible({ timeout: 10_000 });
  });

  /** Busca sem resultado mostra o EmptyState específico com a ação "Limpar busca". */
  test("exibe zero-result da busca com ação de limpar", async ({ page }) => {
    await expect(cardDaEscala(page, fixture.descricao)).toBeVisible({
      timeout: 10_000,
    });

    const busca = page.getByRole("textbox", { name: /Buscar escalas/ });
    await busca.fill("zzz-termo-sem-resultado");

    await expect(page.getByText("Nenhuma escala encontrada")).toBeVisible();
    await expect(
      page.getByText('Nenhum resultado para "zzz-termo-sem-resultado"'),
    ).toBeVisible();

    await page.getByRole("button", { name: "Limpar busca" }).click();

    await expect(busca).toHaveValue("");
    await expect(
      page.getByRole("heading", { name: fixture.descricao, exact: true }),
    ).toBeVisible();
  });
});
