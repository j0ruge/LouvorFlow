/**
 * Fixture de API para os specs de Histórico (`historico.spec.ts` e
 * `historico.mobile.spec.ts`).
 *
 * Os specs originais dependiam de 2 eventos ad-hoc que só existiam no banco
 * de dev ("Teste de responsividade", "Culto realizado para teste de
 * histórico") — sem seed, num banco limpo os testes estourariam timeout
 * esperando uma linha que nunca aparece. Este helper cria os próprios dados
 * via API (`POST /api/eventos`) com nomes únicos por execução (sufixo de
 * timestamp, mesmo padrão de `admin-igrejas.spec.ts`) e datas passadas
 * controladas — necessárias para o teste de ordenação decrescente — e
 * remove tudo (`DELETE /api/eventos/:id`) ao final.
 *
 * Usa `/api/*` sobre o `baseURL` do frontend (porta 8080): o Vite dev
 * server já faz proxy de `/api` para o backend (`vite.config.ts`), o mesmo
 * caminho que o app real usa a partir do browser.
 */

import { request as playwrightRequest } from "@playwright/test";
import { formatDataExtenso } from "@/lib/utils";

/** Um dia em milissegundos, para deslocar datas de eventos no passado. */
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Evento de teste criado via API, com os dados necessários para asserções nos specs. */
export interface EventoHistoricoFixture {
  /** UUID do evento criado. */
  id: string;
  /** Descrição única (com sufixo de timestamp) usada como título da linha. */
  descricao: string;
  /** Data ISO 8601 do evento (sempre no passado). */
  data: string;
  /**
   * Data por extenso em PT-BR minúsculo (ex.: `"6 de agosto"`), calculada
   * com o mesmo `formatDataExtenso` de `@/lib/utils` que o `History.tsx`
   * usa (sem `{ capitalizar: true }`) — usada pelos specs para assertar a
   * legenda sem duplicar datas fixas que quebrariam a cada execução em dia
   * diferente.
   */
  legenda: string;
}

/** Par de eventos de teste do Histórico, mais a rotina de limpeza. */
export interface EventosHistoricoFixture {
  /** Evento mais recente dos dois (deve aparecer primeiro na listagem). */
  recente: EventoHistoricoFixture;
  /** Evento mais antigo dos dois (deve aparecer depois do `recente`). */
  antigo: EventoHistoricoFixture;
  /**
   * Nome do tipo de evento usado nos dois eventos (pill exibida ao lado do
   * título). Lido de `GET /api/tipos-eventos` em vez de fixo no código: a
   * API não garante ordem determinística entre os tipos semeados, então
   * assertar um nome hardcoded (ex.: "Culto de Domingo") seria frágil.
   */
  tipoNome: string;
  /** Remove os dois eventos criados e libera o contexto de API. Chamar em `afterAll`. */
  limpar: () => Promise<void>;
}

/**
 * Autentica como admin e cria dois eventos passados com descrições únicas,
 * para os specs de Histórico exercitarem título/legenda/ordenação sem
 * depender de dados fixos do banco de dev.
 *
 * @returns Os dois eventos criados (`recente`/`antigo`) e a função `limpar`
 * para remover os dados ao final da suíte.
 */
export async function criarEventosHistorico(): Promise<EventosHistoricoFixture> {
  const api = await playwrightRequest.newContext({
    baseURL: "http://localhost:8080",
  });

  const loginResponse = await api.post("/api/sessions", {
    data: { email: "admin@louvorflow.com", password: "Admin@123" },
  });
  const { token } = await loginResponse.json();
  const auth = { Authorization: `Bearer ${token}` };

  /** Reaproveita o primeiro tipo de evento já semeado no tenant (ordem não é garantida pela API). */
  const tiposResponse = await api.get("/api/tipos-eventos", { headers: auth });
  const tipos: Array<{ id: string; nome: string }> = await tiposResponse.json();
  const { id: fk_tipo_evento, nome: tipoNome } = tipos[0];

  const sufixo = Date.now();
  const agora = Date.now();

  /**
   * Cria um evento passado via API.
   *
   * @param descricao - Descrição/título único do evento.
   * @param diasAtras - Quantos dias no passado, a partir de agora, a data do evento deve ficar.
   * @returns O evento criado, com id/descrição/data prontos para asserção nos specs.
   */
  async function criar(descricao: string, diasAtras: number): Promise<EventoHistoricoFixture> {
    const data = new Date(agora - diasAtras * UM_DIA_MS).toISOString();
    const response = await api.post("/api/eventos", {
      headers: auth,
      data: { data, fk_tipo_evento, descricao },
    });
    const body = await response.json();
    return { id: body.evento.id, descricao, data, legenda: formatDataExtenso(data) };
  }

  /** 5 dias atrás — mais recente dos dois, deve listar primeiro (ordem decrescente). */
  const recente = await criar(`E2E Historico Recente ${sufixo}`, 5);
  /** 15 dias atrás — mais antigo, deve listar depois do `recente`. */
  const antigo = await criar(`E2E Historico Antigo ${sufixo}`, 15);

  /**
   * Remove os dois eventos criados e libera o contexto de API.
   *
   * @returns Promise resolvida quando a limpeza terminar.
   */
  async function limpar(): Promise<void> {
    await api.delete(`/api/eventos/${recente.id}`, { headers: auth });
    await api.delete(`/api/eventos/${antigo.id}`, { headers: auth });
    await api.dispose();
  }

  return { recente, antigo, tipoNome, limpar };
}
