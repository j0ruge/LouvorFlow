/**
 * Testes E2E do CRUD de entidades auxiliares em Configurações
 * (`ConfigCrudSection`, aba Artistas).
 *
 * Cobre o fluxo feliz de criação com o destaque visual de 2s no item novo e
 * a checagem client-side de duplicado por caixa — que não deve gerar
 * nenhuma requisição de criação (o erro 409 do backend nunca é acionado).
 *
 * O Playwright roda sem reset de banco entre execuções, então o nome do
 * artista usa sufixo de timestamp (único por execução) e é excluído via API
 * no `afterEach`, mesmo padrão de `tests/e2e/helpers/eventos-fixture.ts` e
 * de `admin-igrejas.spec.ts`.
 */

import { test, expect } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";
import { obterSessaoAdmin } from "./helpers/sessao";

test.describe("Configurações — CRUD (ConfigCrudSection)", () => {
  let api: APIRequestContext;
  let authHeader: { Authorization: string };
  /** Nomes de artistas criados durante o teste corrente, para excluir no `afterEach`. */
  let nomesCriados: string[];

  /** Toma a sessão de API compartilhada da suíte (um único login por worker). */
  test.beforeAll(async () => {
    ({ api, auth: authHeader } = await obterSessaoAdmin());
  });

  /** Reseta a lista de nomes a limpar antes de cada teste. */
  test.beforeEach(() => {
    nomesCriados = [];
  });

  /**
   * Remove, via API, todo artista cujo nome foi registrado em `nomesCriados`
   * durante o teste — evita que os dados de teste se acumulem no banco
   * compartilhado usado pelo Playwright (sem reset entre execuções).
   */
  test.afterEach(async () => {
    if (nomesCriados.length === 0) return;
    const response = await api.get("/api/artistas", { headers: authHeader });
    const artistas: Array<{ id: string; nome: string }> = await response.json();
    const paraExcluir = artistas.filter((artista) => nomesCriados.includes(artista.nome));
    for (const artista of paraExcluir) {
      await api.delete(`/api/artistas/${artista.id}`, { headers: authHeader });
    }
  });

  /** Cobre o fluxo completo: criação com destaque de 2s e bloqueio client-side de duplicado por caixa, sem request 409. */
  test("cria artista, exibe destaque de 2s e bloqueia duplicado por caixa sem requisicao", async ({
    page,
  }) => {
    const sufixo = Date.now();
    const nomeArtista = `E2E Artista ${sufixo}`;
    nomesCriados.push(nomeArtista);

    /** Conta requisições de criação (`POST /api/artistas`) disparadas durante o teste. */
    let requisicoesCriacao = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/api/artistas")) {
        requisicoesCriacao += 1;
      }
    });

    await page.goto("/configuracoes");
    await expect(page.getByRole("tab", { name: "Artistas" })).toHaveAttribute(
      "data-state",
      "active",
    );

    const input = page.getByPlaceholder("Novo artista...");
    await input.fill(nomeArtista);
    await page.getByRole("button", { name: "Confirmar criação" }).click();

    /** Linha do item recém-criado na lista, localizada pelo texto do nome. */
    const linha = page.locator("div.rounded-lg.border-border", { hasText: nomeArtista });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha).toHaveClass(/animate-highlight-new/);
    expect(requisicoesCriacao).toBe(1);

    /** O destaque decai em 2s (animação `highlight-new`); confirma que a classe some depois. */
    await expect(linha).not.toHaveClass(/animate-highlight-new/, { timeout: 5_000 });

    /** Duplicado só por caixa: erro inline aparece sem nenhuma requisição nova de criação. */
    await input.fill(nomeArtista.toUpperCase());
    await page.getByRole("button", { name: "Confirmar criação" }).click();
    await expect(
      page.getByText("Já existe um artista com esse nome."),
    ).toBeVisible();
    expect(requisicoesCriacao).toBe(1);

    /** Digitar novamente limpa o erro inline. */
    await input.fill(`${nomeArtista.toUpperCase()} Extra`);
    await expect(
      page.getByText("Já existe um artista com esse nome."),
    ).not.toBeVisible();
  });
});
