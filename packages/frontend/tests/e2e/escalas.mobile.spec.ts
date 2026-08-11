/**
 * Testes E2E mobile (Galaxy S8, 360×740) do seletor de tom por música na
 * escala (`MusicaTomPicker`, F11).
 *
 * Verifica a regra mobile-first do projeto: o popover de tom
 * (`PopoverContent w-64 max-w-[calc(100vw-2rem)]`, grid de 3 colunas com
 * itens de 44px) abre sem gerar rolagem horizontal a 360px. A preocupação
 * registrada no plano é um tenant com muitos tons — o seed padrão semeia 24
 * (`DEFAULT_TONALIDADES`) — estourando a altura do S8 numa coluna única; o
 * grid de 3 colunas com `max-h-[50vh] overflow-y-auto` existe para isso.
 *
 * O evento e a música usados nos testes são criados via API em `beforeAll`
 * (`criarEventoComMusica`, `./helpers/eventos-fixture.ts`) e removidos em
 * `afterAll` — o spec não depende de dados fixos do banco de dev.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { expectSemOverflowHorizontal } from "./helpers/viewport";
import {
  criarEventoComMusica,
  type EventoComMusicaFixture,
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
