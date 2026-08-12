/**
 * Testes E2E mobile (Galaxy S8, 360×740) da guarda de alterações não salvas
 * nos formulários em overlay (`useDirtyFormGuard` + `DiscardChangesVeil`).
 *
 * No mobile o `ResponsiveFormDialog` renderiza o `Drawer` (vaul) com
 * `dismissible={false}` enquanto o guard bloqueia a saída: tocar no backdrop
 * exibe o veil "Descartar alterações?" (sem overflow horizontal com o veil
 * aberto) e arrastar a folha para baixo fica inerte — não fecha nem deixa a
 * folha presa fora da tela. Com o formulário limpo, o backdrop fecha direto.
 */

import { test, expect } from "./fixtures";
import type { Locator } from "@playwright/test";
import { expectSemOverflowHorizontal } from "./helpers/viewport";

/**
 * Aguarda a folha (bottom-sheet) estabilizar após a animação de entrada do
 * vaul: duas leituras consecutivas de `boundingBox().y` iguais. Medir antes
 * disso captura a folha no meio da subida e invalida comparações de posição.
 *
 * @param folha - Locator do content do drawer (`role="dialog"`).
 */
async function aguardarFolhaEstavel(folha: Locator): Promise<void> {
  let leituraAnterior = Number.NaN;
  await expect
    .poll(
      async () => {
        const box = await folha.boundingBox();
        const leituraAtual = box?.y ?? Number.NaN;
        const estavel = leituraAtual === leituraAnterior;
        leituraAnterior = leituraAtual;
        return estavel;
      },
      { message: "folha não estabilizou após a animação de entrada" },
    )
    .toBe(true);
}

test.describe("Mobile — guarda de alterações não salvas (360×740)", () => {
  /**
   * Abre a página de Escalas e o bottom-sheet "Nova Escala".
   * `.first()` porque, com a lista vazia, o EmptyState renderiza um segundo
   * botão "Nova Escala" além do botão do header.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto("/escalas");
    await page.getByRole("button", { name: "Nova Escala" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Nova Escala" }),
    ).toBeVisible();
  });

  /** Sem alterações, tocar no backdrop fecha o bottom-sheet direto. */
  test("fecha direto no backdrop quando o formulário está limpo", async ({
    page,
  }) => {
    await page.mouse.click(180, 40);

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });

  /**
   * Com alterações, tocar no backdrop abre o veil, o bottom-sheet permanece
   * e a página não transborda horizontalmente com o veil aberto. Com o veil
   * aberto o formulário fica `inert`/`aria-hidden` (o título sai da árvore
   * de acessibilidade por design), então "o bottom-sheet permanece" é
   * assertado pelo próprio `role="dialog"`, que segue acessível.
   */
  test("backdrop com alterações abre o veil, sem overflow horizontal", async ({
    page,
  }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.mouse.click(180, 40);

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectSemOverflowHorizontal(page);
  });

  /**
   * Com alterações, arrastar a folha para baixo NÃO fecha o bottom-sheet
   * (`dismissible={false}` deixa o swipe inerte) e a folha não fica presa
   * no transform do arraste, meio fora da tela — o `boundingBox().y` da
   * folha permanece o mesmo de antes do gesto (tolerância de 1px de
   * arredondamento), além do título e do digitado permanecerem.
   */
  test("arrastar a folha para baixo não fecha com alterações", async ({
    page,
  }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");

    const folha = page.getByRole("dialog");
    await aguardarFolhaEstavel(folha);
    const folhaAntes = await folha.boundingBox();
    if (!folhaAntes) throw new Error("bounding box da folha indisponível");

    const titulo = page.getByRole("heading", { name: "Nova Escala" });
    const alvo = await titulo.boundingBox();
    if (!alvo) throw new Error("bounding box do título indisponível");

    const centroX = alvo.x + alvo.width / 2;
    await page.mouse.move(centroX, alvo.y + alvo.height / 2);
    await page.mouse.down();
    for (let passo = 1; passo <= 10; passo += 1) {
      await page.mouse.move(centroX, alvo.y + alvo.height / 2 + passo * 30);
    }
    await page.mouse.up();

    await expect(titulo).toBeVisible();
    await expect(folha).toBeVisible();

    const folhaDepois = await folha.boundingBox();
    if (!folhaDepois) throw new Error("bounding box da folha indisponível");
    expect(
      Math.abs(folhaDepois.y - folhaAntes.y),
      `folha deslocou ${folhaDepois.y - folhaAntes.y}px após o swipe`,
    ).toBeLessThanOrEqual(1);

    await expect(
      page.getByLabel("Descrição (opcional)"),
    ).toHaveValue("Ensaio geral");
  });

  /** "Continuar editando" no veil preserva o conteúdo digitado no drawer. */
  test("Continuar editando preserva o conteúdo digitado", async ({ page }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.mouse.click(180, 40);
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.getByRole("button", { name: "Continuar editando" }).click();

    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(
      page.getByLabel("Descrição (opcional)"),
    ).toHaveValue("Ensaio geral");
  });

  /** "Descartar" no veil fecha o bottom-sheet de fato. */
  test("Descartar fecha o bottom-sheet", async ({ page }) => {
    await page.getByLabel("Descrição (opcional)").fill("Ensaio geral");
    await page.mouse.click(180, 40);
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.getByRole("button", { name: "Descartar" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
