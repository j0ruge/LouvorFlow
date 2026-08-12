/**
 * Testes E2E para a página de detalhe de música.
 *
 * Verifica que os selects de categorias e funções requeridas ficam desabilitados
 * e exibem mensagem informativa quando todos os itens já foram adicionados
 * ou quando não existem itens cadastrados no sistema.
 *
 * **Consertos pré-existentes**: (1) os botões de adicionar eram localizados por
 * `div.flex.items-center.gap-2` filtrado pelo combobox — o container casa também
 * com a linha vizinha, e o `.last()` acabava clicando no botão da OUTRA seção,
 * desabilitado, até estourar o timeout (mesmo defeito já corrigido em
 * `escala-detalhe.spec.ts`); agora usam o `aria-label` de cada botão. (2) A
 * suíte operava sobre a primeira música da listagem — dependia da ordenação e
 * deixava a música alheia com TODAS as categorias e funções do tenant; agora
 * cria a própria música via API (`criarMusicaDeTeste`) e a remove no fim.
 */

import { test, expect } from "./fixtures";
import {
  criarMusicaDeTeste,
  type MusicaDeTesteFixture,
} from "./helpers/musicas-fixture";

/** Teto de iterações do laço que esgota as opções — trava de segurança. */
const MAX_ITERACOES = 50;

/** Testes de select desabilitado quando não há itens disponíveis na página de detalhe de música. */
test.describe("Música Detalhe — Select desabilitado sem itens disponíveis", () => {
  let fixture: MusicaDeTesteFixture;

  /** Cria a música de teste via API antes de toda a suíte. */
  test.beforeAll(async () => {
    fixture = await criarMusicaDeTeste();
  });

  /** Remove a música de teste (e, em cascata, seus vínculos) ao final da suíte. */
  test.afterAll(async () => {
    await fixture.limpar();
  });

  /** Abre o detalhe da música de teste antes de cada caso. */
  test.beforeEach(async ({ page }) => {
    await page.goto(`/musicas/${fixture.id}`);
    await expect(
      page.getByRole("heading", { name: "Detalhes da Música" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  /** Verifica que o select de categorias fica desabilitado ao esgotar as opções. */
  test("deve desabilitar select de categorias quando não há opções disponíveis", async ({
    page,
  }) => {
    /**
     * Quando NÃO estamos editando o nome, os comboboxes visíveis são:
     * - índice 0: categorias
     * - índice 1: funções requeridas
     */
    const categoriaSelect = page.getByRole("combobox").nth(0);
    const addCategoriaBtn = page.getByRole("button", {
      name: "Adicionar categoria selecionada",
    });

    for (let i = 0; i < MAX_ITERACOES; i++) {
      if (await categoriaSelect.isDisabled()) break;

      await categoriaSelect.click();

      const options = page.getByRole("option");
      if ((await options.count()) === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addCategoriaBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(categoriaSelect).toBeDisabled();
    await expect(categoriaSelect).toContainText(
      /Nenhuma categoria cadastrada no sistema|Todas as categorias já foram adicionadas/,
    );
  });

  /** Verifica que o select de funções requeridas fica desabilitado ao esgotar as opções. */
  test("deve desabilitar select de funções requeridas quando não há opções disponíveis", async ({
    page,
  }) => {
    /** Combobox de funções requeridas é o segundo visível (índice 1). */
    const funcaoSelect = page.getByRole("combobox").nth(1);
    const addFuncaoBtn = page.getByRole("button", {
      name: "Adicionar função selecionada",
    });

    for (let i = 0; i < MAX_ITERACOES; i++) {
      if (await funcaoSelect.isDisabled()) break;

      await funcaoSelect.click();

      const options = page.getByRole("option");
      if ((await options.count()) === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addFuncaoBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(funcaoSelect).toBeDisabled();
    await expect(funcaoSelect).toContainText(
      /Nenhuma função cadastrada no sistema|Todas as funções já foram adicionadas/,
    );
  });
});
