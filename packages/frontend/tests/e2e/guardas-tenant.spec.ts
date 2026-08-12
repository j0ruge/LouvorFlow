/**
 * Testes E2E das guardas de escopo de tenant e de duplicidade, no nível da API.
 *
 * Estes casos existem porque os testes unitários **não conseguem** atestá-los:
 * eles rodam sobre fakes em memória, então nunca exercitam nem a extensão
 * `$extends` que injeta `tenant_id` no Prisma real, nem o índice único do
 * Postgres que dispara o `P2002`. Um fake pode "passar" com a guarda removida.
 *
 * O que cada caso trava, em regressão:
 *
 * 1. FK de catálogo aceita por parâmetro precisa de checagem tenant-scoped. A
 *    FK do Postgres valida só a existência do `id`, não o `tenant_id` — sem a
 *    checagem, um id de `Tipos_Eventos` de outra igreja era aceito e a
 *    resposta devolvia o nome dela. Verificado ao vivo em 2026-08-12: antes da
 *    correção a API respondia **500 com o stack trace do Prisma** (caminho do
 *    arquivo, linha e nome da constraint).
 * 2. Erro do Prisma nunca escapa cru — daí a asserção sobre o corpo, e não só
 *    sobre o status: um 500 com `Invalid \`getPrisma()...\`` vaza detalhe
 *    interno para o cliente.
 * 3. A checagem prévia de nome duplicado não é trava; quem segura a corrida é
 *    o índice único, e o `P2002` resultante precisa chegar como 409.
 *
 * Não dependem de dado ambiente: o que é assertado é criado aqui e removido
 * no `afterAll`.
 */

import { test, expect } from "./fixtures";
import {
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";
import { obterSessaoAdmin } from "./helpers/sessao";

/**
 * UUID bem formado que não pertence a nenhum catálogo do tenant — o formato
 * passa pelo validator Zod, então a requisição chega até a camada de serviço,
 * que é exatamente onde a guarda precisa agir.
 */
const UUID_FORA_DO_TENANT = "00000000-0000-4000-8000-000000000123";

/** Base das chamadas de API — o dev server do Vite, que proxia `/api`. */
const BASE_URL = "http://localhost:8080";

/**
 * Requisições disparadas juntas no caso de corrida. Oito foi o menor número
 * que produziu `P2002` de forma consistente nesta base; menos que isso e o
 * escalonamento às vezes deixa a checagem prévia pegar todas.
 */
const PARALELAS = 8;

/** Uma semana em milissegundos, para datas futuras. */
const UMA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Confirma que o corpo do erro é a mensagem tratada do projeto e não um erro
 * cru do Prisma vazado pelo handler genérico do `app.ts`.
 *
 * @param corpo - Corpo JSON da resposta de erro.
 * @param mensagemEsperada - Texto exato que o `AppError` deve carregar.
 */
function esperarErroTratado(corpo: { erro?: string }, mensagemEsperada: string) {
  expect(corpo.erro).toBe(mensagemEsperada);
  expect(corpo.erro).not.toContain("prisma");
  expect(corpo.erro).not.toContain("Invalid `");
  expect(corpo.erro).not.toContain("constraint");
}

test.describe("Guardas de tenant e duplicidade (API)", () => {
  let api: APIRequestContext;
  let auth: { Authorization: string };
  /** Tipo de evento válido do tenant, usado para criar a escala de apoio. */
  let tipoValidoId: string;
  /** Escala criada para os casos de `update`/`duplicar`, removida no `afterAll`. */
  let eventoId: string;
  /** Tom da tonalidade criada no `beforeAll` — único por execução. */
  let tom: string;
  /** Todos os tons criados pela suíte, varridos no `afterAll`. */
  const tonsCriados: string[] = [];

  /** Cria, via API, a escala e a tonalidade de apoio dos casos abaixo. */
  test.beforeAll(async () => {
    ({ api, auth } = await obterSessaoAdmin());

    const tipos: Array<{ id: string }> = await (
      await api.get("/api/tipos-eventos", { headers: auth })
    ).json();
    tipoValidoId = tipos[0].id;

    const eventoResponse = await api.post("/api/eventos", {
      headers: auth,
      data: {
        data: new Date(Date.now() + UMA_SEMANA_MS).toISOString(),
        fk_tipo_evento: tipoValidoId,
        descricao: `E2E Guardas ${Date.now()}`,
      },
    });
    eventoId = (await eventoResponse.json()).evento.id;

    /** Tom curto e único: o schema limita o tamanho e o índice é por tenant. */
    tom = `E2E${Date.now() % 100000}`;
    tonsCriados.push(tom);
    await api.post("/api/tonalidades", { headers: auth, data: { tom } });
  });

  /**
   * Remove a escala e TODA tonalidade criada pela suíte — inclusive a vencedora
   * do caso concorrente, cujo id não é conhecido de antemão (a resposta 201 vem
   * de uma das cinco requisições disparadas juntas). A varredura é por tom.
   */
  test.afterAll(async () => {
    if (eventoId) await api.delete(`/api/eventos/${eventoId}`, { headers: auth });
    if (tonsCriados.length === 0) return;

    const todas: Array<{ id: string; tom: string }> = await (
      await api.get("/api/tonalidades", { headers: auth })
    ).json();
    for (const alvo of todas.filter((t) => tonsCriados.includes(t.tom))) {
      await api.delete(`/api/tonalidades/${alvo.id}`, { headers: auth });
    }
  });

  /** `create` recusa FK de catálogo que não pertence ao tenant ativo. */
  test("POST /eventos com fk_tipo_evento fora do tenant responde 404 tratado", async () => {
    const response = await api.post("/api/eventos", {
      headers: auth,
      data: {
        data: new Date(Date.now() + UMA_SEMANA_MS).toISOString(),
        fk_tipo_evento: UUID_FORA_DO_TENANT,
        descricao: "E2E guarda create",
      },
    });

    expect(response.status()).toBe(404);
    esperarErroTratado(await response.json(), "Tipo de evento não encontrado");
  });

  /** `update` aplica a mesma guarda do `create`. */
  test("PUT /eventos/:id com fk_tipo_evento fora do tenant responde 404 tratado", async () => {
    const response = await api.put(`/api/eventos/${eventoId}`, {
      headers: auth,
      data: { fk_tipo_evento: UUID_FORA_DO_TENANT },
    });

    expect(response.status()).toBe(404);
    esperarErroTratado(await response.json(), "Tipo de evento não encontrado");
  });

  /** A sobrescrita de tipo na duplicação passa pela mesma guarda. */
  test("POST /eventos/:id/duplicar com fk_tipo_evento fora do tenant responde 404 tratado", async () => {
    const response = await api.post(`/api/eventos/${eventoId}/duplicar`, {
      headers: auth,
      data: {
        data: new Date(Date.now() + 2 * UMA_SEMANA_MS).toISOString(),
        fk_tipo_evento: UUID_FORA_DO_TENANT,
      },
    });

    expect(response.status()).toBe(404);
    esperarErroTratado(await response.json(), "Tipo de evento não encontrado");
  });

  /**
   * Duplicidade **sequencial**: a checagem prévia (`findByTom`) resolve sozinha.
   * Serve de linha de base — sem ela, o caso concorrente abaixo não distingue
   * "a checagem pegou" de "o índice pegou".
   */
  test("POST /tonalidades com tom existente responde 409 tratado", async () => {
    const response = await api.post("/api/tonalidades", {
      headers: auth,
      data: { tom },
    });

    expect(response.status()).toBe(409);
    esperarErroTratado(
      await response.json(),
      "Já existe uma tonalidade com esse tom",
    );
  });

  /**
   * Duplicidade **concorrente** — este é o caso que a checagem prévia NÃO
   * cobre, e o único que exercita `comBarreiraDeDuplicidade` de verdade.
   *
   * Várias requisições simultâneas passam juntas pelo `findByTom` (nenhuma
   * enxerga a gravação da outra) e todas seguem para o `create`. Só uma vence o
   * índice único; as perdedoras recebem `P2002`. Sem a barreira esse erro sobe
   * cru: medido nesta base, 8 requisições paralelas produziram 1×201, 2×409 e
   * **5×500 com o stack trace do Prisma** no corpo.
   *
   * **Um `APIRequestContext` não serve aqui**: ele multiplexa tudo numa conexão
   * e as requisições saem em fila, cada uma já enxergando a gravação anterior —
   * o resultado vira 1×201 + N×409 pela checagem prévia, e o teste passaria com
   * a barreira removida (verificado). Por isso cada requisição ganha o seu
   * próprio contexto, que é uma conexão de verdade.
   *
   * A asserção é sobre a distribuição: exatamente um 201 e **nenhum 5xx**. Não
   * se exige um número fixo de perdedoras pelo índice — o escalonamento varia e
   * as duas rotas (checagem prévia e P2002) produzem o mesmo 409. O que não
   * pode acontecer, em nenhuma delas, é um 500.
   */
  test("POST /tonalidades concorrentes: um 201, resto 409, nenhum 500", async () => {
    const tomConcorrente = `E2E${(Date.now() + 1) % 100000}`;
    tonsCriados.push(tomConcorrente);

    /** Contextos independentes = conexões independentes = concorrência real. */
    const contextos = await Promise.all(
      Array.from({ length: PARALELAS }, () =>
        playwrightRequest.newContext({ baseURL: BASE_URL }),
      ),
    );

    try {
      const respostas = await Promise.all(
        contextos.map((contexto) =>
          contexto.post("/api/tonalidades", {
            headers: auth,
            data: { tom: tomConcorrente },
          }),
        ),
      );

      const status = respostas.map((r) => r.status());
      expect(status.filter((s) => s === 201)).toHaveLength(1);
      expect(status.filter((s) => s >= 500)).toHaveLength(0);
      expect(status.filter((s) => s === 409)).toHaveLength(PARALELAS - 1);

      /** Toda perdedora traz a mensagem tratada, não o erro cru do Prisma. */
      for (const resposta of respostas.filter((r) => r.status() === 409)) {
        esperarErroTratado(
          await resposta.json(),
          "Já existe uma tonalidade com esse tom",
        );
      }
    } finally {
      /** Contextos próprios (não o compartilhado de `sessao.ts`) — descartar é correto. */
      await Promise.all(contextos.map((contexto) => contexto.dispose()));
    }
  });
});
