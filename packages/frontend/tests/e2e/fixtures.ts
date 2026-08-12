/**
 * `test` estendido da suíte E2E: a `page` chega **autenticada**.
 *
 * Specs que precisam de sessão importam `test`/`expect` daqui em vez de
 * `@playwright/test`, e não chamam `loginAsAdmin` — o fixture faz isso uma vez
 * por teste, antes do corpo rodar. Sem isso, cada spec repetia o mesmo
 * `beforeEach` de login (DRY) e três specs simplesmente esqueciam de autenticar,
 * batendo em `/login` e falhando por um motivo que não era o do teste.
 *
 * **Por que não reaproveitar a sessão entre testes.** Tentado e descartado com
 * evidência: o access token vive só em memória, então toda carga de página
 * renova a sessão pelo refresh token do `localStorage` — e a rotação é de **uso
 * único**. Qualquer `storageState` gravado é um retrato que envelhece: se o
 * teste termina com a renovação ainda em voo (caso real: o teste de 404 do
 * `navigation.spec.ts`, que assere e sai antes de o refresh voltar), o arquivo
 * guarda um token já consumido e **todos** os testes seguintes caem para
 * `/login`. Reaproveitar contexto entre testes tem o mesmo problema e ainda
 * abre mão do isolamento nativo.
 *
 * O custo de logar por teste é o rate limit de `POST /api/sessions`
 * (`loginLimiter`, 10 req/15 min por IP). Em desenvolvimento isso se resolve com
 * `LOGIN_RATE_LIMIT_MAX` no `.env` do backend — ver `.env.example`. Em produção
 * o limite segue sendo 10.
 *
 * **Quem NÃO deve usar este módulo**: specs que precisam de sessão limpa ou que
 * exercitam o próprio login (`auth.spec.ts`) — esses seguem importando de
 * `@playwright/test`.
 */

import { test as base, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

export const test = base.extend({
  /**
   * Entrega a página nativa do runner já autenticada como admin.
   *
   * @param fixtures - Página criada pelo runner (com viewport, trace e
   *   screenshot do projeto já aplicados).
   * @param usar - Callback do Playwright que entrega a página ao teste (o `use`
   *   da API, renomeado: a regra `react-hooks/rules-of-hooks` do ESLint trata
   *   qualquer chamada a `use(...)` como hook do React).
   */
  page: async ({ page }, usar) => {
    await loginAsAdmin(page);
    await usar(page);
  },
});

export { expect };
