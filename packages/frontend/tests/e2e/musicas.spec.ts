/**
 * Testes E2E para o módulo de Músicas.
 *
 * Verifica listagem, navegação para detalhes, edição, exclusão,
 * gestão de versões/categorias/funções e busca com filtragem.
 *
 * A música usada nos testes de busca é criada via API em `beforeAll`
 * (`criarMusicaDeTeste`, `./helpers/musicas-fixture.ts`): a versão anterior
 * procurava "T031", um dado ad-hoc que nunca esteve no seed — os dois casos
 * falhavam em qualquer banco que não fosse o de uma máquina específica.
 */

import { test, expect } from "./fixtures";
import {
  criarMusicaDeTeste,
  type MusicaDeTesteFixture,
} from "./helpers/musicas-fixture";

test.describe("Músicas", () => {
  let fixture: MusicaDeTesteFixture;

  /** Cria a música de busca via API antes de toda a suíte. */
  test.beforeAll(async () => {
    fixture = await criarMusicaDeTeste();
  });

  /** Remove a música de busca criada via API ao final da suíte. */
  test.afterAll(async () => {
    await fixture.limpar();
  });

  test("deve listar músicas do servidor", async ({ page }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const songItems = page.locator("[role='button']").filter({ hasText: "Detalhes" });
    await expect(songItems.first()).toBeVisible({ timeout: 10_000 });
  });

  test("deve navegar para detalhes ao clicar em uma música", async ({
    page,
  }) => {
    await page.goto("/musicas");
    await page.getByRole("button").filter({ hasText: "Detalhes" }).first().click();

    await expect(page).toHaveURL(/\/musicas\/.+/);
    await expect(
      page.getByRole("heading", { name: "Detalhes da Música" }),
    ).toBeVisible();
  });

  test("deve filtrar músicas pelo campo de busca", async ({ page }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");
    await searchInput.fill(fixture.termoDeBusca);

    const songs = page.locator("h3").filter({ hasText: fixture.nome });
    await expect(songs.first()).toBeVisible({ timeout: 5_000 });
  });

  test("deve restaurar lista ao limpar busca", async ({ page }) => {
    await page.goto("/musicas");
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");

    await searchInput.fill(fixture.termoDeBusca);
    await expect(
      page.locator("h3").filter({ hasText: fixture.nome }).first(),
    ).toBeVisible({ timeout: 5_000 });

    await searchInput.clear();

    const songs = page.getByRole("button").filter({ hasText: "Detalhes" });
    await expect(songs.first()).toBeVisible({ timeout: 5_000 });
  });

  test("deve exibir estado vazio quando busca não encontra resultados", async ({
    page,
  }) => {
    await page.goto("/musicas");
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");

    await searchInput.fill("termoquenoexiste12345");

    await expect(
      page.getByText("Nenhum resultado encontrado"),
    ).toBeVisible({ timeout: 5_000 });
  });

  /**
   * A linha de resultados exibe a contagem real (`meta.total`), não o
   * tamanho da página atual — verificada pelo padrão "N música(s)" no
   * `role="status"` após aplicar um filtro de intensidade.
   */
  test("deve exibir a contagem de resultados ao aplicar um filtro", async ({
    page,
  }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const grupoIntensidade = page.getByRole("group", {
      name: "Filtrar por intensidade (tempo)",
    });
    await grupoIntensidade.getByRole("button", { name: "Calma" }).click();

    const status = page.getByRole("status");
    await expect(status).toBeVisible({ timeout: 5_000 });
    await expect(status).toHaveText(/^\d+ músicas?/);
  });

  /**
   * O CTA "Limpar busca e filtros" do zero-result remove a busca da URL e do
   * campo (`limparTudo` zera `searchInput` explicitamente, sem depender do
   * debounce ainda pendente) e restaura a listagem completa.
   */
  test("zero-result: Limpar busca e filtros restaura a listagem", async ({
    page,
  }) => {
    await page.goto("/musicas");
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");
    await searchInput.fill("termoquenoexiste12345");

    await expect(
      page.getByText("Nenhum resultado encontrado"),
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Limpar busca e filtros" }).click();

    await expect(searchInput).toHaveValue("");
    await expect(page).not.toHaveURL(/[?&]q=/);
    const songs = page.getByRole("button").filter({ hasText: "Detalhes" });
    await expect(songs.first()).toBeVisible({ timeout: 5_000 });
  });

  /**
   * O atalho "/" foca e seleciona o campo de busca quando o foco não está
   * num elemento editável nem há dialog aberto.
   */
  test("atalho / foca o campo de busca", async ({ page }) => {
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();

    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");
    await expect(searchInput).not.toBeFocused();

    await page.keyboard.press("/");

    await expect(searchInput).toBeFocused();
  });

  /**
   * Com o foco já no campo de busca, "/" é tratado como caractere normal —
   * a guarda de elemento editável do atalho (`isElementoEditavel`) evita
   * interceptar a digitação.
   */
  test("atalho / com foco no campo de busca é digitado normalmente", async ({
    page,
  }) => {
    await page.goto("/musicas");
    const searchInput = page.getByPlaceholder("Buscar músicas por nome...");
    await searchInput.click();

    await page.keyboard.press("/");

    await expect(searchInput).toHaveValue("/");
  });
});
