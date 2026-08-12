/**
 * Sessão de API compartilhada pelos fixtures E2E.
 *
 * `POST /api/sessions` é limitado a 10 requisições por IP a cada 15 minutos
 * (`loginLimiter` em `sessions.routes.ts`). Cada fixture que autenticava por
 * conta própria consumia uma dessas 10, e a suíte inteira estourava o limite
 * antes da metade — os testes seguintes falhavam com 429 no lugar do bug que
 * deveriam pegar.
 *
 * Aqui o access token é obtido uma vez e **gravado em disco**, ao lado do estado
 * de navegador de `../fixtures.ts`. A memoização em módulo não bastaria: o
 * Playwright reinicia o worker a cada teste que falha, e cada worker novo
 * refaria o login — bastavam 10 falhas para a suíte inteira virar 429.
 *
 * O token vale 1h (`ACCESS_TOKEN_EXPIRES_IN`); é reaproveitado enquanto estiver
 * dentro da margem de segurança e ainda for aceito pela API.
 *
 * O contexto **não** deve ser liberado pelos consumidores (`api.dispose()`):
 * ele é compartilhado e o Playwright o descarta ao fim do processo.
 */

import {
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CREDENCIAIS_ADMIN } from "./credenciais";

/**
 * Base das chamadas de API dos fixtures: o dev server do Vite (8080), que
 * proxia `/api` para o backend. Mesma origem usada pelo navegador nos testes.
 */
const BASE_URL = "http://localhost:8080";

/** Diretório do estado de autenticação da suíte (fora do git — ver `.gitignore`). */
const DIRETORIO_ESTADO = join(dirname(fileURLToPath(import.meta.url)), "..", ".auth");

/** Arquivo com o access token reaproveitado entre workers e execuções. */
const ARQUIVO_TOKEN = join(DIRETORIO_ESTADO, "api.json");

/**
 * Margem de reaproveitamento do access token (45 min de 1h de validade) — evita
 * pegar um token que expira no meio da suíte.
 */
const VALIDADE_MS = 45 * 60 * 1000;

/** Rota autenticada e barata usada para confirmar que o token gravado ainda vale. */
const ROTA_DE_SONDAGEM = "/api/tonalidades";

/** Sessão de API autenticada, compartilhada entre fixtures do mesmo worker. */
export interface SessaoAdmin {
  /** Contexto de requisição do Playwright já apontado para o baseURL. */
  api: APIRequestContext;
  /** Header `Authorization` pronto para ser espalhado nas chamadas. */
  auth: { Authorization: string };
}

/** Formato do arquivo de token em disco. */
interface TokenEmDisco {
  /** Access token JWT. */
  token: string;
  /** Timestamp (ms) da emissão, para a checagem de validade. */
  criadoEm: number;
}

/** Promessa memoizada — garante uma única resolução por processo de worker. */
let sessaoEmCache: Promise<SessaoAdmin> | null = null;

/**
 * Lê o token gravado, se houver e ainda estiver dentro da margem de validade.
 *
 * @returns O token em disco ou `null` quando ausente, ilegível ou velho demais.
 */
function lerTokenEmDisco(): string | null {
  if (!existsSync(ARQUIVO_TOKEN)) return null;

  try {
    const conteudo: TokenEmDisco = JSON.parse(readFileSync(ARQUIVO_TOKEN, "utf8"));
    const dentroDaValidade = Date.now() - conteudo.criadoEm < VALIDADE_MS;
    return dentroDaValidade ? conteudo.token : null;
  } catch {
    /** Arquivo corrompido por execução interrompida — trata como ausente. */
    return null;
  }
}

/**
 * Grava o token emitido para que os próximos workers o reaproveitem.
 *
 * @param token - Access token recém-emitido.
 */
function gravarTokenEmDisco(token: string): void {
  mkdirSync(DIRETORIO_ESTADO, { recursive: true });
  writeFileSync(
    ARQUIVO_TOKEN,
    JSON.stringify({ token, criadoEm: Date.now() } satisfies TokenEmDisco),
  );
}

/**
 * Autentica como admin via API e grava o token em disco.
 *
 * A falha de login é assertada aqui: sem isso, um 429 ou 401 viraria
 * `TypeError` opaco ao desestruturar `token` mais adiante.
 *
 * @param api - Contexto de requisição já criado.
 * @returns O access token emitido.
 */
async function autenticar(api: APIRequestContext): Promise<string> {
  const resposta = await api.post("/api/sessions", { data: CREDENCIAIS_ADMIN });
  expect(
    resposta.ok(),
    `login de API compartilhado falhou (HTTP ${resposta.status()})`,
  ).toBeTruthy();

  const { token } = await resposta.json();
  gravarTokenEmDisco(token);
  return token;
}

/**
 * Resolve a sessão: reaproveita o token em disco quando a API ainda o aceita e
 * só então recorre ao login.
 *
 * @returns Contexto de API autenticado e o header de autorização.
 */
async function resolverSessao(): Promise<SessaoAdmin> {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const gravado = lerTokenEmDisco();

  if (gravado) {
    const sondagem = await api.get(ROTA_DE_SONDAGEM, {
      headers: { Authorization: `Bearer ${gravado}` },
    });
    if (sondagem.ok()) {
      return { api, auth: { Authorization: `Bearer ${gravado}` } };
    }
  }

  const token = await autenticar(api);
  return { api, auth: { Authorization: `Bearer ${token}` } };
}

/**
 * Devolve a sessão de API compartilhada, resolvendo-a na primeira chamada.
 *
 * @returns Contexto de API autenticado e o header de autorização.
 */
export function obterSessaoAdmin(): Promise<SessaoAdmin> {
  sessaoEmCache ??= resolverSessao();
  return sessaoEmCache;
}
