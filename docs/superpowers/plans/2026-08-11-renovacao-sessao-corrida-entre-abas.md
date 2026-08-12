# Renovação de Sessão: corrida entre abas deixa de ser logout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Estado: parado no backlog.** Defeito identificado em 2026-08-11 durante a auditoria UX (Nielsen); plano publicado no repo em 2026-08-12. A **Task 0 está concluída** — este documento e o link no `TODO.md`. As **Tasks 1-8 não foram executadas**: o repo segue com o defeito descrito abaixo até um ciclo próprio ser aberto. Nenhum arquivo de `packages/frontend/src` foi tocado.

**Goal:** O frontend para de tratar uma disputa esperada e benigna pela rotação do refresh token como falha fatal de sessão. Duas abas que renovam ao mesmo tempo continuam ambas autenticadas; 429, 500 e blips de rede deixam de destruir credencial válida.

---

## Contexto — o defeito

O refresh token vive em `localStorage` sob a chave `louvorflow_refresh_token`, **compartilhada entre todas as abas**. O backend rotaciona esse token de forma atômica e de uso único (`rotateAtomic` em `packages/backend/src/repositories/auth/refresh-tokens.repository.ts:37-50`), **sem janela de graça e sem reuse detection**: duas abas que renovam ao mesmo tempo produzem uma vencedora e uma perdedora, e a perdedora recebe **HTTP 400** (`Refresh token não encontrado`).

O frontend lê qualquer falha de renovação como morte da credencial:

| Ponto | Código atual | Consequência |
|---|---|---|
| `packages/frontend/src/lib/api.ts:141-152` | `clearTokens()` em **qualquer** `!response.ok` e em **qualquer** `catch` | a aba perdedora apaga a chave compartilhada — inclusive o token novo que a vencedora acabou de gravar. **As duas abas caem.** E 429/500/blip de rede destroem sessão perfeitamente válida |
| `packages/frontend/src/contexts/AuthContext.tsx:167-182` | `onAuthFailure` faz `clearTokens()` + `removeItem(TENANTS_STORAGE_KEY)`, incondicionais | reintroduz o estrago pela camada de cima, mesmo que `lib/api.ts` passe a ser cuidadoso |
| `packages/frontend/src/contexts/AuthContext.tsx:198-208` | um único `try` cobre refresh **e** `getProfile`, com `catch { clearTokens() }` | se o refresh **sucede** e o perfil falha, apaga o token recém-rotacionado: perda auto-infligida de credencial válida |

**Achado que muda o desenho:** `initAuth` **não passa** por `tryRefreshToken`. Ele chama `refreshTokenService` (`packages/frontend/src/services/auth.ts:50`), um `fetch` independente. Consertar só `lib/api.ts` deixaria de fora a corrida mais provável do mundo real — abrir ou recarregar a app numa segunda aba, quando as duas rodam `initAuth` simultaneamente.

### Causa raiz (5 Porquês)

1. Por que a aba vencedora deslogou? Porque a perdedora apagou a chave compartilhada.
2. Por que a perdedora apagou? Porque `tryRefreshToken` lê todo não-ok como "esta credencial morreu".
3. Por que lê assim? Porque confunde *"esta requisição falhou"* com *"esta credencial morreu"* — não há classificação da resposta.
4. Por que não há classificação? Porque o backend devolve o mesmo 400 com string PT-BR para malformado, expirado **e** já-rotacionado; o cliente não tem sinal legível de máquina, e ninguém desenhou o contrato "o que o cliente faz em cada classe de falha".
5. Por que uma decisão local destrói um recurso global? Porque a escrita é *last-writer-wins* incondicional: nenhum ponto do código exige "só apague o que você mesmo consumiu".

**Causa raiz de processo:** decisões sobre o ciclo de vida da credencial são tomadas com visão local (por aba) sobre um recurso compartilhado de uso único, sem classificar a falha e sem compare-and-swap na escrita.

### Invariante que este ciclo estabelece

> **Só duas coisas removem o refresh token do `localStorage`: o `signOut` explícito e o caminho terminal guardado por compare-and-swap dentro de `lib/api.ts`.**

### Métrica de sucesso

1. Duas abas recarregadas simultaneamente: **ambas seguem autenticadas**, zero redirecionamento para `/login`.
2. Renovação com 429, 500 ou rede fora: sessão preservada; o usuário vê erro de conectividade, não tela de login.
3. `getProfile` falhando após refresh bem-sucedido: refresh token **permanece** no storage.
4. Orçamento de requisições por `apiFetch` provado e fechado: ≤ 1 original + ≤ 1 reenvio oportunista + ≤ 2 rotações + ≤ 1 reenvio = **≤ 5**.

---

## Architecture

**Um único ponto de renovação.** `renovarSessao()` em `lib/api.ts` passa a ser o único lugar do frontend autorizado a rotacionar a credencial, e o `initAuth` consome esse mesmo caminho. Isso mata a duplicação (DRY), estende o singleton e o compare-and-swap à abertura da app — o cenário de corrida mais provável — e faz a validação Zod da resposta, hoje existente só no caminho do `initAuth`, valer para os dois (`tryRefreshToken` faz `data.token` sem validar campo nenhum).

**Resultado discriminado no lugar de `string | null`.** `renovado` / `sessao-invalida` / `indisponivel`. A distinção entre as duas últimas é o conserto: só `sessao-invalida` encerra sessão.

**Compare-and-swap na remoção.** A chave só é apagada se o valor armazenado ainda for o token que esta aba tentou. Se outra aba já rotacionou, o valor atual é bom e apagá-lo derrubaria uma sessão válida.

**Espera curta para a ordem inversa.** O `rotateAtomic` serializa por row lock, então o 400 da perdedora chega **depois do commit** da vencedora — mas não necessariamente depois de a aba vencedora ter gravado `T1`. Duas ordens:

- **Ordem 1** — A grava `T1` → B recebe 400. O CAS já salva a credencial.
- **Ordem 2** — B recebe 400 → A grava `T1`. O `setItem` de A vem depois do `removeItem` de B, então o storage se salva sozinho — mas **B desiste e vai para `/login`** com uma credencial viva no storage.

Para cobrir as duas, o ramo terminal sonda o `localStorage` por até 500 ms (intervalo 50 ms) esperando o valor mudar antes de decidir. Custo: +500 ms **apenas** no encerramento genuíno de sessão, uma vez, e o usuário vai para o login de qualquer forma. Sondagem em vez de evento `storage` de propósito: o evento **não dispara no jsdom**, o que tornaria a correção intestável; a sondagem é exercitada mutando o `localStorage` dentro do mock de `fetch`.

**Limite provado, sem recursão.** Laço `for` com `MAX_TENTATIVAS_ROTACAO = 2`; a segunda volta só é alcançável quando o valor armazenado difere do tentado — condição que **apenas uma rotação bem-sucedida** produz. Esgotado o laço (disputa com 3+ abas), devolve **`indisponivel`**, nunca `sessao-invalida`: nesse ponto o storage contém um token comprovadamente vivo, e declarar sessão inválida seria mentir e derrubar a aba.

**`onAuthFailure` muda de significado:** passa a ser "**esta aba** perdeu a sessão" e não toca em `localStorage`. A remoção da chave compartilhada `louvorflow_user_tenants` fica exclusiva do `signOut` — ela não contém credencial, é sobrescrita no próximo login e é lida uma única vez, no inicializador de `useState` (`AuthContext.tsx:116-125`); apagá-la de uma aba perdedora arruinaria o `TenantSwitcher` da vizinha no próximo reload.

**Tech Stack:** React 18 + TypeScript 5 + Vite; Vitest 4 em jsdom (`localStorage` nativo); Zod para o contrato da resposta; Sonner para o toast. Nenhuma dependência nova. **Zero alteração no backend** — o contrato da API fica intacto.

---

## Global Constraints

- **Não refatorar** além do escopo deste defeito (`CLAUDE.md`). Exceções autorizadas pelo usuário na sessão de planejamento: remover a `refreshToken` órfã de `services/auth.ts` (Task 6) e incluir a mitigação de rotação redundante (Task 7).
- **Docstrings JSDoc em PT-BR** em TODO código novo ou modificado — incluindo cada `describe` e cada `it` dos testes.
- **Caminhos relativos, sempre a partir da raiz do repo.** Comandos de package em subshell: `(cd packages/frontend && npx vitest run)`. Comandos `git` da raiz, com caminho relativo. **Nunca** caminho absoluto de máquina (`.claude/rules/dev-workflow.md`).
- **Jidoka:** teste vermelho antes do código; teste quebrado interrompe o avanço para a próxima task.
- **Gate por task:** `(cd packages/frontend && npx vitest run)` + `(cd packages/frontend && npm run lint && npm run typecheck)`.
- **Markdown:** todo fenced code block com identificador de linguagem (MD040).
- **Sem alteração** em `packages/backend/docs/openapi.json` (mudança 100% frontend) nem nos `README.md`.

---

## File Structure

**Criar:**

- `packages/frontend/tests/unit/lib/api.refresh.test.ts` — 11 casos.
- `packages/frontend/tests/unit/contexts/AuthContext.init.test.tsx` — 4 casos.

**Modificar:**

- `packages/frontend/src/lib/api.ts` — `renovarSessao`, classificação, CAS, recuperação, mitigação de rotação redundante.
- `packages/frontend/src/contexts/AuthContext.tsx` — `onAuthFailure` e `initAuth`.
- `packages/frontend/src/services/auth.ts` — remoção da `refreshToken` órfã.
- `.claude/rules/frontend-react.md` — linhas 67, 74, 75.
- `KAIZEN_LOG.md` — entrada do ciclo.
- `TODO.md` — marcar o plano como concluído.

**Já criados (Task 0):**

- `TODO.md` (raiz) — backlog de planos abertos e oportunidades.
- `docs/superpowers/plans/2026-08-11-renovacao-sessao-corrida-entre-abas.md` — este plano.

**Reaproveitados sem alteração:** `RefreshTokenResponseSchema` (`packages/frontend/src/schemas/auth.ts:99`), `clearTokens` / `setRefreshToken` / `getRefreshToken` / `setOnAuthFailure` / `setAccessToken` (`lib/api.ts`), `clearScrollPositions` (`hooks/use-scroll-restoration.ts`), `toast` do Sonner.

---

## Tasks

### Task 0 — Publicar o plano e criar o `TODO.md`

- [x] Gravar este documento em `docs/superpowers/plans/2026-08-11-renovacao-sessao-corrida-entre-abas.md` (convenção existente: `2026-08-10-pedidos-vanessa-ux.md`).
- [x] Criar `TODO.md` na raiz com uma seção **Planos abertos** linkando o arquivo acima, e uma linha apontando a seção "Fora de escopo — oportunidades" deste plano.
- [x] **Check:** os dois arquivos existem e o link do `TODO.md` resolve (`ls docs/superpowers/plans/2026-08-11-*.md` e abrir o `TODO.md`).

### Task 1 — Testes vermelhos de `lib/api.ts`

Hoje a cobertura vitest de auth no frontend é **zero**. Criar `packages/frontend/tests/unit/lib/api.refresh.test.ts`.

Infraestrutura de mock:

- `vi.stubGlobal("fetch", fetchMock)` com helper local `resposta(status, corpo?)` devolvendo `{ ok, status, json }` — `lib/api.ts` só consome esses três campos, e o objeto literal deixa o teste declarativo. `vi.unstubAllGlobals()` no `afterEach`.
- **`localStorage` nativo do jsdom**, sem stub — o compare-and-swap depende de leitura/escrita reais, que é justamente o que se quer exercitar. `localStorage.clear()` no `beforeEach`. (O `createLocalStorageMock` de `tests/unit/hooks/use-form-draft.test.ts:43-65` existe porque aquele teste roda lógica pura; **não** copiar aqui.)
- Reset de estado de módulo no `beforeEach`: `setAccessToken(null)`, `setOnAuthFailure(null)`.
- `vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))` — `lib/api.ts` importa `toast` no topo.
- Sem fake timers: o laço mistura `Date.now()` com `setTimeout` e travaria.

| # | `it(...)` | Falha hoje |
|---|---|---|
| 1 | preserva o refresh token quando a renovação falha por erro de rede | ✅ |
| 2 | preserva o refresh token quando a renovação é bloqueada por rate limit (429) | ✅ |
| 3 | preserva o refresh token quando a renovação retorna erro do servidor (500) | ✅ |
| 4 | não sinaliza falha de autenticação quando a renovação está apenas indisponível | ✅ |
| 5 | não apaga o refresh token que outra aba acabou de rotacionar | ✅ |
| 6 | recupera a sessão usando o refresh token rotacionado por outra aba | ✅ |
| 7 | encerra a sessão quando a renovação retorna 400 e o token armazenado não mudou | — (regressão) |
| 8 | encerra a sessão quando não há refresh token armazenado | — (regressão) |
| 9 | limita a duas rotações por renovação mesmo sob disputa contínua entre abas | ✅ |
| 10 | serializa renovações concorrentes da mesma aba num único POST | — (regressão) |
| 11 | não rotaciona de novo quando o access token já foi renovado por outra requisição | ✅ (Task 7) |

Detalhes que importam:

- **#5 e #6** — simular a aba vencedora **sem timers**: o mock do POST executa `localStorage.setItem("louvorflow_refresh_token", "T1")` **antes** de resolver `resposta(400)`. Em #5 o segundo POST também devolve 400 sem alterar o storage → asserção `getRefreshToken() === "T1"`. Em #6 o segundo POST devolve `200 { token: "A1", refresh_token: "T2" }` e o reenvio da requisição original devolve 200 → asserções: `apiFetch` resolve, `getRefreshToken() === "T2"`, `onAuthFailure` não chamado, e `JSON.parse(fetchMock.mock.calls[2][1].body).token === "T1"` (prova que a recuperação usou o token da outra aba).
- **#9** — o mock grava um valor **novo a cada POST** e sempre responde 400. Asserções: `fetch` chamado exatamente 3× (1 original + 2 rotações) e o erro lançado **não** é `ApiError`.
- **#1-#4** — asserção dupla: `expect(erro).not.toBeInstanceOf(ApiError)` e `expect(onAuthFailureSpy).not.toHaveBeenCalled()`.
- **#7** custa ~500 ms reais (passa pela sondagem completa). Aceitável com `testTimeout: 10000`.

- [ ] **Check:** `(cd packages/frontend && npx vitest run tests/unit/lib/api.refresh.test.ts)` — os casos marcados ✅ falham; os marcados "regressão" passam. Nenhum teste pré-existente quebra.

### Task 2 — Classificar transitório × terminal em `lib/api.ts`

Substituir `tryRefreshToken` (linhas 117-159). `clearTokens()` **continua exportada e inalterada** (é o que o `signOut` usa), mas deixa de ser chamada de dentro de `lib/api.ts`.

```typescript
import { RefreshTokenResponseSchema } from "@/schemas/auth";

/** Mensagem única de falha de conectividade, reaproveitada nos pontos de erro de rede. */
const MENSAGEM_ERRO_REDE =
  "Não foi possível conectar ao servidor. Verifique sua rede.";

/**
 * Resultado de uma tentativa de renovação de sessão.
 *
 * - `renovado`: novo access token emitido e refresh token rotacionado.
 * - `sessao-invalida`: a credencial não vale mais; exige novo login.
 * - `indisponivel`: falha transitória (rede, 429, 5xx, disputa entre abas).
 *   A credencial é preservada — jamais tratar como logout.
 */
export type ResultadoRenovacao =
  | { status: "renovado"; token: string }
  | { status: "sessao-invalida" }
  | { status: "indisponivel" };

/** Promise singleton para serializar renovações concorrentes dentro da aba. */
let refreshPromise: Promise<ResultadoRenovacao> | null = null;

/** Status HTTP transitórios do endpoint de renovação (além de 5xx). */
const STATUS_TRANSITORIOS = new Set([408, 425, 429]);

/**
 * Indica se o status HTTP representa falha transitória da renovação.
 *
 * @param status - Código HTTP do `POST /sessions/refresh-token`.
 * @returns `true` quando a falha não invalida a sessão.
 */
function ehFalhaTransitoria(status: number): boolean {
  return status >= 500 || STATUS_TRANSITORIOS.has(status);
}
```

O corpo de `executarRenovacao` entra completo na Task 3 (o CAS e a espera fazem parte do mesmo bloco). Nesta task, entregar a versão sem CAS/espera — classificação + validação Zod + singleton — e o consumo no `apiFetch`:

- **Transitório** (não apaga nada): exceção do `fetch`, HTTP 408/425/429 e ≥ 500, **e também** corpo 200 fora do contrato Zod — o servidor já rotacionou e perdemos o token novo; `indisponivel` é auto-corretivo (a próxima tentativa leva 400 e cai no terminal guardado), enquanto o comportamento atual grava `token: undefined`.
- **Terminal:** demais não-ok.
- No `apiFetch` (bloco 211-234): `renovado` → reenvia; `sessao-invalida` → `onAuthFailure()` + `ApiError(401)`; `indisponivel` → **não** chama `onAuthFailure` e lança `Error` simples com `MENSAGEM_ERRO_REDE`.
- **Por que `Error` simples e não `ApiError(…, 401)`:** nenhum consumidor fora de `lib/api.ts` inspeciona `ApiError.status` (verificado por grep — as demais ocorrências de `.status` são `igreja.status` / `invite.status`), e "Sessão expirada. Faça login novamente." é literalmente falso num 429/500 — além de ser a isca para código futuro reintroduzir exatamente esta classe de bug. O `retry: 1` do QueryClient (`packages/frontend/src/App.tsx:51-58`) ainda dá uma segunda chance, o que é desejável.
- Extrair as duas ocorrências literais da mensagem de rede (linhas 200 e 221) para `MENSAGEM_ERRO_REDE` — único ponto de DRY, em linhas que já estão sendo tocadas.
- O comentário das linhas 203-210 (guarda `&& accessToken`) **continua correto**; não mexer.
- O objeto de resultado é entregue **por referência** a N chamadores do singleton: nunca mutá-lo.

- [ ] **Check:** casos 1-4 e 8, 10 verdes; 5, 6, 7, 9 ainda podem falhar (dependem da Task 3). Lint + typecheck limpos.

### Task 3 — Compare-and-swap, espera curta e recuperação no lugar

Completa `executarRenovacao`:

```typescript
/** Máximo de POSTs de rotação por renovação: a tentativa inicial + uma recuperação. */
const MAX_TENTATIVAS_ROTACAO = 2;

/** Janela máxima de espera (ms) pela rotação vinda de outra aba. */
const ESPERA_ROTACAO_MS = 500;

/** Intervalo (ms) de sondagem do localStorage durante a espera pela outra aba. */
const INTERVALO_SONDAGEM_MS = 50;

/**
 * Remove o refresh token do localStorage somente se o valor armazenado ainda for
 * o token que acabamos de tentar (compare-and-swap).
 *
 * O `localStorage` é compartilhado entre abas: se outra aba já rotacionou a
 * credencial, o valor atual é bom e apagá-lo derrubaria uma sessão válida.
 *
 * @param tokenEsperado - Refresh token usado na tentativa que falhou.
 * @remarks `getItem` + `removeItem` não são atômicos entre abas; resta uma janela
 *   de sub-microssegundo em que uma gravação concorrente pode ser perdida.
 */
function removerRefreshTokenSe(tokenEsperado: string): void {
  if (localStorage.getItem(REFRESH_TOKEN_KEY) === tokenEsperado) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Aguarda, por uma janela curta e limitada, que outra aba grave um refresh token
 * diferente do que acabamos de tentar.
 *
 * O backend serializa a rotação: a aba perdedora recebe 400 depois do commit da
 * vencedora, mas possivelmente antes de a vencedora persistir o token novo. Sem
 * essa espera, a perdedora declararia a sessão inválida por engano.
 *
 * @param tokenTentado - Refresh token usado na tentativa que falhou.
 * @returns Valor armazenado ao fim da espera (`null` se a chave foi removida).
 */
async function aguardarRotacaoDeOutraAba(
  tokenTentado: string,
): Promise<string | null> {
  const limite = Date.now() + ESPERA_ROTACAO_MS;
  let atual = getRefreshToken();

  while (atual === tokenTentado && Date.now() < limite) {
    await new Promise((resolve) => setTimeout(resolve, INTERVALO_SONDAGEM_MS));
    atual = getRefreshToken();
  }

  return atual;
}

/**
 * Executa a renovação da sessão, distinguindo falha transitória de terminal.
 *
 * Faz no máximo {@link MAX_TENTATIVAS_ROTACAO} POSTs: a segunda tentativa só
 * ocorre quando outra aba rotacionou a credencial no intervalo — nesse caso o
 * token novo é reaproveitado em vez de a sessão ser descartada.
 *
 * @returns Resultado discriminado da renovação.
 */
async function executarRenovacao(): Promise<ResultadoRenovacao> {
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS_ROTACAO; tentativa++) {
    const tokenTentado = getRefreshToken();
    if (!tokenTentado) return { status: "sessao-invalida" };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/sessions/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenTentado }),
      });
    } catch {
      /** Falha de rede não diz nada sobre a validade da credencial. */
      return { status: "indisponivel" };
    }

    if (response.ok) {
      try {
        const dados = RefreshTokenResponseSchema.parse(await response.json());
        setAccessToken(dados.token);
        setRefreshToken(dados.refresh_token);
        return { status: "renovado", token: dados.token };
      } catch {
        /**
         * Corpo fora do contrato num 200: o servidor rotacionou, mas não sabemos
         * o token novo. Não destruímos nada — a próxima tentativa receberá 400 e
         * o caminho terminal guardado encerra a sessão corretamente.
         */
        return { status: "indisponivel" };
      }
    }

    if (ehFalhaTransitoria(response.status)) {
      return { status: "indisponivel" };
    }

    const armazenado = await aguardarRotacaoDeOutraAba(tokenTentado);

    if (armazenado === null || armazenado === tokenTentado) {
      /** Ninguém rotacionou: a credencial é realmente inválida. */
      removerRefreshTokenSe(tokenTentado);
      setAccessToken(null);
      return { status: "sessao-invalida" };
    }
    /** Outra aba rotacionou: repete o laço com a credencial nova. */
  }

  /**
   * Disputa persistente (3+ abas). O storage contém um token vivo de outra aba —
   * tratar como indisponível preserva a sessão e deixa a próxima requisição tentar.
   */
  return { status: "indisponivel" };
}

/**
 * Renova a sessão a partir do refresh token compartilhado entre abas.
 *
 * Serializa chamadas concorrentes da mesma aba num único POST (singleton promise).
 * É o único ponto do frontend autorizado a rotacionar a credencial.
 *
 * @returns Resultado discriminado da renovação.
 */
export function renovarSessao(): Promise<ResultadoRenovacao> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = executarRenovacao().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
```

- [ ] **Check:** casos 1-10 verdes. `it` #9 confirma exatamente 3 chamadas de `fetch`.

### Task 4 — `onAuthFailure` sai do `localStorage`

Em `packages/frontend/src/contexts/AuthContext.tsx:167-182`:

```typescript
  useEffect(() => {
    /**
     * Falha de autenticação encerra a sessão **desta aba**.
     *
     * Não remove nada do `localStorage`: o refresh token e a lista de tenants são
     * compartilhados entre abas, e outra aba pode ter acabado de rotacionar a
     * credencial. A remoção do refresh token pertence ao `signOut` explícito e ao
     * caminho terminal guardado de `lib/api`; a lista de tenants não é credencial
     * e é sobrescrita no próximo login.
     *
     * É idempotente: pode ser invocada por várias requisições que falhem juntas.
     */
    setOnAuthFailure(() => {
      setAccessToken(null);
      sessionStorage.removeItem("selection_token");
      clearScrollPositions();
      setUser(null);
      setCurrentTenant(null);
      setAvailableTenants([]);
      queryClient.clear();
    });

    return () => {
      setOnAuthFailure(null);
    };
  }, [queryClient]);
```

`signOut` (linhas 146-160) **não muda** — continua com `clearTokens()` e `removeItem(TENANTS_STORAGE_KEY)`.

- [ ] **Check:** suíte inteira verde; o caso #4 de `AuthContext.init.test.tsx` (Task 5) cobre esta task.

### Task 5 — `initAuth` consome o mesmo caminho

Testes primeiro. Criar `packages/frontend/tests/unit/contexts/AuthContext.init.test.tsx`:

```tsx
/** Envolve o AuthProvider com os provedores que ele exige (Router + React Query). */
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
```

`vi.mock("@/services/auth", …)` devolvendo `getProfile` como `vi.fn()` e stubs para `login`, `logout`, `switchTenant`, `selectTenant` (a fábrica substitui o módulo inteiro). **Não mockar `@/lib/api`** — queremos o `localStorage` e o `renovarSessao` reais, com o POST controlado pelo `fetch` stubado. Dirigir com `renderHook(() => useAuth(), { wrapper: Wrapper })` + `await waitFor(() => expect(result.current.isLoading).toBe(false))`.

| # | `it(...)` | Falha hoje |
|---|---|---|
| 1 | mantém o refresh token quando o carregamento do perfil falha após a renovação | ✅ |
| 2 | mantém o refresh token quando a renovação falha por rede na inicialização | ✅ |
| 3 | descarta o refresh token quando a renovação é rejeitada com 400 na inicialização | — (regressão) |
| 4 | encerra a sessão da aba sem remover a lista de tenants compartilhada | ✅ |

- **#1** — storage `T0`; POST → `200 { token: "A1", refresh_token: "T1" }`; `getProfile` rejeita. Asserções: `getRefreshToken() === "T1"`, `result.current.user === null`, `isLoading === false`.
- **#2** — `fetch` rejeita. Com o retry desta task, `fetch` é chamado 2× e o teste custa ~800 ms. Asserção: `getRefreshToken() === "T0"`.
- **#4** — depois do mount bem-sucedido: semear `localStorage["louvorflow_user_tenants"]`, remover o refresh token (`setRefreshToken(null)`), manter o access token em memória e chamar um `apiFetch` cujo `fetch` devolve 401. `renovarSessao` retorna `sessao-invalida` imediatamente (sem POST) → `onAuthFailure` dispara. Asserções: `result.current.user === null` **e** `localStorage.getItem("louvorflow_user_tenants") !== null`.

Implementação em `AuthContext.tsx:189-214`:

```typescript
/** Espera antes da segunda tentativa de renovação na abertura do app (ms). */
const ATRASO_NOVA_TENTATIVA_MS = 800;
```

```typescript
  useEffect(() => {
    /**
     * Restaura a sessão a partir do refresh token persistido.
     *
     * Renovação e carga de perfil são tratadas separadamente: uma falha ao buscar
     * o perfil NUNCA descarta o refresh token recém-rotacionado, e uma falha
     * transitória de renovação preserva a credencial para a próxima tentativa.
     */
    async function initAuth() {
      if (!getRefreshToken()) {
        setIsLoading(false);
        return;
      }

      let renovacao = await renovarSessao();

      /** Blip de rede na abertura do app é rotina em mobile: uma nova tentativa curta. */
      if (renovacao.status === "indisponivel") {
        await new Promise((resolve) =>
          setTimeout(resolve, ATRASO_NOVA_TENTATIVA_MS),
        );
        renovacao = await renovarSessao();
      }

      if (renovacao.status !== "renovado") {
        if (renovacao.status === "indisponivel") {
          toast.error("Não foi possível restaurar sua sessão.", {
            description: "Verifique sua conexão e entre novamente.",
          });
        }
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
        setCurrentTenant(profile.tenant ?? null);
      } catch {
        /** Perfil indisponível não invalida a credencial — apenas não autentica esta aba. */
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);
```

`renovarSessao` já persiste access + refresh tokens, então as chamadas `setAccessToken`/`setRefreshToken` do `initAuth` somem (DRY). Ajustar imports: sai `refreshToken as refreshTokenService`, entra `renovarSessao` de `@/lib/api`; `clearTokens`, `setAccessToken`, `setRefreshToken` e `getRefreshToken` continuam (usados por `signOut`, `signIn`, `completeTenantLogin`, `switchTenant`).

**Rejeitado — manter `isLoading` na falha transitória:** o `ProtectedRoute` (linhas 28-34) renderiza spinner sem saída enquanto `isLoading`, prendendo o usuário num spinner eterno sem sequer alcançar o `/login`. Troca um bug por um pior.

- [ ] **Check:** os 4 casos verdes; suíte inteira verde; lint + typecheck limpos.

### Task 6 — Remover a função órfã

`refreshToken` em `packages/frontend/src/services/auth.ts:50-72` fica sem chamadores (hoje tem exatamente um: `AuthContext.tsx:199`). É código morto criado pela própria mudança (Seiri do 5S), não refatoração oportunista — remoção autorizada pelo usuário na sessão de planejamento.

- [ ] Confirmar antes: `grep -rn "refreshToken" packages/frontend/src packages/frontend/tests`.
- [ ] Remover a função e os imports que ficarem órfãos. `RefreshTokenResponseSchema` **continua vivo** — passa a ser consumido por `lib/api.ts`.
- [ ] **Check:** typecheck limpo; suíte verde; o grep não retorna mais chamador algum.

### Task 7 — Evitar a rotação redundante

Requisições que já estavam em voo com o access token velho chegam ao 401 **depois** de o refresh ter terminado, encontram `refreshPromise === null` e disparam uma rotação nova e desnecessária — pressão gratuita no rate limit de 60/15 min, que é ele próprio um dos gatilhos do problema original.

Em `apiFetch`: capturar o token usado antes do primeiro `doFetch` e, no ramo 401, reenviar uma vez com o token atual **sem POST de rotação** quando ele já mudou:

```typescript
  const tokenUsado = accessToken;
  let response: Response;

  try {
    response = await doFetch(tokenUsado);
  } catch {
    throw new Error(MENSAGEM_ERRO_REDE);
  }

  if (response.status === 401 && tokenUsado) {
    /**
     * Outra requisição já renovou a sessão enquanto esta estava em voo:
     * reenvia com o token atual em vez de rotacionar de novo (a rotação é de
     * uso único e o endpoint tem rate limit).
     */
    if (accessToken && accessToken !== tokenUsado) {
      try {
        response = await doFetch(accessToken);
      } catch {
        throw new Error(MENSAGEM_ERRO_REDE);
      }
    }

    if (response.status === 401) {
      // …bloco da Task 2: renovarSessao() + tratamento dos três resultados
    }
  }
```

A guarda passa de `&& accessToken` para `&& tokenUsado`, preservando a intenção original (só renovar quando **esta** requisição foi autenticada) — o comentário das linhas 203-210 segue válido.

- [ ] **Check:** caso #11 verde; #9 continua com exatamente 3 chamadas de `fetch`.

### Task 8 — Documentação e padronização (SDCA)

- [ ] `.claude/rules/frontend-react.md:75` — o bullet **Auto-refresh** fica factualmente errado em duas afirmações: *"evita race conditions com token rotation"* (o singleton só serializa dentro da aba; a corrida entre abas nunca foi coberta) e *"se refresh falha, limpa tokens e redireciona ao login"*. Reescrever cobrindo classificação transitório × terminal, limpeza por compare-and-swap, recuperação com o token rotacionado por outra aba e o novo contrato de `onAuthFailure`.
- [ ] `.claude/rules/frontend-react.md:74` (**Token storage**) — acrescentar o invariante da seção "Contexto". É a regra que impede a reintrodução do bug.
- [ ] `.claude/rules/frontend-react.md:67` — comentário de `api.ts` na árvore de arquivos: "auto-refresh com classificação transitória/terminal".
- [ ] Cabeçalho JSDoc de `packages/frontend/src/lib/api.ts` (linhas 1-10) e de `packages/frontend/src/contexts/AuthContext.tsx` (linhas 1-14): enunciar o invariante de propriedade da credencial e as limitações conhecidas.
- [ ] `KAIZEN_LOG.md` — entrada no formato das existentes: Antes/Depois, **Padronizado em**, tabela de incrementos com verificação, desperdícios evitados, oportunidades levantadas e "o que aprendemos". **Abrir cada arquivo citado em "Padronizado em" e conferir antes de listar** — se ainda não foi feito, escrever "pendente".
- [ ] Atualizar o `TODO.md` da Task 0: marcar o plano como concluído e mover as oportunidades para a seção de backlog.
- [ ] **Check:** `grep -n "limpa tokens" .claude/rules/frontend-react.md` não retorna mais o trecho antigo; markdown-lint sem MD040.

---

## Verificação end-to-end

**Automatizada** (após cada task):

```bash
(cd packages/frontend && npx vitest run)
(cd packages/frontend && npm run lint && npm run typecheck)
```

**Smoke manual — a corrida (o defeito relatado)**, com backend + frontend no ar:

1. Fazer login. Abrir a mesma URL em duas abas.
2. Recarregar as duas quase ao mesmo tempo (ambas rodam `initAuth` e disputam a rotação).
3. **Esperado:** as duas continuam autenticadas; `localStorage.louvorflow_refresh_token` presente e não vazio; nenhuma foi para `/login`. Na aba perdedora, a aba Network mostra o segundo POST de rotação carregando o token que a vencedora gravou.

**Smoke manual — falha transitória:**

1. Com a app aberta e autenticada, marcar *Offline* no DevTools e disparar uma ação que chame a API.
2. **Esperado:** erro de conectividade, usuário **continua logado**, refresh token intacto no storage. Voltar para *Online* e repetir a ação: funciona sem novo login.
3. Repetir com o backend parado (500). Se der para provocar 429 no `/sessions/refresh-token`, conferir que também preserva a sessão.

**Mobile (`CLAUDE.md`):** o ciclo não cria componente de UI novo — a única superfície visível é o `toast.error` do `initAuth`, via Sonner, já usado no app. Conferir mesmo assim a **360 px** que o toast não estoura a largura nem corta texto, e a 1024 px.

---

## Fora de escopo — oportunidades para o `KAIZEN_LOG.md` / `TODO.md`

- **`BroadcastChannel`** para acordar as abas irmãs quando uma renova ou desloga. Melhor candidato ao próximo ciclo: existe no jsdom (testável) e resolve dois problemas que este conserto **não** resolve (ver limitações 1 e 2).
- **Web Locks (`navigator.locks`)** — o mutex correto entre abas, mas troca o modelo de concorrência do caminho inteiro e não existe no jsdom (o teste viraria ficção). Com CAS + recuperação, a corrida já deixa de ser evento.
- **Backend — reuse detection / janela de graça**: aceitar token rotacionado há < N s devolvendo o par corrente, ou encadear `replaced_by` e revogar a família em caso de reuso. É o conserto de raiz e a defesa correta contra roubo de token; exige migração de schema.
- **Backend — `codigo` estruturado no `/sessions/refresh-token`**: hoje o mesmo 400 cobre "já rotacionado por outra aba" (recuperável) e "expirado/malformado" (terminal). É essa ambiguidade que obriga a heurística CAS + espera.
- **Cooldown de 429 com `Retry-After`** — só com evidência de que insistir alimenta o rate limit.
- **`expires_date` de `users_refresh_tokens` é escrito e nunca lido** (`packages/backend/prisma/schema.prisma:376-388`), e não há limpeza de linhas expiradas: a tabela cresce indefinidamente.
- **`createLocalStorageMock` duplicado** em `tests/unit/hooks/use-form-draft.test.ts:43-65` — convergir para um helper compartilhado quando houver um terceiro consumidor.

## Limitações conhecidas assumidas conscientemente

Documentar nos JSDoc (Task 8), não consertar aqui:

1. **Divergência de tenant entre abas:** a aba A troca de igreja e grava um refresh token do tenant X; a aba B (UI do tenant Y) renova lendo o storage compartilhado e recebe um access token de X. Já é possível hoje; a recuperação da Task 3 cria um caminho novo até lá. Mitigação real = `BroadcastChannel`.
2. **`switchTenant` concorrente com renovação** pode ter seus tokens sobrescritos (não há contador de geração). Pré-existente.
3. **Janela sub-microssegundo** entre `getItem` e `removeItem` no compare-and-swap.
4. Se a rede da aba vencedora for muito lenta, os 500 ms podem não bastar e a perdedora ainda cai para `/login` — mas a **credencial sobrevive** e um reload restaura.
5. O 401 que persiste **após** uma renovação bem-sucedida (ex.: usuário removido do tenant) deixa o refresh token no storage: cada abertura da app queima uma rotação até o próximo login. Bounded e raro.
6. **Custos de latência:** +500 ms no encerramento genuíno de sessão; +800 ms na abertura quando a rede está fora. Ambos limitados e uma vez por evento.
