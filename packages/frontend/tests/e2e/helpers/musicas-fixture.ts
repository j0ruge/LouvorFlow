/**
 * Fixture de API para os specs de busca em `/musicas`.
 *
 * Os testes de filtro procuravam a música "T031", que **não existe no seed** —
 * dependiam de um dado ad-hoc de um banco de dev específico e falhavam em
 * qualquer outra máquina. Aqui a própria suíte cria a música que vai buscar,
 * com nome único por execução, e a remove ao final.
 *
 * Mesmo padrão de `helpers/eventos-fixture.ts`: `/api/*` sobre o baseURL do
 * frontend (8080, proxiado pelo Vite) e a sessão de API compartilhada de
 * `obterSessaoAdmin()`.
 */

import { expect } from "@playwright/test";
import { obterSessaoAdmin } from "./sessao";

/** Música de teste criada via API, com a rotina de limpeza. */
export interface MusicaDeTesteFixture {
  /** UUID da música criada. */
  id: string;
  /** Nome completo e único da música (com sufixo de timestamp). */
  nome: string;
  /**
   * Trecho digitado na busca. É o prefixo estável do nome (sem o timestamp),
   * o suficiente para filtrar sem depender do valor do sufixo.
   */
  termoDeBusca: string;
  /** Remove a música criada. Chamar em `afterAll`. */
  limpar: () => Promise<void>;
}

/** Prefixo do nome — improvável de colidir com dado real do banco de dev. */
const PREFIXO = "E2E Busca Musica";

/**
 * Cria, via API, uma música com nome único para os testes de busca da lista.
 *
 * A falha de criação é assertada aqui: sem isso viraria `TypeError` opaco ao
 * ler `musica.id` e o cleanup ficaria com id indefinido.
 *
 * @returns A música criada, o termo a digitar na busca e a função `limpar`.
 */
export async function criarMusicaDeTeste(): Promise<MusicaDeTesteFixture> {
  const { api, auth } = await obterSessaoAdmin();

  const tonalidadesResponse = await api.get("/api/tonalidades", { headers: auth });
  const tonalidades: Array<{ id: string }> = await tonalidadesResponse.json();
  expect(
    tonalidades.length,
    "fixture exige ao menos 1 tonalidade semeada no tenant",
  ).toBeGreaterThan(0);

  const nome = `${PREFIXO} ${Date.now()}`;
  const resposta = await api.post("/api/musicas", {
    headers: auth,
    data: { nome, fk_tonalidade: tonalidades[0].id },
  });
  expect(
    resposta.ok(),
    `criação da música de busca falhou (HTTP ${resposta.status()})`,
  ).toBeTruthy();

  const { musica } = await resposta.json();
  const id: string = musica.id;

  /**
   * Remove a música criada pelo fixture.
   *
   * @returns Promise resolvida quando a limpeza terminar.
   */
  async function limpar(): Promise<void> {
    await api.delete(`/api/musicas/${id}`, { headers: auth });
  }

  return { id, nome, termoDeBusca: PREFIXO, limpar };
}
