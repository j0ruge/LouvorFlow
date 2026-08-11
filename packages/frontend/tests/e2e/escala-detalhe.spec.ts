/**
 * Testes E2E para a página de detalhe de escala (`/escalas/:id`).
 *
 * Cobre dois comportamentos independentes da mesma página:
 * - Select de integrantes desabilitado, e select de músicas com mensagem
 *   informativa (ver docstring do teste — os dois combobox têm semânticas
 *   de "esgotado" diferentes, por design), ao esgotar os itens disponíveis
 *   para esta escala ou quando não existem itens cadastrados no sistema.
 * - `MusicaTomPicker` (F11 — tom por evento): abrir o popover de tom pelo
 *   badge, trocar o tom e confirmar que a troca persiste após `page.reload()`.
 *
 * O evento e a música usados nos testes são criados via API em `beforeAll`
 * (`criarEventoComMusica`, `./helpers/eventos-fixture.ts`) e removidos em
 * `afterAll` — o spec não depende de dados fixos do banco de dev nem de qual
 * escala aparece primeiro em `/escalas`.
 *
 * **Consertos pré-existentes**: a versão anterior deste spec (1) não
 * autenticava (`loginAsAdmin` ausente — a rota protegida redirecionava para
 * `/login` e o teste nunca encontrava o conteúdo esperado) e (2) procurava um
 * botão "Ver Detalhes" que não existe no DOM (o rótulo real é "Detalhes"). Em
 * vez de só trocar o texto do botão, o `beforeEach` passou a navegar direto
 * para `/escalas/:id` com o id conhecido da fixture — elimina por completo a
 * dependência de qual escala aparece primeiro na listagem (o clique em
 * "Detalhes" a partir da lista já é coberto por `escalas.spec.ts` e
 * `historico.spec.ts`; repeti-lo aqui só duplicaria cobertura). (3) Os
 * locators `addMusicaBtn`/`addIntegranteBtn` usavam o seletor de classe
 * `div.flex.items-center.gap-2`, que colide com a linha de metadados do card
 * de música (tom + versão) e com a fileira de ações do cabeçalho — com a
 * fixture desta suíte sempre associando 1 música à escala, o índice errado
 * chegava a clicar em "Excluir" e abrir o diálogo de confirmação no meio do
 * loop. Trocado por `getByRole("button", { name: <aria-label> })`. (4) O loop
 * de integrantes não tratava `FuncaoSelectDialog` — quando o integrante do
 * catálogo tem 2+ funções, `handleAddIntegrante` abre esse dialog em vez de
 * adicionar direto, e o loop travava esperando um combobox coberto pelo
 * modal. (5) O teste de músicas assumia que o combobox desabilita ao esgotar
 * as opções — não é assim por design (ver docstring do teste); ajustado para
 * verificar a mensagem informativa, como já fazia o de integrantes.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
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

/** Autentica e abre diretamente o detalhe da escala de teste antes de cada caso. */
test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`/escalas/${fixture.eventoId}`);
  await expect(page.getByText("Detalhes da Escala")).toBeVisible({
    timeout: 10_000,
  });
});

/** Testes de select desabilitado quando não há itens disponíveis na página de detalhe de escala. */
test.describe("Escala Detalhe — Select desabilitado sem itens disponíveis", () => {
  /** Verifica que o select de integrantes fica desabilitado ao esgotar as opções. */
  test("deve desabilitar select de integrantes quando não há opções disponíveis", async ({
    page,
  }) => {
    /** Localiza os dois comboboxes: músicas (índice 0) e integrantes (índice 1). */
    const integranteSelect = page.getByRole("combobox").nth(1);
    /**
     * `aria-label` explícito, não um seletor de classe: `div.flex.items-center.gap-2`
     * (usado na versão anterior deste spec) colide com a linha de metadados do
     * card de música (tom + versão), que também tem essas três classes — com a
     * fixture desta suíte sempre associando 1 música à escala, `.nth(1)` passou
     * a resolver para o card errado e, dependendo do índice, chegava a clicar em
     * "Excluir" no cabeçalho, abrindo o diálogo de confirmação.
     */
    const addIntegranteBtn = page.getByRole("button", {
      name: "Adicionar integrante ao evento",
    });
    /**
     * Integrante com 2+ funções abre `FuncaoSelectDialog` em vez de adicionar
     * direto (`EventoDetail.handleAddIntegrante`) — sem tratar esse desvio, o
     * loop trava esperando um combobox coberto pelo dialog modal aberto.
     * Todas as funções já vêm pré-marcadas, então confirmar direto basta.
     */
    const funcaoDialog = page.getByRole("dialog", { name: "Selecionar Funções" });

    const MAX_ITERATIONS = 50;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const isDisabled = await integranteSelect.isDisabled();
      if (isDisabled) break;

      await integranteSelect.click();

      const options = page.getByRole("option");
      const count = await options.count();

      if (count === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addIntegranteBtn.click();

      if (await funcaoDialog.isVisible().catch(() => false)) {
        await funcaoDialog.getByRole("button", { name: "Confirmar" }).click();
      }

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(integranteSelect).toBeDisabled();
    await expect(integranteSelect).toContainText(
      /Nenhum integrante cadastrado no sistema|Todos os integrantes já foram adicionados/,
    );
  });

  /**
   * Verifica que o select de músicas exibe a mensagem informativa ao esgotar
   * as opções disponíveis para esta escala.
   *
   * Ao contrário do combobox de integrantes (que desabilita de fato via
   * `integrantesDisponiveis.length === 0`), o combobox de músicas só
   * desabilita quando o **catálogo inteiro do tenant** está vazio
   * (`allMusicas.meta.total === 0`) — decisão documentada em
   * `placeholderBuscaMusica` (`EventoDetail.tsx`): com paginação (`limit=100`),
   * a primeira página pode estar cheia e ainda haver músicas em páginas
   * seguintes, alcançáveis pela busca textual; desabilitar com base na lista
   * já carregada bloquearia essa busca. Por isso este teste — diferente do de
   * integrantes acima — não assert `.toBeDisabled()`, só a mensagem.
   */
  test("deve exibir mensagem informativa quando não há mais músicas disponíveis para adicionar", async ({
    page,
  }) => {
    /** Localiza os dois comboboxes: músicas (índice 0) e integrantes (índice 1). */
    const musicaSelect = page.getByRole("combobox").nth(0);
    /** `aria-label` explícito — ver comentário equivalente no teste de integrantes acima. */
    const addMusicaBtn = page.getByRole("button", {
      name: "Adicionar música ao evento",
    });

    const MAX_ITERATIONS = 100;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      await musicaSelect.click();

      const options = page.getByRole("option");
      const count = await options.count();

      if (count === 0) {
        await page.keyboard.press("Escape");
        break;
      }

      await options.first().click();
      await addMusicaBtn.click();

      /** Aguarda a mutação e atualização do React Query. */
      await page.waitForTimeout(500);
    }

    await expect(musicaSelect).toContainText(
      /Nenhuma música cadastrada no sistema|Todas as músicas já foram adicionadas/,
    );
  });
});

/** Testes do seletor de tom por música na escala (`MusicaTomPicker`, F11). */
test.describe("Escala Detalhe — Tom por música (MusicaTomPicker)", () => {
  /**
   * Fluxo completo: o badge exibe o tom global inicial (sem override), abrir
   * o popover pelo badge, trocar para um segundo tom do catálogo atualiza o
   * badge (com o anel âmbar sinalizando o override) e a troca sobrevive a um
   * `page.reload()` — prova que foi persistida no servidor via
   * `PATCH /eventos/:eventoId/musicas/:musicaId/tonalidade`, não é só estado local.
   */
  test("abre o popover ao clicar no badge, troca o tom e mantém a troca após reload", async ({
    page,
  }) => {
    /**
     * Escopado ao card da música da fixture pelo `aria-label` do card
     * inteiro (`Abrir detalhes da música ${nome}`), não pelo tom sozinho: os
     * testes da suíte "Select desabilitado" (acima) associam todo o catálogo
     * de músicas do tenant a esta mesma escala como efeito colateral de
     * esgotar o combobox, então mais de uma música pode compartilhar o tom
     * "C" por coincidência — sem o escopo, o locator por tom vira ambíguo.
     */
    const card = page.getByRole("button", {
      name: `Abrir detalhes da música ${fixture.musicaNome}`,
    });

    const badgeInicial = card.getByRole("button", {
      name: new RegExp(`^Tom: ${fixture.tomGlobal.tom}\\.`),
    });
    await expect(badgeInicial).toBeVisible({ timeout: 10_000 });

    await badgeInicial.click();
    await expect(page.getByText("Selecionar tom")).toBeVisible();

    /**
     * Clica no texto visível da tile, escopado ao `radiogroup` do popover
     * aberto (só um monta por vez): sem esse escopo, `getByText` busca a
     * página inteira e vira ambíguo pela mesma razão do `card` acima — os
     * testes de "Select desabilitado" podem ter associado outra música com o
     * mesmo tom a esta escala. O input real do radio é visualmente oculto
     * via `sr-only` — o clique no `<label>` que o envolve é repassado ao
     * controle pelo comportamento nativo do HTML.
     */
    await page
      .getByRole("radiogroup")
      .getByText(fixture.outroTom.tom, { exact: true })
      .click();

    await expect(page.getByText("Selecionar tom")).toBeHidden();

    const badgeAtualizado = card.getByRole("button", {
      name: new RegExp(`^Tom: ${fixture.outroTom.tom}\\.`),
    });
    await expect(badgeAtualizado).toBeVisible();
    /** Anel âmbar (token `primary`) sinaliza que a escala agora tem um tom próprio. */
    await expect(badgeAtualizado).toHaveClass(/ring-primary/);

    /** `card`/`badgeAtualizado` são locators vivos: reconsultam o DOM atual mesmo após o reload. */
    await page.reload();
    await expect(page.getByText("Detalhes da Escala")).toBeVisible({
      timeout: 10_000,
    });
    await expect(badgeAtualizado).toBeVisible();
  });
});
