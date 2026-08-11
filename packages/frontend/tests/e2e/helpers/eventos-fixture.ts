/**
 * Fixtures de API para specs de eventos (escalas) que não devem depender de
 * dados ambientes do banco de dev.
 *
 * `criarEventosHistorico` atende `historico.spec.ts`/`historico.mobile.spec.ts`:
 * os specs originais dependiam de 2 eventos ad-hoc que só existiam no banco
 * de dev ("Teste de responsividade", "Culto realizado para teste de
 * histórico") — sem seed, num banco limpo os testes estourariam timeout
 * esperando uma linha que nunca aparece.
 *
 * `criarEventoComMusica` atende `escala-detalhe.spec.ts`/`escalas.mobile.spec.ts`
 * (tom por música na escala, F11): cria uma música com tom conhecido já
 * associada a um evento, para os specs exercitarem o `MusicaTomPicker` sem
 * depender de qual escala/música o banco de dev tem no momento.
 *
 * Ambas criam os próprios dados via API (`POST /api/eventos`, `POST
 * /api/musicas`) com nomes únicos por execução (sufixo de timestamp, mesmo
 * padrão de `admin-igrejas.spec.ts`) e removem tudo ao final.
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

/**
 * Evento com uma música associada, mais dois tons distintos do catálogo do
 * tenant, criados via API para os specs de tom por música na escala
 * (`escala-detalhe.spec.ts` e `escalas.mobile.spec.ts`). `tomGlobal` é o tom
 * com que a música nasce (`POST /musicas`); `outroTom` é um segundo tom do
 * catálogo, usado nos specs para exercitar o override de tom na escala
 * (`PATCH /eventos/:eventoId/musicas/:musicaId/tonalidade`).
 */
export interface EventoComMusicaFixture {
  /** UUID do evento criado. */
  eventoId: string;
  /** Descrição única do evento (sufixo de timestamp), usada como título da linha. */
  descricao: string;
  /** UUID da música associada ao evento. */
  musicaId: string;
  /** Nome único da música (sufixo de timestamp). */
  musicaNome: string;
  /** Tom com que a música foi cadastrada — é o tom efetivo inicial na escala (sem override). */
  tomGlobal: { id: string; tom: string };
  /** Segundo tom do catálogo do tenant, distinto de `tomGlobal` — usado para definir o override. */
  outroTom: { id: string; tom: string };
  /** Remove a música e o evento criados e libera o contexto de API. Chamar em `afterAll`. */
  limpar: () => Promise<void>;
}

/**
 * Autentica como admin e cria, via API, uma música com tom conhecido e um
 * evento com essa música já associada — o `MusicaTomPicker` (F11) precisa de
 * uma música com tom global determinístico e de um segundo tom do catálogo
 * para exercitar a troca de tom sem depender de dados ambientes do banco.
 *
 * @returns O evento/música criados, os dois tons de teste (`tomGlobal`/`outroTom`)
 * e a função `limpar` para remover os dados ao final da suíte.
 */
export async function criarEventoComMusica(): Promise<EventoComMusicaFixture> {
  const api = await playwrightRequest.newContext({
    baseURL: "http://localhost:8080",
  });

  const loginResponse = await api.post("/api/sessions", {
    data: { email: "admin@louvorflow.com", password: "Admin@123" },
  });
  const { token } = await loginResponse.json();
  const auth = { Authorization: `Bearer ${token}` };

  const tonalidadesResponse = await api.get("/api/tonalidades", { headers: auth });
  const tonalidades: Array<{ id: string; tom: string }> = await tonalidadesResponse.json();
  if (tonalidades.length < 2) {
    throw new Error(
      "Fixture exige ao menos 2 tonalidades semeadas no tenant (seedTenantDefaults deveria semear 24).",
    );
  }
  const [tomGlobal, outroTom] = tonalidades;

  const tiposResponse = await api.get("/api/tipos-eventos", { headers: auth });
  const tipos: Array<{ id: string; nome: string }> = await tiposResponse.json();
  const { id: fk_tipo_evento } = tipos[0];

  const sufixo = Date.now();

  const musicaNome = `E2E Musica Tom ${sufixo}`;
  const musicaResponse = await api.post("/api/musicas", {
    headers: auth,
    data: { nome: musicaNome, fk_tonalidade: tomGlobal.id },
  });
  const { musica } = await musicaResponse.json();
  const musicaId: string = musica.id;

  const descricao = `E2E Escala Tom ${sufixo}`;
  const eventoResponse = await api.post("/api/eventos", {
    headers: auth,
    data: { data: new Date().toISOString(), fk_tipo_evento, descricao },
  });
  const { evento } = await eventoResponse.json();
  const eventoId: string = evento.id;

  await api.post(`/api/eventos/${eventoId}/musicas`, {
    headers: auth,
    data: { musicas_id: musicaId },
  });

  /**
   * Remove o evento (e o vínculo com a música) e depois a própria música, e
   * libera o contexto de API. A ordem importa: o evento precisa ser removido
   * antes da música, já que o vínculo aponta para ela.
   *
   * @returns Promise resolvida quando a limpeza terminar.
   */
  async function limpar(): Promise<void> {
    await api.delete(`/api/eventos/${eventoId}`, { headers: auth });
    await api.delete(`/api/musicas/${musicaId}`, { headers: auth });
    await api.dispose();
  }

  return { eventoId, descricao, musicaId, musicaNome, tomGlobal, outroTom, limpar };
}

/**
 * Escala futura de teste criada via API para os specs da lista de Escalas
 * (`escalas.spec.ts` e `escalas.mobile.spec.ts`), mais utilitários de
 * limpeza — os fluxos de duplicar/rascunho criam eventos NOVOS pela UI, cujo
 * id o spec não conhece, então a limpeza varre por descrição.
 */
export interface EscalaFuturaFixture {
  /** UUID do evento criado. */
  id: string;
  /** Descrição única do evento (sufixo de timestamp), título da linha e prefixo das derivadas. */
  descricao: string;
  /** Nome do tipo de evento usado (pré-preenchido no dialog de duplicação). */
  tipoNome: string;
  /**
   * Cria via API um rascunho futuro (sem músicas) com a descrição dada —
   * usada pelos specs que exercitam o fluxo de publicação. Prefixar a
   * descrição com a da suíte garante a varredura no `limpar`.
   *
   * @param descricao - Descrição/título do rascunho.
   * @returns UUID do rascunho criado.
   */
  criarRascunho: (descricao: string) => Promise<string>;
  /**
   * Exclui via API todos os eventos cuja descrição contém o texto dado —
   * usada para varrer cópias/rascunhos criados pela UI durante os testes.
   *
   * @param texto - Trecho da descrição a casar (ex.: o prefixo único da suíte).
   */
  excluirPorDescricao: (texto: string) => Promise<void>;
  /** Varre todos os eventos com o prefixo da suíte e libera o contexto de API. Chamar em `afterAll`. */
  limpar: () => Promise<void>;
}

/**
 * Autentica como admin e cria uma escala publicada com data futura (7 dias à
 * frente) e descrição única, para os specs de Escalas exercitarem as ações
 * do card (Editar/Excluir/Duplicar/Detalhes), a duplicação e o fluxo de
 * rascunho sem depender de dados ambientes do banco de dev.
 *
 * @returns O evento criado, o nome do tipo usado e as rotinas de limpeza.
 */
export async function criarEscalaFutura(): Promise<EscalaFuturaFixture> {
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

  const descricao = `E2E Escalas ${Date.now()}`;
  const data = new Date(Date.now() + 7 * UM_DIA_MS).toISOString();
  const eventoResponse = await api.post("/api/eventos", {
    headers: auth,
    data: { data, fk_tipo_evento, descricao },
  });
  const { evento } = await eventoResponse.json();
  const id: string = evento.id;

  /**
   * Cria via API um rascunho futuro (sem músicas) com a descrição dada.
   *
   * @param descricaoRascunho - Descrição/título do rascunho.
   * @returns UUID do rascunho criado.
   */
  async function criarRascunho(descricaoRascunho: string): Promise<string> {
    const response = await api.post("/api/eventos", {
      headers: auth,
      data: {
        data: new Date(Date.now() + 3 * UM_DIA_MS).toISOString(),
        fk_tipo_evento,
        descricao: descricaoRascunho,
        status: "rascunho",
      },
    });
    const body = await response.json();
    return body.evento.id;
  }

  /**
   * Exclui via API todos os eventos cuja descrição contém o texto dado.
   *
   * @param texto - Trecho da descrição a casar.
   */
  async function excluirPorDescricao(texto: string): Promise<void> {
    const listaResponse = await api.get("/api/eventos", { headers: auth });
    const eventos: Array<{ id: string; descricao: string }> =
      await listaResponse.json();
    for (const e of eventos) {
      if (e.descricao.includes(texto)) {
        await api.delete(`/api/eventos/${e.id}`, { headers: auth });
      }
    }
  }

  /**
   * Varre todos os eventos com o prefixo único da suíte (o original e os
   * criados pela UI: cópias e rascunhos) e libera o contexto de API.
   *
   * @returns Promise resolvida quando a limpeza terminar.
   */
  async function limpar(): Promise<void> {
    await excluirPorDescricao(descricao);
    await api.dispose();
  }

  return { id, descricao, tipoNome, criarRascunho, excluirPorDescricao, limpar };
}
