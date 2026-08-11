/**
 * Testes E2E (desktop) dos formulários admin migrados para
 * `ResponsiveFormDialog` + `ui/form.tsx` na fase de campos obrigatórios:
 * Usuários, Papéis, Permissões, Igrejas (criação + edição) e o dialog de
 * vinculação de usuário em IgrejaUsers (sem react-hook-form).
 *
 * Cobre o contrato que a migração entrega: submeter vazio exibe as mensagens
 * Zod (sem fechar o dialog), o primeiro campo inválido recebe foco e
 * `aria-invalid`, digitar limpa o erro, a legenda "* campo obrigatório"
 * abre com o formulário e a guarda de alterações não salvas intercepta o
 * fechamento com dados digitados.
 *
 * Estratégia de dados: os fluxos de validação NÃO persistem nada (submit
 * inválido não chega à API). A API não expõe DELETE para usuários, papéis e
 * permissões, então este spec deliberadamente não cria essas entidades —
 * dado que não pode ser limpo não deve ser criado por teste. O único fluxo
 * com persistência é o de vínculo em IgrejaUsers, que cria uma igreja
 * própria via API (nome único por execução) e a desfaz no `afterEach`
 * (DELETE do vínculo + DELETE da igreja), padrão de
 * `helpers/eventos-fixture.ts` e `configuracoes-crud.spec.ts`.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import {
  criarIgrejaParaVinculo,
  type IgrejaVinculoFixture,
} from "./helpers/igreja-fixture";

test.describe("Admin — Formulários migrados (campos obrigatórios)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /**
   * Submeter o formulário de usuário vazio exibe as três mensagens Zod,
   * marca o primeiro campo com `aria-invalid` e foco, e digitar limpa o erro.
   */
  test("Usuários: submeter vazio exibe erros, foca o primeiro campo e digitar limpa", async ({
    page,
  }) => {
    await page.goto("/admin/usuarios");
    await page.getByRole("button", { name: "Novo Usuário" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar Novo Usuário" }),
    ).toBeVisible();
    await expect(page.getByText("* campo obrigatório")).toBeVisible();

    await page.getByRole("button", { name: "Criar" }).click();

    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Email é obrigatório")).toBeVisible();
    await expect(
      page.getByText("Senha deve ter no mínimo 6 caracteres"),
    ).toBeVisible();

    /** O dialog permanece aberto para correção. */
    await expect(
      page.getByRole("heading", { name: "Criar Novo Usuário" }),
    ).toBeVisible();

    /** `shouldFocusError` (default do RHF) move o foco para o primeiro inválido. */
    const nome = page.getByRole("textbox", { name: "Nome" });
    await expect(nome).toHaveAttribute("aria-invalid", "true");
    await expect(nome).toBeFocused();

    /** `reValidateMode: "onChange"` (default do RHF) limpa o erro ao digitar. */
    await nome.fill("Fulana de Tal");
    await expect(page.getByText("Nome é obrigatório")).toBeHidden();
  });

  /**
   * Com dados digitados, fechar por Esc exibe o veil de descarte; descartar
   * fecha e a reabertura vem limpa (o `aoDescartar` reseta o formulário).
   */
  test("Usuários: guarda de alterações intercepta o fechamento e o descarte reseta", async ({
    page,
  }) => {
    await page.goto("/admin/usuarios");
    await page.getByRole("button", { name: "Novo Usuário" }).click();

    const nome = page.getByRole("textbox", { name: "Nome" });
    await nome.fill("Rascunho Abandonado");
    await page.keyboard.press("Escape");

    const veil = page.getByRole("alertdialog");
    await expect(veil).toBeVisible();
    await expect(veil.getByText("Descartar alterações?")).toBeVisible();

    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    /** Reabrir confirma que o descarte resetou o formulário. */
    await page.getByRole("button", { name: "Novo Usuário" }).click();
    await expect(page.getByRole("textbox", { name: "Nome" })).toHaveValue("");
  });

  /** Submeter o formulário de papel vazio exibe as duas mensagens Zod. */
  test("Papéis: submeter vazio exibe os erros dos dois campos obrigatórios", async ({
    page,
  }) => {
    await page.goto("/admin/roles");
    await page.getByRole("button", { name: "Novo Papel" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar Novo Papel" }),
    ).toBeVisible();
    await expect(page.getByText("* campo obrigatório")).toBeVisible();

    await page.getByRole("button", { name: "Criar" }).click();

    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Descrição é obrigatória")).toBeVisible();

    /** Sem nada digitado o formulário está limpo: Esc fecha direto, sem veil. */
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });

  /** Submeter o formulário de permissão vazio exibe as duas mensagens Zod. */
  test("Permissões: submeter vazio exibe os erros dos dois campos obrigatórios", async ({
    page,
  }) => {
    await page.goto("/admin/permissoes");
    await page.getByRole("button", { name: "Nova Permissão" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar Nova Permissão" }),
    ).toBeVisible();
    await expect(page.getByText("* campo obrigatório")).toBeVisible();

    await page.getByRole("button", { name: "Criar" }).click();

    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Descrição é obrigatória")).toBeVisible();
  });

  /**
   * Os dois dialogs de Igrejas (criação e edição) validam o nome vazio e cada
   * um tem a própria guarda de alterações não salvas.
   */
  test("Igrejas: criação e edição validam nome vazio, com guardas independentes", async ({
    page,
  }) => {
    await page.goto("/admin/igrejas");
    await expect(page.getByRole("heading", { name: "Igrejas" })).toBeVisible();

    /** Dialog de criação: submit vazio mostra o erro Zod, sem fechar. */
    await page.getByRole("button", { name: "Nova Igreja" }).click();
    await expect(
      page.getByRole("heading", { name: "Nova Igreja" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Criar" }).click();
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();

    /** Guarda da criação: com nome digitado, Cancelar exibe o veil. */
    await page.getByRole("textbox", { name: "Nome" }).fill("Igreja Abandonada");
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    /** Dialog de edição: limpar o nome e salvar mostra o mesmo erro Zod. */
    await page.getByRole("button", { name: "Editar" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Editar Igreja" }),
    ).toBeVisible();
    const nomeEdicao = page.getByRole("textbox", { name: "Nome" });
    await nomeEdicao.clear();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();

    /** Guarda da edição: o nome alterado (limpo) também arma o veil. */
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("Admin — IgrejaUsers (vínculo sem react-hook-form)", () => {
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
   * Fluxo completo do dialog migrado: abre com legenda e botão desabilitado,
   * seleciona um usuário no Select (Radix) e vincula com toast de sucesso.
   */
  test("vincula um usuário pela UI com Select dentro do dialog", async ({
    page,
  }) => {
    await page.goto(`/admin/igrejas/${fixture.id}/usuarios`);
    await page.getByRole("button", { name: "Vincular Usuário" }).click();

    await expect(
      page.getByRole("heading", { name: "Vincular Usuário" }),
    ).toBeVisible();
    await expect(page.getByText("* campo obrigatório")).toBeVisible();

    /** Sem seleção, o submit fica desabilitado (campo obrigatório). */
    const vincular = page.getByRole("button", { name: "Vincular", exact: true });
    await expect(vincular).toBeDisabled();

    /** Seleciona o primeiro usuário disponível no Select do dialog. */
    await page.getByRole("combobox", { name: /selecionar usuário/i }).click();
    const primeiraOpcao = page.getByRole("option").first();
    await expect(primeiraOpcao).toBeVisible();
    const rotuloSelecionado = await primeiraOpcao.innerText();
    await primeiraOpcao.click();

    await expect(vincular).toBeEnabled();
    await vincular.click();

    /** Toast de sucesso e usuário listado confirmam o vínculo. */
    await expect(
      page.getByText("Usuário vinculado com sucesso.").first(),
    ).toBeVisible({ timeout: 5_000 });
    const nomeVinculado = rotuloSelecionado.split(" — ")[0].trim();
    await expect(
      page.getByRole("cell", { name: nomeVinculado }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  /**
   * A guarda protege a seleção não confirmada: com usuário selecionado,
   * Esc exibe o veil em vez de fechar o dialog.
   */
  test("Esc com usuário selecionado exibe o veil de descarte", async ({
    page,
  }) => {
    await page.goto(`/admin/igrejas/${fixture.id}/usuarios`);
    await page.getByRole("button", { name: "Vincular Usuário" }).click();

    await page.getByRole("combobox", { name: /selecionar usuário/i }).click();
    await page.getByRole("option").first().click();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
