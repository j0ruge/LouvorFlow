/**
 * Testes E2E mobile (Galaxy S8, 360×740) dos formulários admin migrados para
 * `ResponsiveFormDialog` na fase de campos obrigatórios.
 *
 * Verifica o que a suíte desktop não consegue ver: a 360px o formulário abre
 * como Drawer (bottom-sheet do vaul, folha ancorada no fundo da viewport) em
 * vez do Dialog centralizado, a legenda "* campo obrigatório" e as mensagens
 * de validação cabem na tela e nada gera rolagem horizontal — inclusive com
 * os erros de validação visíveis.
 *
 * Os submits são sempre inválidos (validação Zod bloqueia antes da API) e a
 * seleção no Select não é confirmada — nada persiste via UI. A suíte do
 * Select-no-Drawer cria uma igreja própria via `helpers/igreja-fixture.ts`
 * (nome único por execução) e a desfaz no `afterEach`.
 */

import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { expectSemOverflowHorizontal } from "./helpers/viewport";
import {
  criarIgrejaParaVinculo,
  type IgrejaVinculoFixture,
} from "./helpers/igreja-fixture";

/**
 * Verifica que o overlay aberto é o bottom-sheet do vaul: aguarda a animação
 * de entrada estabilizar e então exige a folha (`role="dialog"`) ancorada no
 * fundo da viewport (tolerância de 2px). O Dialog centralizado de desktop
 * flutua no meio da tela e falharia esta checagem.
 *
 * @param page - Instância da página do Playwright.
 */
async function expectFolhaAncoradaNoFundo(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("viewport indisponível");

  const folha = page.getByRole("dialog");
  await expect
    .poll(
      async () => {
        const box = await folha.boundingBox();
        if (!box) return Number.NaN;
        return Math.abs(box.y + box.height - viewport.height);
      },
      { message: "folha não ancorou no fundo da viewport (não é bottom-sheet?)" },
    )
    .toBeLessThanOrEqual(2);
}

test.describe("Mobile — Formulários admin (360×740)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /**
   * O formulário de usuário abre como bottom-sheet, exibe a legenda e as três
   * mensagens de validação sem overflow horizontal.
   */
  test("Usuários: bottom-sheet com validação de vazio sem overflow", async ({
    page,
  }) => {
    await page.goto("/admin/usuarios");
    await page.getByRole("button", { name: "Novo Usuário" }).click();

    await expect(
      page.getByRole("heading", { name: "Criar Novo Usuário" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);
    await expect(page.getByText("* campo obrigatório")).toBeVisible();
    await expectSemOverflowHorizontal(page);

    await page.getByRole("button", { name: "Criar" }).click();

    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Email é obrigatório")).toBeVisible();
    await expect(
      page.getByText("Senha deve ter no mínimo 6 caracteres"),
    ).toBeVisible();
    await expectSemOverflowHorizontal(page);
  });

  /** Os formulários de papel e permissão também abrem como bottom-sheet, sem overflow. */
  test("Papéis e Permissões: bottom-sheet com validação de vazio sem overflow", async ({
    page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("button", { name: "Novo Papel" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar Novo Papel" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);
    await page.getByRole("button", { name: "Criar" }).click();
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Descrição é obrigatória")).toBeVisible();
    await expectSemOverflowHorizontal(page);

    /** Fecha limpo (nada digitado) e repete a checagem em Permissões. */
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goto("/admin/permissoes");
    await page.getByRole("button", { name: "Nova Permissão" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar Nova Permissão" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);
    await page.getByRole("button", { name: "Criar" }).click();
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expectSemOverflowHorizontal(page);
  });

  /**
   * O formulário de criação de igreja abre como bottom-sheet, valida o nome
   * vazio e a guarda intercepta o fechamento com dados digitados.
   */
  test("Igrejas: bottom-sheet com validação e guarda de alterações", async ({
    page,
  }) => {
    await page.goto("/admin/igrejas");
    await page.getByRole("button", { name: "Nova Igreja" }).click();
    await expect(
      page.getByRole("heading", { name: "Nova Igreja" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);

    await page.getByRole("button", { name: "Criar" }).click();
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expectSemOverflowHorizontal(page);

    /** Com nome digitado, Cancelar exibe o veil em vez de fechar. */
    await page.getByRole("textbox", { name: "Nome" }).fill("Igreja Abandonada");
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expectSemOverflowHorizontal(page);

    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  /**
   * O formulário de EDIÇÃO de igreja (segundo dialog da tela) também abre
   * como bottom-sheet a 360px, pré-preenchido e sem overflow.
   */
  test("Igrejas: edição abre como bottom-sheet pré-preenchida sem overflow", async ({
    page,
  }) => {
    await page.goto("/admin/igrejas");
    await page.getByRole("button", { name: "Editar" }).first().click();

    await expect(
      page.getByRole("heading", { name: "Editar Igreja" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);
    await expect(page.getByText("* campo obrigatório")).toBeVisible();

    /** Modo edição: o nome da igreja vem pré-preenchido. */
    await expect(
      page.getByRole("textbox", { name: "Nome" }),
    ).not.toHaveValue("");
    await expectSemOverflowHorizontal(page);
  });

  /** O dialog de vínculo de usuário abre como bottom-sheet, sem overflow. */
  test("IgrejaUsers: bottom-sheet de vínculo sem overflow", async ({ page }) => {
    await page.goto("/admin/igrejas");
    await page.getByRole("link", { name: "Membros" }).first().click();
    await page.waitForURL(/\/admin\/igrejas\/[^/]+\/usuarios$/, {
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Vincular Usuário" }).click();
    await expect(
      page.getByRole("heading", { name: "Vincular Usuário" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);
    await expect(page.getByText("* campo obrigatório")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Vincular", exact: true }),
    ).toBeDisabled();
    await expectSemOverflowHorizontal(page);
  });
});

test.describe("Mobile — IgrejaUsers: Select dentro do Drawer (360×740)", () => {
  /** Igreja vazia criada via API para o teste corrente, desfeita no `afterEach`. */
  let fixture: IgrejaVinculoFixture;

  /** Cria a igreja de teste via API e autentica na UI. */
  test.beforeEach(async ({ page }) => {
    fixture = await criarIgrejaParaVinculo();
    await loginAsAdmin(page);
  });

  /** Desfaz o que o teste criou: vínculos feitos via UI + a própria igreja. */
  test.afterEach(async () => {
    await fixture.limpar();
  });

  /**
   * Zona clássica de conflito popper/portal: o Radix Select abre DENTRO do
   * Drawer (vaul) a 360px. Verifica que as opções aparecem, a seleção pega,
   * o botão de submit habilita e nada transborda — com o popper aberto e
   * depois de fechado.
   */
  test("seleciona usuário no Radix Select dentro do bottom-sheet", async ({
    page,
  }) => {
    await page.goto(`/admin/igrejas/${fixture.id}/usuarios`);
    await page.getByRole("button", { name: "Vincular Usuário" }).click();

    await expect(
      page.getByRole("heading", { name: "Vincular Usuário" }),
    ).toBeVisible();
    await expectFolhaAncoradaNoFundo(page);

    const vincular = page.getByRole("button", { name: "Vincular", exact: true });
    await expect(vincular).toBeDisabled();

    await page.getByRole("combobox", { name: /selecionar usuário/i }).click();
    const primeiraOpcao = page.getByRole("option").first();
    await expect(primeiraOpcao).toBeVisible();
    await expectSemOverflowHorizontal(page);

    await primeiraOpcao.click();

    /** A seleção pega: o combobox deixa o placeholder e o submit habilita. */
    await expect(
      page.getByRole("combobox", { name: /selecionar usuário/i }),
    ).not.toContainText("Selecione um usuário...");
    await expect(vincular).toBeEnabled();
    await expectSemOverflowHorizontal(page);
  });
});
