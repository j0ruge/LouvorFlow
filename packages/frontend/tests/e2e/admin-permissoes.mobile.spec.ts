/**
 * Testes E2E de responsividade mobile da listagem de permissões.
 *
 * Roda apenas no projeto `mobile` do Playwright (Galaxy S8, 360×740). A página
 * era a única lista admin que ainda renderizava só a `<Table>` nos dois
 * viewports: nomes de permissão são tokens `snake_case` sem espaço, que não
 * quebram linha e empurravam a tabela para a rolagem horizontal que o
 * `frontend-react.md` proíbe. Estes casos travam o layout dual no lugar.
 */

import { test, expect } from "./fixtures";
import { expectSemOverflowHorizontal } from "./helpers/viewport";

test.describe("Mobile — Permissões (360×740)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/permissoes");
    await expect(
      page.getByRole("heading", { name: "Permissões" }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  /** A tabela de desktop sai da árvore de acessibilidade e os cards assumem. */
  test("deve exibir cards no lugar da tabela", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Nova Permissão" })).toBeVisible({
      timeout: 10_000,
    });

    /** `hidden sm:block` esconde a tabela a 360px. */
    await expect(page.getByRole("table")).toBeHidden();

    /**
     * `escalas.write` vem do seed (`seeds/admin.ts`), então o card com esse
     * nome precisa estar visível — é o que prova que os dados chegaram na
     * variante de cards, e não apenas que a tabela sumiu. `exact: true` evita
     * casar com a descrição da permissão, que também cita o nome.
     */
    await expect(
      page.getByText("escalas.write", { exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  /** A listagem não pode exigir rolagem horizontal — o ponto da mudança. */
  test("não deve ter overflow horizontal na listagem", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Nova Permissão" })).toBeVisible({
      timeout: 10_000,
    });

    await expectSemOverflowHorizontal(page);
  });
});
