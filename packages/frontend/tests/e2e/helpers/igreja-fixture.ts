/**
 * Fixture de API para os specs do dialog de vínculo em IgrejaUsers
 * (`admin-formularios.spec.ts` e `admin-formularios.mobile.spec.ts`).
 *
 * Cria uma igreja vazia dedicada ao teste via `POST /api/igrejas` (nome único
 * por execução) — garante que sempre existe pelo menos um usuário disponível
 * para vincular, sem depender do estado do banco compartilhado — e desfaz
 * tudo em `limpar()`: remove os vínculos feitos pelo teste
 * (`DELETE /igrejas/:id/users/:userId`) e desativa a igreja
 * (`DELETE /igrejas/:id`, que na API de igrejas é soft delete).
 *
 * Mesmo padrão de `helpers/eventos-fixture.ts`: usa `/api/*` sobre o baseURL
 * do frontend (porta 8080), que o Vite dev server já proxia para o backend, e
 * o contexto de API compartilhado de `obterSessaoAdmin()` — autenticar aqui
 * consumiria uma das 10 requisições que o `POST /api/sessions` permite por
 * 15 min, e este fixture roda a cada teste.
 */

import { expect } from "@playwright/test";
import { obterSessaoAdmin } from "./sessao";

/** Igreja de teste criada via API, com a rotina de limpeza. */
export interface IgrejaVinculoFixture {
  /** UUID da igreja criada (vazia, sem usuários vinculados). */
  id: string;
  /** Remove os vínculos criados e desativa a igreja. Chamar em `afterEach`. */
  limpar: () => Promise<void>;
}

/**
 * Cria uma igreja vazia com nome único para o fluxo de vínculo de usuários,
 * usando a sessão de API compartilhada. A falha de criação é assertada na hora
 * (`response.ok()`) — sem isso, viraria `TypeError` opaco ao ler
 * `body.igreja.id` e deixaria o cleanup com id stale.
 *
 * @returns O id da igreja criada e a função `limpar` para desfazer tudo.
 */
export async function criarIgrejaParaVinculo(): Promise<IgrejaVinculoFixture> {
  const { api, auth } = await obterSessaoAdmin();

  const createResponse = await api.post("/api/igrejas", {
    headers: auth,
    data: { name: `E2E Form Igreja ${Date.now()}` },
  });
  expect(createResponse.ok(), "criação da igreja de teste falhou").toBeTruthy();
  const body = await createResponse.json();
  const id: string = body.igreja.id;

  /**
   * Remove os vínculos feitos pelo teste e desativa a igreja de teste.
   *
   * @returns Promise resolvida quando a limpeza terminar.
   */
  async function limpar(): Promise<void> {
    const usersResponse = await api.get(`/api/igrejas/${id}/users`, { headers: auth });
    const users: Array<{ id: string }> = await usersResponse.json();
    for (const user of users) {
      await api.delete(`/api/igrejas/${id}/users/${user.id}`, { headers: auth });
    }
    await api.delete(`/api/igrejas/${id}`, { headers: auth });
  }

  return { id, limpar };
}
