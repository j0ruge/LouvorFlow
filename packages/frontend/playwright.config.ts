/**
 * Configuração do Playwright para testes E2E.
 *
 * Usa Chromium e aponta para o servidor de desenvolvimento em
 * http://localhost:8080. Executa dois projetos: `chromium` (desktop, 1280×720)
 * e `mobile` (360×740, o Galaxy S8 que o CLAUDE.md define como alvo primário).
 * Rodar só no desktop deixaria a regra mobile-first sem verificação automatizada.
 *
 * Para rodar apenas um: `npx playwright test --project=mobile`.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      /**
       * Suíte principal, em desktop. Ignora os specs `*.mobile.spec.ts`, que
       * assertam a variante de card e só fazem sentido no viewport estreito.
       */
      name: "chromium",
      testIgnore: /.*\.mobile\.spec\.ts$/,
      use: { browserName: "chromium", viewport: { width: 1280, height: 720 } },
    },
    {
      /**
       * Alvo primário do app: Galaxy S8 (360×740), com toque habilitado.
       *
       * Roda **apenas** os specs `*.mobile.spec.ts`. Os demais specs usam
       * locators de tabela (`getByRole("table")`, `tbody tr`) e cliques diretos
       * nos links da sidebar — ambos inexistentes a 360px, onde a tabela fica
       * `display:none` e o menu vive atrás do botão "Toggle Sidebar". Rodá-los
       * aqui produziria falhas que não revelam bug nenhum.
       */
      name: "mobile",
      testMatch: /.*\.mobile\.spec\.ts$/,
      use: {
        ...devices["Galaxy S8"],
        browserName: "chromium",
        viewport: { width: 360, height: 740 },
      },
    },
  ],
});
