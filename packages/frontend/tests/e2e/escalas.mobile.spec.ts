/**
 * Testes E2E mobile (Galaxy S8, 360×740) das Escalas: o seletor de tom por
 * música na escala (`MusicaTomPicker`, F11) e a lista de Escalas com as
 * novidades da F13 — três abas (Próximas/Passadas/Rascunhos), fileira de
 * ações do card com o 4º botão (Duplicar, ícone puro no mobile) e o
 * zero-result da busca com termo longo truncado.
 *
 * Verifica a regra mobile-first do projeto: nada disso pode gerar rolagem
 * horizontal a 360px. A preocupação registrada no plano da F11 é um tenant
 * com muitos tons — o seed padrão semeia 24 (`DEFAULT_TONALIDADES`) —
 * estourando a altura do S8 numa coluna única; o grid de 3 colunas com
 * `max-h-[50vh] overflow-y-auto` existe para isso.
 *
 * Os dados usados nos testes são criados via API em `beforeAll`
 * (`criarEventoComMusica`/`criarEscalaFutura`, `./helpers/eventos-fixture.ts`)
 * e removidos em `afterAll` — o spec não depende de dados fixos do banco de dev.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { expectSemOverflowHorizontal } from "./helpers/viewport";
import {
  criarEventoComMusica,
  criarEscalaFutura,
  type EventoComMusicaFixture,
  type EscalaFuturaFixture,
} from "./helpers/eventos-fixture";

let fixture: EventoComMusicaFixture;

/** Cria a escala e a música de teste via API antes de toda a suíte. */
test.beforeAll(async () => {
  fixture = await criarEventoComMusica();
});

/** Remove a escala e a música de teste criadas via API ao final da suíte. */
test.afterAll(async () => {
  await fixture.limpar();
});

test.describe("Mobile — Tom por música na escala (360×740)", () => {
  /** Autentica e abre diretamente o detalhe da escala de teste antes de cada caso. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/escalas/${fixture.eventoId}`);
    await expect(page.getByText("Detalhes da Escala")).toBeVisible({
      timeout: 10_000,
    });
  });

  /** O detalhe da escala não pode exigir rolagem horizontal a 360px. */
  test("não deve ter overflow horizontal no detalhe da escala", async ({ page }) => {
    await expectSemOverflowHorizontal(page);
  });

  /** O popover de tom abre a 360px, com o grid de tons visível, sem gerar rolagem horizontal. */
  test("abre o popover de tom a 360px sem overflow horizontal", async ({ page }) => {
    const badge = page.getByRole("button", {
      name: new RegExp(`^Tom: ${fixture.tomGlobal.tom}\\.`),
    });
    await expect(badge).toBeVisible({ timeout: 10_000 });
    await badge.click();

    await expect(page.getByText("Selecionar tom")).toBeVisible();
    /** O grid de tons (24 no seed padrão) está presente, incluindo o segundo tom de teste. */
    await expect(page.getByRole("radiogroup")).toBeVisible();
    await expect(
      page.getByRole("radio", { name: fixture.outroTom.tom, exact: true }),
    ).toBeVisible();

    await expectSemOverflowHorizontal(page);
  });

  /** Selecionar um tom pelo popover mobile atualiza o badge, sem gerar overflow horizontal. */
  test("seleciona um tom pelo popover mobile e atualiza o badge sem overflow", async ({
    page,
  }) => {
    const badge = page.getByRole("button", {
      name: new RegExp(`^Tom: ${fixture.tomGlobal.tom}\\.`),
    });
    await badge.click();

    /**
     * Clica no texto visível da tile — o input real do radio é oculto via
     * `sr-only`; o clique no `<label>` que o envolve é repassado ao controle
     * pelo comportamento nativo do HTML (funciona igual com toque no mobile).
     */
    await page.getByText(fixture.outroTom.tom, { exact: true }).click();

    await expect(
      page.getByRole("button", {
        name: new RegExp(`^Tom: ${fixture.outroTom.tom}\\.`),
      }),
    ).toBeVisible();

    await expectSemOverflowHorizontal(page);
  });
});

test.describe("Mobile — Escalas (lista, 360×740)", () => {
  let escalaFixture: EscalaFuturaFixture;

  /** Cria a escala futura de teste via API antes desta suíte. */
  test.beforeAll(async () => {
    escalaFixture = await criarEscalaFutura();
  });

  /** Varre a escala de teste (e eventuais derivadas) ao final da suíte. */
  test.afterAll(async () => {
    await escalaFixture.limpar();
  });

  /** Autentica e abre `/escalas` antes de cada caso — rota protegida. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/escalas");
    await expect(
      page.getByRole("heading", { name: "Escalas", exact: true }),
    ).toBeVisible();
  });

  /** As três abas (Próximas/Passadas/Rascunhos) cabem em 360px sem rolagem horizontal. */
  test("exibe as três abas sem overflow horizontal", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /Próximas/ })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("tab", { name: /Passadas/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Rascunhos/ })).toBeVisible();

    await expectSemOverflowHorizontal(page);
  });

  /** A fileira de ações com o 4º botão (Duplicar, ícone puro no mobile) não estoura 360px. */
  test("fileira de ações do card com Duplicar sem overflow", async ({
    page,
  }) => {
    const card = page
      .locator("div.shadow-soft")
      .filter({
        has: page.getByRole("heading", {
          name: escalaFixture.descricao,
          exact: true,
        }),
      });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await expect(card.getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Excluir" })).toBeVisible();
    await expect(
      card.getByRole("button", {
        name: `Duplicar escala ${escalaFixture.descricao}`,
      }),
    ).toBeVisible();
    await expect(card.getByRole("button", { name: "Detalhes" })).toBeVisible();

    await expectSemOverflowHorizontal(page);
  });

  /** O diálogo "Publicar sem repertório?" empilha as 3 ações a 360px, com saída neutra e sem overflow. */
  test("diálogo de publicar sem repertório empilha 3 ações sem overflow", async ({
    page,
  }) => {
    const descricaoRascunho = `${escalaFixture.descricao} rascunho mobile`;
    await escalaFixture.criarRascunho(descricaoRascunho);
    /** Recarrega: o rascunho foi criado via API depois do fetch do beforeEach. */
    await page.goto("/escalas");

    await page.getByRole("tab", { name: /Rascunhos/ }).click();
    const card = page
      .locator("div.shadow-soft")
      .filter({
        has: page.getByRole("heading", { name: descricaoRascunho, exact: true }),
      });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card
      .getByRole("button", { name: `Publicar rascunho ${descricaoRascunho}` })
      .click();

    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeVisible();
    await expect(
      dialogo.getByRole("button", { name: "Adicionar músicas" }),
    ).toBeVisible();
    await expect(
      dialogo.getByRole("button", { name: "Publicar assim mesmo" }),
    ).toBeVisible();

    await expectSemOverflowHorizontal(page);

    /** "Cancelar" é a saída neutra do touch (sem Esc; Radix ignora tap no backdrop). */
    await dialogo.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(page).toHaveURL(/\/escalas$/);
    await expect(card).toBeVisible();
  });

  /** Termo de busca longo sem espaços aparece truncado no zero-result, sem overflow. */
  test("zero-result com termo longo truncado sem overflow", async ({
    page,
  }) => {
    /** 85 caracteres sem espaço — sem truncagem, estouraria os 360px. */
    const termoLongo = "escalainexistente".repeat(5);
    await page
      .getByRole("textbox", { name: /Buscar escalas/ })
      .fill(termoLongo);

    await expect(page.getByText("Nenhuma escala encontrada")).toBeVisible();
    /** O termo exibido é cortado em 40 caracteres com reticências. */
    await expect(
      page.getByText(`"${termoLongo.slice(0, 40)}…"`),
    ).toBeVisible();

    await expectSemOverflowHorizontal(page);
  });
});
