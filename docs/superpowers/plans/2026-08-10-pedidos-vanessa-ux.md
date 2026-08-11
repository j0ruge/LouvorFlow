# Pedidos da Vanessa (UX Mobile + Ordem Alfabética) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Revisão 2 (2026-08-10)

A revisão 1 foi escrita em outra máquina e **não é executável neste ambiente**. Esta revisão corrige isso e incorpora as decisões tomadas na sessão de grill + kaizen. Os números de task citados no `2026-08-10-pedidos-vanessa-ux-grill.md` referem-se à **revisão 1** — a tabela de equivalência está em "Notas de Execução".

Decisões desta revisão:

1. **Caminhos relativos.** Todo comando roda a partir da raiz do repo; `cd` só dentro de subshell — `(cd packages/frontend && …)`. Nenhum caminho absoluto de máquina no plano.
2. **Task 0 da rev. 1 removida.** O `import React` em `MusicaDetail.cifraclub-edit.test.tsx` era desnecessário: a suíte está **verde** neste ambiente (194 passed / 0 failed) porque `vite.config.ts:21` usa `@vitejs/plugin-react-swc`, com JSX runtime automático.
3. **Helper de overflow extraído** para `tests/e2e/helpers/viewport.ts` em vez de duplicado — refactor pontual autorizado explicitamente (exigência do `CLAUDE.md`).
4. **Vocabulário.** O texto visível do drawer usa **"intensidade"**; o `aria-label="Filtrar por intensidade (tempo)"` fica intacto (o e2e depende da string exata).
5. **`typecheck` do frontend criado neste pool**, cobrindo `src` **e** `tests`.
6. **`musicas.spec.ts` passa a autenticar** — sem isso o gate "e2e PASS" era inatingível.
7. **Escopo da ordenação**: só categorias e artistas.
8. **Uma entrada única no `KAIZEN_LOG.md`**, na task final.
9. **`.claude/rules/dev-workflow.md:44-45` corrigido** — a regra fixava um caminho de máquina em arquivo versionado, causa raiz do problema nº 1.

**Goal:** No mobile, colapsar os chips de filtro da página de Músicas atrás de um botão "Filtros" (bottom-sheet), deixando a busca por texto como protagonista; e garantir ordem alfabética pt-BR nas listagens de categorias e artistas.

**Architecture:** Problema 1 — os chips de intensidade + categorias (hoje sempre visíveis em `Songs.tsx`, `flex-wrap` — 3 chips de intensidade + todas as categorias do tenant: 9 no seed padrão, mais as criadas pela igreja) são extraídos para um componente `MusicaFiltros.tsx` com dois modos: chips inline no desktop (`hidden sm:block`, comportamento atual preservado) e `Drawer` bottom-sheet no mobile atrás de um botão com contador de filtros ativos (regra nº 8 de `.claude/rules/frontend-react.md` e seção "Overlay Pattern" de `packages/frontend/.interface-design/system.md`: overlay para filtros, nunca conteúdo inline que desloca a lista). A alternância mobile/desktop é por CSS (`sm:hidden`/`hidden sm:block`), não por `useIsMobile()` como na referência `DateTimePicker.tsx` — decisão deliberada: aqui o desktop não usa overlay (chips inline), então não há troca Drawer↔Popover a fazer em JS; o CSS evita flash de primeira renderização do hook e o conteúdo do drawer só monta quando aberto (sem duplicação na árvore de acessibilidade). Problema 2 — `categorias.repository.findAll()` e `artistas.repository.findAll()` não têm ordenação (causa raiz confirmada); a ordenação entra **no service** com `Intl.Collator('pt-BR')` — determinística, imune ao collation do banco e testável com os fakes existentes. Músicas **não mudam**: já ordenam no banco (`musicas.repository.ts:40`, `orderBy: { nome: 'asc' }`) e o collation do banco de dev (`en_US.utf8`, container `louvorflow_db`) foi verificado em 2026-08-10 ordenando acentos junto da letra-base (`Abertura, Adoração, Ágape, água, Zelo`).

**Tech Stack:** React 18 + shadcn/ui (`Drawer`/vaul, `Badge`) + TanStack Query 5 + Playwright (frontend); Express 5 + Prisma 6 + Vitest com fake repositories (backend).

## Global Constraints

- **Mobile-first inviolável**: target primário Galaxy S8 (360×740). Nenhuma task de frontend está completa sem verificação em viewport 360px (sem overflow horizontal, sem largura fixa sem breakpoint, sem texto cortado) e 1024px.
- **Docstrings JSDoc em PT-BR** em TODO código novo ou modificado — incluindo callbacks de teste (`it`, `describe`), handlers e utilitários.
- **Não refatorar** além do escopo destes 2 problemas (regra do `CLAUDE.md`). Exceção autorizada nesta revisão: a extração do helper de viewport (Task 2).
- **Elegância**: preferir overlay (Drawer) a deslocamento de conteúdo; consultar `packages/frontend/.interface-design/system.md`.
- **openapi.json sincronizado**: mudança de contrato (ordenação garantida) documentada em `packages/backend/docs/openapi.json`.
- **Caminhos relativos, sempre a partir da raiz do repo.** Comandos de package rodam em subshell para o CWD não vazar entre passos: `(cd packages/frontend && npm run test)`. Comandos `git` rodam da raiz com caminho relativo: `git add packages/frontend/src/...`. **Nunca** usar caminho absoluto de máquina — foi o que inutilizou a revisão 1.
- **Gate de tipos do frontend**: não existe antes da Task 1. A partir dela, os gates de frontend são `npm run test && npm run lint && npm run typecheck`. O backend já tem `npm run typecheck`.
- **Markdown**: todo fenced code block com identificador de linguagem (MD040).
- Componentes `ui/` do shadcn **não** são modificados; wrappers ficam em `components/`.

---

## File Structure

**Bloco de destravamento (Tasks 0-2):**

- Modify: `packages/frontend/tests/e2e/musicas.spec.ts` — autenticação (`loginAsAdmin`), destrava o gate e2e desktop.
- Create: `packages/frontend/src/types/jest-dom.d.ts` — augmentation de tipos dos matchers do jest-dom.
- Modify: `packages/frontend/tsconfig.app.json` — `include` passa a cobrir `tests`.
- Modify: `packages/frontend/package.json` — script `typecheck`.
- Create: `packages/frontend/tests/e2e/helpers/viewport.ts` — `expectSemOverflowHorizontal` compartilhado.
- Modify: `packages/frontend/tests/e2e/admin-igrejas.mobile.spec.ts` — passa a importar o helper.

**Problema 1 (frontend):**

- Create: `packages/frontend/src/components/MusicaFiltros.tsx` — chips compartilhados (`MusicaFiltrosChips`) + drawer mobile (`MusicaFiltrosDrawer`).
- Create: `packages/frontend/src/components/__tests__/MusicaFiltros.test.tsx` — testes unitários.
- Modify: `packages/frontend/src/pages/Songs.tsx` — busca + botão Filtros (mobile) / chips inline (desktop); handler `limparFiltros`.
- Create: `packages/frontend/tests/e2e/musicas-filtros.mobile.spec.ts` — e2e mobile (360×740).
- Modify: `.claude/rules/frontend-react.md` — referência do novo padrão + tabela de páginas corrigidas.

**Problema 2 (backend):**

- Create: `packages/backend/src/utils/ordenacao.ts` — `compararNomesPtBr` (Intl.Collator pt-BR).
- Modify: `packages/backend/src/services/categorias.service.ts` — `listAll` ordenado.
- Modify: `packages/backend/src/services/artistas.service.ts` — `listAll` ordenado.
- Modify: `packages/backend/tests/services/categorias.service.test.ts` — caso de ordenação.
- Modify: `packages/backend/tests/services/artistas.service.test.ts` — caso de ordenação.
- Modify: `packages/backend/docs/openapi.json` — descriptions/examples de `GET /categorias` e `GET /artistas`.
- Modify: `.claude/rules/backend-api.md` — diretório `utils/` + convenção de ordenação.

**Fechamento:**

- Modify: `KAIZEN_LOG.md` — entrada única do ciclo.
- Modify: `.claude/rules/dev-workflow.md` — regra de caminho corrigida.

**Sem mudança (verificado, não mexer):** `musicas.repository.ts` (já ordena), `use-categorias.ts`/`use-artistas.ts` (herdam a ordem do backend — beneficia `Settings.tsx`, `MusicaForm`, `VersaoForm`, `MusicaDetail` automaticamente), `categorias.repository.ts`/`artistas.repository.ts` (ordenação mora no service).

---

## Task 0: Destravar o gate e2e — autenticar `musicas.spec.ts`

**Files:**

- Modify: `packages/frontend/tests/e2e/musicas.spec.ts`

**Contexto (verificado em 2026-08-10):** o spec navega direto para `/musicas` sem autenticar. Com `ProtectedRoute`, ele é redirecionado ao login e falha — a suíte desktop está **vermelha por construção**, e o `KAIZEN_LOG.md` já registra isso ("8 dos 10 specs E2E não autenticam"). Sem este conserto, os gates e2e das Tasks 5 e 8 seriam impossíveis de satisfazer. O padrão a copiar é o de `configuracoes.spec.ts:11-15`.

- [ ] **Step 1: Registrar a baseline (antes de mexer)**

```bash
(cd packages/frontend && npx playwright test --project=chromium musicas.spec.ts)
```

Anotar quantos testes falham e com que erro. Serve de "antes" para o Check e para a entrada do `KAIZEN_LOG.md`.

- [ ] **Step 2: Adicionar a autenticação**

Em `packages/frontend/tests/e2e/musicas.spec.ts`, adicionar o import junto do `@playwright/test`:

```typescript
import { loginAsAdmin } from "./helpers/login";
```

E inserir como primeiro filho do `test.describe("Músicas", …)`:

```typescript
  /** Autentica antes de cada teste — `/musicas` é rota protegida. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });
```

- [ ] **Step 3: Rodar — deve PASSAR**

```bash
(cd packages/frontend && npx playwright test --project=chromium musicas.spec.ts)
```

Expected: todos os testes PASS (exige backend + frontend no ar). **Jidoka**: se algum teste continuar vermelho por motivo alheio à autenticação (locator desatualizado, dado de seed ausente), PARAR e reportar — é outro pool, e consertá-lo aqui contamina o escopo da Vanessa.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/tests/e2e/musicas.spec.ts
git commit -m "test(e2e): autentica spec de musicas para destravar o gate desktop"
```

---

## Task 1: Gate de tipos do frontend

**Files:**

- Create: `packages/frontend/src/types/jest-dom.d.ts`
- Modify: `packages/frontend/tsconfig.app.json`
- Modify: `packages/frontend/package.json`

**Contexto (medido em 2026-08-10):** o frontend não tem **nenhum** gate de tipos — Vite/esbuild não checa e o ESLint não tem regras type-aware. `npx tsc -p tsconfig.app.json --noEmit` acusa **15 erros, todos `TS2339`, todos a mesma causa**: os matchers do jest-dom (`toBeInTheDocument`, `toHaveAttribute`) não estão augmentados no `Assertion` do vitest. Estão em `CifraclubPlaylistDialog.test.tsx` (6), `IntensidadeSelector.test.tsx` (5) e `ResponsiveFormDialog.test.tsx` (4). A causa é `tests/setup.ts:10-13`, que faz `expect.extend(matchers)` — correto em runtime (194 testes verdes), invisível para o TypeScript.

**Interfaces:**

- Produces: script `npm run typecheck` no frontend, consumido como gate pelas Tasks 3, 4 e 8.

- [ ] **Step 1: Medir o passivo real de `tests/` (antes de decidir)**

```bash
(cd packages/frontend && npx tsc -p tsconfig.app.json --noEmit 2>&1 | tail -30)
```

Anotar os 15 erros conhecidos. Depois aplicar o Step 2 e **repetir a medição** — a expansão do `include` para `tests/` traz 24 arquivos novos (11 specs e2e, `helpers/login.ts`, `setup.ts`, 11 unitários).

**Jidoka — stop-condition explícita:** se a expansão revelar erros de causa-raiz **diferente** do jest-dom (tipos do Playwright, `strictNullChecks` nos specs antigos) em volume que estoure o escopo deste pool, **PARAR e reportar ao JorUge** em vez de sair consertando. A decisão de absorver ou adiar é dele.

- [ ] **Step 2: Criar a augmentation de tipos**

Criar `packages/frontend/src/types/jest-dom.d.ts`:

```typescript
/**
 * Augmentation de tipos dos matchers do `@testing-library/jest-dom`.
 *
 * O `tests/setup.ts` registra os matchers em runtime via `expect.extend`, o que
 * funciona mas não informa nada ao TypeScript — daí os erros `TS2339` em
 * `toBeInTheDocument`/`toHaveAttribute`. Este import é só de tipos (sem efeito
 * em runtime) e estende a interface `Assertion` do vitest para toda a suíte.
 */

import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Ampliar o `include` e criar o script**

Em `packages/frontend/tsconfig.app.json`, trocar:

```json
  "include": ["src"]
```

por:

```json
  "include": ["src", "tests"]
```

Em `packages/frontend/package.json`, adicionar ao bloco `scripts`, logo após `"lint"`:

```json
    "typecheck": "tsc -p tsconfig.app.json --noEmit",
```

- [ ] **Step 4: Rodar — deve sair com 0 erros**

```bash
(cd packages/frontend && npm run typecheck)
```

Expected: saída vazia, exit code 0.

- [ ] **Step 5: Confirmar que nada quebrou em runtime**

```bash
(cd packages/frontend && npm run test && npm run lint)
```

Expected: 194 testes PASS, lint limpo.

- [ ] **Step 6: Commit**

```bash
git add packages/frontend/src/types/jest-dom.d.ts packages/frontend/tsconfig.app.json packages/frontend/package.json
git commit -m "chore(frontend): gate de tipos com typecheck cobrindo src e tests"
```

---

## Task 2: Extrair o helper de viewport dos e2e

**Files:**

- Create: `packages/frontend/tests/e2e/helpers/viewport.ts`
- Modify: `packages/frontend/tests/e2e/admin-igrejas.mobile.spec.ts`

**Contexto:** `admin-igrejas.mobile.spec.ts:21-31` já contém `expectSemOverflowHorizontal`. O spec da Task 5 precisa da mesma checagem; duplicá-lo criaria duas cópias literais. A extração é o refactor pontual autorizado nesta revisão.

**Interfaces:**

- Produces: `expectSemOverflowHorizontal(page: Page): Promise<void>` em `tests/e2e/helpers/viewport.ts`, consumido por `admin-igrejas.mobile.spec.ts` e (Task 5) `musicas-filtros.mobile.spec.ts`.

- [ ] **Step 1: Criar o helper**

Criar `packages/frontend/tests/e2e/helpers/viewport.ts` movendo o corpo existente **sem alterá-lo**:

```typescript
/**
 * Helpers de viewport para os testes E2E.
 *
 * Centraliza as checagens objetivas da regra mobile-first do projeto, usadas
 * por todos os specs `*.mobile.spec.ts`.
 */

import { expect, type Page } from "@playwright/test";

/**
 * Verifica que a página não transborda horizontalmente no viewport atual.
 *
 * A regra mobile do projeto proíbe depender de scroll horizontal; esta é a
 * checagem objetiva equivalente. Tolera 1px de arredondamento de layout.
 *
 * @param page - Instância da página do Playwright.
 */
export async function expectSemOverflowHorizontal(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    scrollWidth,
    `página transborda ${scrollWidth - clientWidth}px além do viewport de ${clientWidth}px`,
  ).toBeLessThanOrEqual(clientWidth + 1);
}
```

- [ ] **Step 2: Consumir no spec existente**

Em `packages/frontend/tests/e2e/admin-igrejas.mobile.spec.ts`: remover a função local (linhas 13-31, incluindo a docstring) e adicionar o import após o de `loginAsAdmin`:

```typescript
import { expectSemOverflowHorizontal } from "./helpers/viewport";
```

Se o `type Page` deixar de ser usado no spec, remover também da lista de imports do `@playwright/test`.

- [ ] **Step 3: Rodar — comportamento idêntico**

```bash
(cd packages/frontend && npx playwright test --project=mobile admin-igrejas)
(cd packages/frontend && npm run typecheck)
```

Expected: mesmos testes PASS de antes (refactor puro, zero mudança de comportamento); typecheck limpo.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/tests/e2e/helpers/viewport.ts packages/frontend/tests/e2e/admin-igrejas.mobile.spec.ts
git commit -m "refactor(e2e): extrai expectSemOverflowHorizontal para helper compartilhado"
```

---

## Task 3: Frontend — componente `MusicaFiltros` (chips + drawer)

**Files:**

- Create: `packages/frontend/src/components/MusicaFiltros.tsx`
- Test: `packages/frontend/src/components/__tests__/MusicaFiltros.test.tsx`

**Interfaces:**

- Consumes: `INTENSIDADE_OPTIONS`, `type Intensidade` (`@/components/intensidade-options`); `IntensityBars` (`@/components/IntensidadeSelector`); `handleClickableKeyDown` (`@/lib/utils`); `Drawer`/`Badge`/`Button` (shadcn `ui/`).
- Produces: `MusicaFiltrosChips(props: MusicaFiltrosProps)` e `MusicaFiltrosDrawer(props: MusicaFiltrosDrawerProps)`, com:

```typescript
export interface MusicaFiltrosProps {
  categorias: { id: string; nome: string }[];
  categoriaIds: string[];
  intensidades: Intensidade[];
  onToggleCategoria: (id: string) => void;
  onToggleIntensidade: (value: Intensidade) => void;
}
export interface MusicaFiltrosDrawerProps extends MusicaFiltrosProps {
  onLimpar: () => void;
}
```

- [ ] **Step 1: Escrever os testes (falhando)**

Criar `packages/frontend/src/components/__tests__/MusicaFiltros.test.tsx`:

```tsx
/**
 * Testes do `MusicaFiltros` — filtros da página de Músicas.
 *
 * Cobre o subcomponente compartilhado `MusicaFiltrosChips` (renderização dos
 * chips de intensidade e categorias, estado ativo via `aria-pressed`,
 * callbacks de toggle) e o `MusicaFiltrosDrawer` mobile (abertura do
 * bottom-sheet pelo botão "Filtros", contador de filtros ativos e a ação
 * "Limpar filtros").
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MusicaFiltrosChips,
  MusicaFiltrosDrawer,
} from "@/components/MusicaFiltros";
import type { Intensidade } from "@/components/intensidade-options";

/** Categorias de exemplo usadas nos testes. */
const CATEGORIAS = [
  { id: "cat-1", nome: "Adoração" },
  { id: "cat-2", nome: "Celebração" },
];

/** Props base sem nenhum filtro ativo. */
const baseProps = {
  categorias: CATEGORIAS,
  categoriaIds: [] as string[],
  intensidades: [] as Intensidade[],
  onToggleCategoria: () => {},
  onToggleIntensidade: () => {},
};

/** Suíte do subcomponente de chips compartilhado (inline no desktop e dentro do drawer). */
describe("MusicaFiltrosChips", () => {
  /** Renderiza um chip por intensidade e por categoria. */
  it("renderiza chips de intensidade e de categorias", () => {
    render(<MusicaFiltrosChips {...baseProps} />);
    expect(screen.getByRole("button", { name: /calma/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agitada/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adoração" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Celebração" })).toBeInTheDocument();
  });

  /** Chips selecionados refletem o estado em `aria-pressed`. */
  it("marca chips ativos com aria-pressed", () => {
    render(
      <MusicaFiltrosChips
        {...baseProps}
        categoriaIds={["cat-1"]}
        intensidades={["calma"]}
      />,
    );
    expect(screen.getByRole("button", { name: "Adoração" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Celebração" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /calma/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /** Clique num chip de categoria emite o id correspondente. */
  it("chama onToggleCategoria com o id ao clicar num chip", () => {
    const onToggleCategoria = vi.fn();
    render(
      <MusicaFiltrosChips {...baseProps} onToggleCategoria={onToggleCategoria} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Adoração" }));
    expect(onToggleCategoria).toHaveBeenCalledWith("cat-1");
  });

  /** Clique num chip de intensidade emite o valor correspondente. */
  it("chama onToggleIntensidade com o valor ao clicar num chip", () => {
    const onToggleIntensidade = vi.fn();
    render(
      <MusicaFiltrosChips
        {...baseProps}
        onToggleIntensidade={onToggleIntensidade}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /agitada/i }));
    expect(onToggleIntensidade).toHaveBeenCalledWith("agitada");
  });
});

/** Suíte do drawer mobile de filtros (botão "Filtros" + bottom-sheet). */
describe("MusicaFiltrosDrawer", () => {
  /** O botão "Filtros" abre o bottom-sheet com os chips e o rodapé. */
  it("abre o drawer com os chips ao acionar o botão Filtros", () => {
    render(<MusicaFiltrosDrawer {...baseProps} onLimpar={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByText("Adoração")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Limpar filtros" }),
    ).toBeInTheDocument();
  });

  /** O contador de filtros ativos aparece no botão e no aria-label. */
  it("exibe a contagem de filtros ativos no botão", () => {
    render(
      <MusicaFiltrosDrawer
        {...baseProps}
        categoriaIds={["cat-1"]}
        intensidades={["calma"]}
        onLimpar={() => {}}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Filtros, 2 filtros ativos",
    });
    expect(trigger).toHaveTextContent("2");
  });

  /** "Limpar filtros" dispara o callback recebido. */
  it("chama onLimpar ao acionar Limpar filtros", () => {
    const onLimpar = vi.fn();
    render(
      <MusicaFiltrosDrawer
        {...baseProps}
        categoriaIds={["cat-2"]}
        onLimpar={onLimpar}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^filtros/i }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onLimpar).toHaveBeenCalledTimes(1);
  });

  /** Sem filtros ativos, "Limpar filtros" fica desabilitado. */
  it("desabilita Limpar filtros quando não há filtros ativos", () => {
    render(<MusicaFiltrosDrawer {...baseProps} onLimpar={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
  });
});
```

Nota (risco conhecido, precedente conferido em 2026-08-10): `ResponsiveFormDialog.test.tsx` prova que o **conteúdo** do Drawer (vaul) renderiza no jsdom, mas o faz com `open` controlado e `useIsMobile` mockado — a abertura via **clique no `DrawerTrigger`** não tem precedente na suíte. O setup global (`tests/setup.ts`) já polyfilla `matchMedia` e `ResizeObserver`. Se o clique não montar o conteúdo no jsdom, **não alterar o componente para servir ao teste**: mover os casos de abertura/limpar para o e2e mobile (Task 5, navegador real) e manter no unitário `MusicaFiltrosChips` + o rótulo/contador do gatilho (asseráveis sem abrir o sheet).

- [ ] **Step 2: Rodar os testes — devem FALHAR (módulo inexistente)**

```bash
(cd packages/frontend && npx vitest run src/components/__tests__/MusicaFiltros.test.tsx)
```

Expected: FAIL — `Cannot find module '@/components/MusicaFiltros'` (ou equivalente).

- [ ] **Step 3: Implementar o componente**

Criar `packages/frontend/src/components/MusicaFiltros.tsx`:

```tsx
/**
 * Filtros da página de Músicas — intensidade (tempo) e categorias.
 *
 * No mobile os chips vivem atrás do botão "Filtros" (bottom-sheet via
 * `Drawer`), mantendo a busca por texto como protagonista da tela; no
 * desktop a página renderiza os chips inline. O conteúdo é compartilhado
 * pelos dois contextos via `MusicaFiltrosChips`, seguindo a regra do design
 * system de extrair conteúdo de overlay em subcomponente (evita duplicação).
 */

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { IntensityBars } from "@/components/IntensidadeSelector";
import {
  INTENSIDADE_OPTIONS,
  type Intensidade,
} from "@/components/intensidade-options";
import { handleClickableKeyDown } from "@/lib/utils";

/** Propriedades dos chips de filtro (compartilhadas entre inline e drawer). */
export interface MusicaFiltrosProps {
  /** Categorias disponíveis (`{ id, nome }`) para o grupo de chips. */
  categorias: { id: string; nome: string }[];
  /** IDs das categorias atualmente selecionadas. */
  categoriaIds: string[];
  /** Intensidades (tempo) atualmente selecionadas. */
  intensidades: Intensidade[];
  /** Alterna uma categoria no filtro. */
  onToggleCategoria: (id: string) => void;
  /** Alterna uma intensidade no filtro. */
  onToggleIntensidade: (value: Intensidade) => void;
}

/** Propriedades do drawer mobile de filtros. */
export interface MusicaFiltrosDrawerProps extends MusicaFiltrosProps {
  /** Limpa todos os filtros de chips (categorias e intensidades). */
  onLimpar: () => void;
}

/**
 * Classes compartilhadas dos chips clicáveis conforme o estado.
 *
 * @param active - Se o chip está selecionado.
 * @returns String de classes Tailwind do chip.
 */
function chipClassName(active: boolean): string {
  return (
    "cursor-pointer select-none transition-colors " +
    (active
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "hover:bg-primary/10")
  );
}

/**
 * Grupos de chips multi-seleção de intensidade (tempo) e categorias.
 *
 * Usado inline no desktop (`Songs.tsx`) e dentro do drawer no mobile.
 *
 * @param props - Categorias, seleções atuais e callbacks de toggle.
 * @returns Elemento React com os dois grupos de chips.
 */
export function MusicaFiltrosChips({
  categorias,
  categoriaIds,
  intensidades,
  onToggleCategoria,
  onToggleIntensidade,
}: MusicaFiltrosProps) {
  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por intensidade (tempo)"
      >
        {INTENSIDADE_OPTIONS.map((opt) => {
          const active = intensidades.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={active ? "default" : "outline"}
              className={"gap-1.5 " + chipClassName(active)}
              role="button"
              aria-pressed={active}
              tabIndex={0}
              onClick={() => onToggleIntensidade(opt.value)}
              onKeyDown={handleClickableKeyDown(() =>
                onToggleIntensidade(opt.value),
              )}
            >
              <IntensityBars bars={opt.bars} className="h-3.5 w-3.5" />
              {opt.label}
            </Badge>
          );
        })}
      </div>

      {categorias.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por categoria"
        >
          {categorias.map((cat) => {
            const active = categoriaIds.includes(cat.id);
            return (
              <Badge
                key={cat.id}
                variant={active ? "default" : "outline"}
                className={chipClassName(active)}
                role="button"
                aria-pressed={active}
                tabIndex={0}
                onClick={() => onToggleCategoria(cat.id)}
                onKeyDown={handleClickableKeyDown(() =>
                  onToggleCategoria(cat.id),
                )}
              >
                {cat.nome}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Botão "Filtros" com bottom-sheet para o mobile.
 *
 * Exibe um contador de filtros ativos sobre o botão para que o estado dos
 * filtros permaneça visível mesmo colapsados. Os chips dentro do drawer
 * aplicam o filtro imediatamente (a lista atualiza por trás do overlay);
 * "Ver resultados" apenas fecha o sheet.
 *
 * @param props - Filtros, callbacks de toggle e ação de limpar.
 * @returns Elemento React com o gatilho e o drawer de filtros.
 */
export function MusicaFiltrosDrawer({
  onLimpar,
  ...chipProps
}: MusicaFiltrosDrawerProps) {
  const ativos = chipProps.categoriaIds.length + chipProps.intensidades.length;
  const rotulo =
    ativos > 0
      ? `Filtros, ${ativos} ${ativos === 1 ? "filtro ativo" : "filtros ativos"}`
      : "Filtros";

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative flex-shrink-0"
          aria-label={rotulo}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {ativos > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {ativos}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Filtros</DrawerTitle>
          <DrawerDescription>Refine por intensidade e categoria.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-2">
          <MusicaFiltrosChips {...chipProps} />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="bg-gradient-primary shadow-soft hover:opacity-90">
              Ver resultados
            </Button>
          </DrawerClose>
          <Button variant="ghost" onClick={onLimpar} disabled={ativos === 0}>
            Limpar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 4: Rodar os testes — devem PASSAR**

```bash
(cd packages/frontend && npx vitest run src/components/__tests__/MusicaFiltros.test.tsx)
```

Expected: PASS (8 testes).

- [ ] **Step 5: Lint e typecheck**

```bash
(cd packages/frontend && npm run lint && npm run typecheck)
```

Expected: PASS nos dois.

- [ ] **Step 6: Commit**

```bash
git add packages/frontend/src/components/MusicaFiltros.tsx packages/frontend/src/components/__tests__/MusicaFiltros.test.tsx
git commit -m "feat(musicas): componente MusicaFiltros com chips compartilhados e drawer mobile"
```

---

## Task 4: Frontend — integrar `MusicaFiltros` em `Songs.tsx`

**Files:**

- Modify: `packages/frontend/src/pages/Songs.tsx:1-7` (docstring), `:22-23` (imports), `:230` (novo handler após `toggleIntensidade`), `:288-369` (CardHeader)
- Modify: `.claude/rules/frontend-react.md`

**Interfaces:**

- Consumes: `MusicaFiltrosChips`, `MusicaFiltrosDrawer` (Task 3), com as props exatas definidas em `MusicaFiltrosProps`/`MusicaFiltrosDrawerProps`.
- Produces: comportamento — a 360px os grupos `role="group"` ficam ocultos e existe um botão com `aria-label` iniciado por "Filtros" (a Task 5 depende desses seletores).

- [ ] **Step 1: Atualizar docstring da página (linhas 1-7)**

Substituir por:

```tsx
/**
 * Página de gerenciamento do catálogo de músicas.
 *
 * Estado da lista (page, busca, intensidades, categorias) sincronizado com a
 * URL via `useSearchParams`. Filtros por intensidade (tempo) e por categoria
 * via chips multi-seleção: inline no desktop e colapsados atrás do botão
 * "Filtros" (bottom-sheet) no mobile, mantendo a busca como protagonista.
 * Busca textual e ambos os filtros executados no backend.
 */
```

- [ ] **Step 2: Ajustar imports**

Remover a linha 22 (`IntensityBars` deixa de ser usado na página):

```tsx
import { IntensityBars } from "@/components/IntensidadeSelector";
```

Adicionar no lugar:

```tsx
import { MusicaFiltrosChips, MusicaFiltrosDrawer } from "@/components/MusicaFiltros";
```

Manter o import de `INTENSIDADE_OPTIONS`/`Intensidade` (linha 23) — a página ainda valida o param `intensidades` da URL com ele.

- [ ] **Step 3: Adicionar handler `limparFiltros`**

Inserir logo após a função `toggleIntensidade` (após a linha 230):

```tsx
  /**
   * Remove todos os filtros de chips (categorias e intensidades) da URL,
   * preservando a busca textual e resetando para a página 1.
   */
  const limparFiltros = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("categorias");
        next.delete("intensidades");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };
```

- [ ] **Step 4: Substituir o conteúdo do `CardHeader` (linhas 288-369)**

Trocar todo o bloco de `<CardHeader className="space-y-4">` até seu `</CardHeader>` por:

```tsx
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas por nome..."
                aria-label="Buscar músicas por nome"
                className="pl-10 w-full"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            {/* Mobile: filtros colapsados atrás do botão (bottom-sheet). */}
            <div className="sm:hidden">
              <MusicaFiltrosDrawer
                categorias={categoriasList ?? []}
                categoriaIds={categoriaIds}
                intensidades={intensidades}
                onToggleCategoria={toggleCategoria}
                onToggleIntensidade={toggleIntensidade}
                onLimpar={limparFiltros}
              />
            </div>
          </div>

          {/* Desktop: chips inline, sempre visíveis (comportamento atual). */}
          <div className="hidden sm:block">
            <MusicaFiltrosChips
              categorias={categoriasList ?? []}
              categoriaIds={categoriaIds}
              intensidades={intensidades}
              onToggleCategoria={toggleCategoria}
              onToggleIntensidade={toggleIntensidade}
            />
          </div>
        </CardHeader>
```

- [ ] **Step 5: Testes + lint + typecheck + conferência de import morto**

```bash
(cd packages/frontend && npm run test && npm run lint && npm run typecheck)
```

Expected: tudo PASS.

Nenhum gate automático acusa import sem uso neste repo (`@typescript-eslint/no-unused-vars` está `"off"` em `eslint.config.js:23` e o tsconfig tem `noUnusedLocals: false`), então conferir manualmente que o Step 2 foi feito:

```bash
grep -n "IntensityBars" packages/frontend/src/pages/Songs.tsx
```

Expected: nenhuma ocorrência.

- [ ] **Step 6: Verificação visual mobile-first (obrigatória)**

Com backend e frontend rodando (`npm run dev` em cada package), abrir `/musicas` no DevTools:

- **360×740**: só busca + botão de filtros no header do card; nenhum chip visível; resultados começam logo abaixo da busca; com o teclado virtual aberto, resultados visíveis. Tocar no botão → bottom-sheet com os dois grupos de chips; selecionar "Calma" + uma categoria → lista atualiza por trás, URL ganha `intensidades=calma&categorias=<id>`; "Ver resultados" fecha; badge "2" no botão; "Limpar filtros" zera chips mantendo `q`. Sem overflow horizontal.
- **1024px**: chips inline exatamente como antes (intensidade acima, categorias abaixo); botão de filtros invisível; toggles e URL funcionam como hoje.

- [ ] **Step 7: Atualizar `.claude/rules/frontend-react.md`**

1. Na regra nº 8 de "Padrões obrigatórios" (overlays com conteúdo alto), trocar `Referência: `DateTimePicker.tsx`.` por `Referência: `DateTimePicker.tsx`, `MusicaFiltros.tsx` (filtros da lista de músicas).`
2. Na tabela "Páginas já corrigidas", adicionar a linha:

```markdown
| `Songs.tsx` + `MusicaFiltros.tsx` | Filtros colapsáveis no mobile: chips de intensidade/categoria atrás do botão "Filtros" (Drawer bottom-sheet) com contador de ativos e "Limpar filtros"; desktop mantém chips inline; busca protagonista a 360px |
```

- [ ] **Step 8: Commit**

```bash
git add packages/frontend/src/pages/Songs.tsx .claude/rules/frontend-react.md
git commit -m "feat(musicas): filtros colapsaveis em bottom-sheet no mobile, busca protagonista"
```

---

## Task 5: Frontend — e2e mobile dos filtros colapsáveis

**Files:**

- Create: `packages/frontend/tests/e2e/musicas-filtros.mobile.spec.ts`

**Interfaces:**

- Consumes: `loginAsAdmin` (`tests/e2e/helpers/login.ts`); `expectSemOverflowHorizontal` (`tests/e2e/helpers/viewport.ts`, Task 2); seletores produzidos pela Task 4 (`role="group"` com aria-labels "Filtrar por intensidade (tempo)"/"Filtrar por categoria"; botão com aria-label iniciado por "Filtros"; drawer com `role="dialog"`). O sufixo `.mobile.spec.ts` roteia o spec para o projeto `mobile` do Playwright (Galaxy S8, 360×740).
- Produces: cobertura automatizada da regra mobile (cards/overlay visíveis, sem overflow horizontal).

- [ ] **Step 1: Criar o spec**

```typescript
/**
 * Testes E2E mobile (Galaxy S8, 360×740) dos filtros colapsáveis da página
 * de Músicas.
 *
 * Verifica a regra mobile-first do projeto: a busca é a protagonista — os
 * chips de filtro ficam ocultos atrás do botão "Filtros" (bottom-sheet) e a
 * página não gera rolagem horizontal.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { expectSemOverflowHorizontal } from "./helpers/viewport";

test.describe("Mobile — Músicas: filtros colapsáveis (360×740)", () => {
  /** Autentica e abre a página de Músicas antes de cada caso. */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/musicas");
    await expect(page.getByRole("heading", { name: "Músicas" })).toBeVisible();
  });

  /** Os chips inline ficam ocultos e o botão "Filtros" fica visível. */
  test("esconde os chips inline e mostra o botão Filtros", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^filtros/i })).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Filtrar por categoria" }),
    ).toBeHidden();
    await expect(
      page.getByRole("group", { name: "Filtrar por intensidade (tempo)" }),
    ).toBeHidden();
  });

  /** O botão "Filtros" abre o bottom-sheet com os grupos de chips. */
  test("abre o bottom-sheet com os chips ao tocar em Filtros", async ({ page }) => {
    await page.getByRole("button", { name: /^filtros/i }).click();

    const drawer = page.getByRole("dialog");
    await expect(
      drawer.getByRole("group", { name: "Filtrar por intensidade (tempo)" }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("group", { name: "Filtrar por categoria" }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: "Limpar filtros" }),
    ).toBeVisible();
  });

  /** Selecionar um chip aplica o filtro na URL e o contador aparece no botão. */
  test("aplica filtro pela URL e exibe contador no botão", async ({ page }) => {
    await page.getByRole("button", { name: /^filtros/i }).click();

    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: "Calma" }).click();
    await expect(page).toHaveURL(/intensidades=calma/);

    await drawer.getByRole("button", { name: "Ver resultados" }).click();
    await expect(drawer).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^filtros, 1 /i }),
    ).toBeVisible();
  });

  /** A página não pode exigir rolagem horizontal. */
  test("não deve ter overflow horizontal", async ({ page }) => {
    await expectSemOverflowHorizontal(page);
  });
});
```

- [ ] **Step 2: Rodar (exige backend + frontend no ar)**

```bash
(cd packages/frontend && npx playwright test --project=mobile musicas-filtros)
(cd packages/frontend && npx playwright test --project=chromium musicas.spec.ts)
```

Expected: 4 testes PASS no mobile; o spec desktop continua PASS (chips inline visíveis a 1280px) — a Task 0 já o deixou verde, então aqui o critério é **nenhuma regressão**.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/tests/e2e/musicas-filtros.mobile.spec.ts
git commit -m "test(e2e): cobertura mobile dos filtros colapsaveis de musicas"
```

---

## Task 6: Backend — ordenação pt-BR de categorias

**Files:**

- Create: `packages/backend/src/utils/ordenacao.ts`
- Modify: `packages/backend/src/services/categorias.service.ts:9-15`
- Test: `packages/backend/tests/services/categorias.service.test.ts` (dentro do `describe('listAll')`, linhas 22-30)
- Modify: `packages/backend/docs/openapi.json` (entrada `"/categorias"`, ~linha 2878)
- Modify: `.claude/rules/backend-api.md`

**Interfaces:**

- Consumes: `categoriasRepository.findAll(): Promise<{ id: string; nome: string }[]>` (inalterado).
- Produces: `compararNomesPtBr(a: string, b: string): number` em `src/utils/ordenacao.ts` (a Task 7 reutiliza); `categoriasService.listAll()` passa a devolver o array ordenado por `nome` (pt-BR).

**Decisão de arquitetura:** a ordenação mora no **service** (não em `orderBy` no repository) porque (1) o resultado fica determinístico independentemente do collation do banco — um Postgres com locale `C` ordenaria "Ágape" depois de "Zelo"; (2) os testes unitários usam fake repositories, então só a ordenação em service é verificável pela suíte existente. Listas paginadas (músicas) são a exceção: ordenam no banco por exigência da paginação (já implementado).

- [ ] **Step 1: Escrever o teste (falhando)**

Em `packages/backend/tests/services/categorias.service.test.ts`, adicionar dentro do `describe('listAll', ...)` existente:

```typescript
    /** Deve ordenar por nome em pt-BR, com acentos junto da letra-base. */
    it('deve retornar categorias em ordem alfabética pt-BR', async () => {
      await categoriasService.create('Ágape', 'tenant-fake-id');
      await categoriasService.create('Abertura', 'tenant-fake-id');

      const result = await categoriasService.listAll();

      expect(result.map((c) => c.nome)).toEqual([
        'Abertura',
        'Adoração',
        'Ágape',
        'Celebração',
        'Natal',
      ]);
    });
```

O caso cobre acentuação de verdade: um sort ingênuo por code point colocaria "Ágape" depois de "Natal" (`Á` = U+00C1 > `N`), e a ordem atual (inserção no fake) é `Adoração, Celebração, Natal, Ágape, Abertura`.

- [ ] **Step 2: Rodar — deve FALHAR**

```bash
(cd packages/backend && npx vitest run tests/services/categorias.service.test.ts)
```

Expected: FAIL no novo caso (ordem de inserção, não alfabética).

- [ ] **Step 3: Criar o utilitário de ordenação**

Criar `packages/backend/src/utils/ordenacao.ts`:

```typescript
/**
 * Utilitários de ordenação alfabética em português do Brasil.
 *
 * Centraliza o `Intl.Collator` pt-BR usado pelos services que retornam
 * listas ordenadas por nome. A ordenação vive no backend (fonte da verdade)
 * e no service — não em `ORDER BY` — para ser determinística independente
 * do locale/collation do banco (um `lc_collate` C ordenaria "Ágape" depois
 * de "Zelo").
 */

/** Collator pt-BR reutilizável (instanciar `Intl.Collator` é custoso; criar uma única vez). */
const collatorPtBr = new Intl.Collator('pt-BR');

/**
 * Compara dois nomes alfabeticamente em pt-BR (acentos junto da letra-base).
 *
 * @param a - Primeiro nome.
 * @param b - Segundo nome.
 * @returns Negativo se `a` vem antes, positivo se vem depois, 0 se equivalentes.
 */
export function compararNomesPtBr(a: string, b: string): number {
    return collatorPtBr.compare(a, b);
}
```

- [ ] **Step 4: Ordenar no service**

Em `packages/backend/src/services/categorias.service.ts`, adicionar o import (após a linha 2):

```typescript
import { compararNomesPtBr } from '../utils/ordenacao.js';
```

Substituir o método `listAll` (linhas 9-15) por:

```typescript
    /**
     * Lista todas as categorias em ordem alfabética (pt-BR).
     * @returns Array de categorias (id e nome) ordenado por nome.
     */
    async listAll() {
        const categorias = await categoriasRepository.findAll();
        return [...categorias].sort((a, b) => compararNomesPtBr(a.nome, b.nome));
    }
```

- [ ] **Step 5: Rodar — deve PASSAR (e typecheck)**

```bash
(cd packages/backend && npx vitest run tests/services/categorias.service.test.ts && npm run typecheck)
```

Expected: PASS.

- [ ] **Step 6: Atualizar OpenAPI (`GET /categorias`)**

Em `packages/backend/docs/openapi.json`, na entrada `"/categorias"` → `"get"` (~linha 2878):

1. Trocar a description por:

```json
"description": "Retorna a lista completa de categorias para classificação de músicas, em ordem alfabética (pt-BR)."
```

2. Reordenar o `example` da resposta 200 para refletir o contrato (mesmos pares id/nome, agora em ordem): `Adoração` (…001), `Avivamento` (…005), `Congregacional` (…003), `Intimidade` (…004), `Louvor` (…002).

- [ ] **Step 7: Documentar o padrão em `.claude/rules/backend-api.md`**

1. Na árvore de estrutura do backend, adicionar após a linha `│   ├── errors/          # AppError (erro padronizado)`:

```text
│   ├── utils/           # Utilitários puros (ex.: ordenação pt-BR com Intl.Collator)
```

2. Adicionar uma seção nova antes de "Convenções de Código":

```markdown
## Ordenação de Listas Nomeadas

- Listas completas retornadas por services (categorias, artistas) são ordenadas **no service** com `compararNomesPtBr` (`src/utils/ordenacao.ts`, `Intl.Collator('pt-BR')`) — determinístico, imune ao collation do banco e testável com os fakes.
- Listas **paginadas** (músicas) ordenam no banco (`orderBy: { nome: 'asc' }` no repository) — a paginação exige ordenação na query. O collation do banco deve ordenar acentos junto da letra-base (verificado `en_US.utf8` no dev em 2026-08-10; conferir `SELECT datcollate FROM pg_database WHERE datname = current_database();` ao provisionar novos ambientes — collation `C`/`POSIX`, comum em imagens alpine, quebraria a ordem de nomes acentuados).
```

- [ ] **Step 8: Commit**

```bash
git add packages/backend/src/utils/ordenacao.ts packages/backend/src/services/categorias.service.ts packages/backend/tests/services/categorias.service.test.ts packages/backend/docs/openapi.json .claude/rules/backend-api.md
git commit -m "feat(categorias): listagem em ordem alfabetica pt-BR"
```

---

## Task 7: Backend — ordenação pt-BR de artistas

**Files:**

- Modify: `packages/backend/src/services/artistas.service.ts:5-7`
- Test: `packages/backend/tests/services/artistas.service.test.ts` (dentro do `describe('listAll')`, linhas 19-25)
- Modify: `packages/backend/docs/openapi.json` (entrada `"/artistas"`, ~linha 166)

**Interfaces:**

- Consumes: `compararNomesPtBr(a: string, b: string): number` (`src/utils/ordenacao.ts`, criado na Task 6); `artistasRepository.findAll(): Promise<{ id: string; nome: string }[]>` (inalterado).
- Produces: `artistasService.listAll()` devolve o array ordenado por `nome` (pt-BR) — herdado por `Settings.tsx` (aba Artistas) e pelos comboboxes de artista (`MusicaForm`/`VersaoForm`) sem mudança de frontend.

- [ ] **Step 1: Escrever o teste (falhando)**

Em `packages/backend/tests/services/artistas.service.test.ts`, adicionar dentro do `describe('listAll', ...)` existente:

```typescript
    /** Deve ordenar por nome em pt-BR, com acentos junto da letra-base. */
    it('deve retornar artistas em ordem alfabética pt-BR', async () => {
      await artistasService.create('Ávine Vinny', 'tenant-fake-id');
      await artistasService.create('Davi Sacer', 'tenant-fake-id');

      const result = await artistasService.listAll();

      expect(result.map((a) => a.nome)).toEqual([
        'Aline Barros',
        'Ávine Vinny',
        'Davi Sacer',
        'Fernandinho',
        'Gabriela Rocha',
      ]);
    });
```

("Ávine Vinny" cobre acento na inicial: sort ingênuo o jogaria para o fim da lista.)

- [ ] **Step 2: Rodar — deve FALHAR**

```bash
(cd packages/backend && npx vitest run tests/services/artistas.service.test.ts)
```

Expected: FAIL no novo caso.

- [ ] **Step 3: Ordenar no service**

Em `packages/backend/src/services/artistas.service.ts`, adicionar o import (após a linha 2):

```typescript
import { compararNomesPtBr } from '../utils/ordenacao.js';
```

Substituir o método `listAll` (linhas 5-7) por:

```typescript
    /**
     * Lista todos os artistas em ordem alfabética (pt-BR).
     * @returns Array de artistas (id e nome) ordenado por nome.
     */
    async listAll() {
        const artistas = await artistasRepository.findAll();
        return [...artistas].sort((a, b) => compararNomesPtBr(a.nome, b.nome));
    }
```

- [ ] **Step 4: Rodar — deve PASSAR (e typecheck)**

```bash
(cd packages/backend && npx vitest run tests/services/artistas.service.test.ts && npm run typecheck)
```

Expected: PASS.

- [ ] **Step 5: Atualizar OpenAPI (`GET /artistas`)**

Em `packages/backend/docs/openapi.json`, na entrada `"/artistas"` → `"get"` (~linha 166):

1. Trocar a description por:

```json
"description": "Retorna a lista completa de artistas cadastrados, em ordem alfabética (pt-BR)."
```

2. Reordenar o `example` da resposta 200 (mesmos pares id/nome): `Aline Barros` (…001), `Diante do Trono` (…004), `Fernandinho` (…002), `Gabriela Rocha` (…003).

- [ ] **Step 6: Commit**

```bash
git add packages/backend/src/services/artistas.service.ts packages/backend/tests/services/artistas.service.test.ts packages/backend/docs/openapi.json
git commit -m "feat(artistas): listagem em ordem alfabetica pt-BR"
```

---

## Task 8: Verificação final, padronização e registro Kaizen

**Files:**

- Modify: `KAIZEN_LOG.md`
- Modify: `.claude/rules/dev-workflow.md`

- [ ] **Step 1: Suítes completas dos dois packages**

```bash
(cd packages/backend && npm run test && npm run typecheck && npm run lint)
(cd packages/frontend && npm run test && npm run typecheck && npm run lint)
```

Expected: tudo PASS. O `typecheck` do frontend existe desde a Task 1.

- [ ] **Step 2: Smoke test da API (ordem alfabética de ponta a ponta)**

Com backend + banco no ar (credenciais do seed de dev):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/sessions \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@louvorflow.com","password":"Admin@123"}' | jq -r '.token')
curl -s http://localhost:3000/api/categorias -H "Authorization: Bearer $TOKEN" | jq -r '.[].nome'
curl -s http://localhost:3000/api/artistas -H "Authorization: Bearer $TOKEN" | jq -r '.[].nome'
curl -s "http://localhost:3000/api/musicas?page=1&limit=100" -H "Authorization: Bearer $TOKEN" | jq -r '.items[].nome'
```

Expected: as três listas em ordem alfabética (acentos junto da letra-base). Se a resposta não refletir o código no disco, **reiniciar o processo do backend antes de mexer em código** (regra de `dev-workflow.md`).

- [ ] **Step 3: Verificação visual nas telas que herdam a ordenação**

No frontend (mobile 360px e desktop 1024px):

- `/configuracoes` — abas Categorias e Artistas listadas A→Z.
- `/musicas` — chips de categoria (desktop inline e dentro do drawer mobile) em ordem alfabética; lista de músicas A→Z.
- Formulário de música (`MusicaForm`) — combobox de artista e multi-combobox de categorias em ordem alfabética.

Obs.: `useCategorias` tem `staleTime` de 5 min — recarregar a página (ou aguardar) para ver a nova ordem se o app já estava aberto.

- [ ] **Step 4: e2e completo (desktop + mobile)**

```bash
(cd packages/frontend && npx playwright test)
```

Expected: `musicas.spec.ts`, `musicas-filtros.mobile.spec.ts` e `admin-igrejas*` PASS. Os **7 specs que ainda não autenticam** (`dashboard`, `escalas`, `escala-detalhe`, `integrantes`, `musica-detalhe`, `navigation` e demais) continuam vermelhos — dívida pré-existente registrada no `KAIZEN_LOG.md`, fora do escopo deste pool. Critério: **nenhuma falha nova** em relação à baseline da Task 0.

- [ ] **Step 5: Corrigir a regra de caminho (`.claude/rules/dev-workflow.md`)**

Causa raiz do problema que inutilizou a revisão 1: a seção 4 fixa um caminho absoluto de máquina (`/c/Users/pc_admin/source/repos/LouvorFlow`) num arquivo versionado, então toda troca de ambiente a invalida. Substituir as duas formas prescritas nas linhas 44-45 por:

```markdown
**Regra**: comandos `git` rodam **da raiz do repositório**, com caminhos relativos à raiz. Para rodar algo dentro de um package sem que o CWD vaze para o próximo comando, use subshell:

1. **Subshell para comandos de package**: `(cd packages/backend && yarn run test)` — os parênteses isolam o `cd`.
2. **Git sempre relativo à raiz**: `git add packages/backend/src/...`

**Nunca** escrever caminho absoluto de máquina em plano, script ou regra: o repositório já viveu em `/c/Users/.../source/repos/`, `/home/joruge/repos/` e `/home/pc_admin/repos/`, e todo caminho fixo quebra na migração seguinte.
```

- [ ] **Step 6: Registrar o ciclo no `KAIZEN_LOG.md`**

Adicionar **uma** entrada no topo (após o cabeçalho), seguindo o formato da entrada de 2026-08-09: Antes / Depois / **Padronizado em** / tabela "Incrementos entregues" (uma linha por task 0-7, com a verificação de cada) / "Desperdícios evitados" / "Oportunidades levantadas" / "O que aprendemos".

Conteúdo obrigatório:

- **Antes/Depois**: chips sempre visíveis empurrando os resultados para fora da tela a 360px → busca protagonista com filtros em bottom-sheet; categorias e artistas em ordem de inserção → ordem alfabética pt-BR.
- **Padronizado em**: `.claude/rules/frontend-react.md` (padrão de overlay de filtros), `.claude/rules/backend-api.md` (ordenação de listas nomeadas + diretório `utils/`), `.claude/rules/dev-workflow.md` (caminhos relativos), `packages/backend/docs/openapi.json`. **Abrir cada arquivo e confirmar que a mudança está lá antes de escrever o nome dele** — se ainda não foi feito, escrever "pendente".
- **Oportunidades levantadas**: (a) os 7 specs e2e restantes que ainda não autenticam; (b) o que sobrou da expansão do `typecheck` para `tests/`, se algo foi adiado na Task 1; (c) ordenação de funções, tipos de evento e tonalidades (tonalidades têm ordem musical, não alfabética — decisão de produto); (d) e2e ainda não roda no CI.
- **O que aprendemos**: um plano com caminho absoluto de máquina é inexecutável na máquina seguinte — a causa raiz estava na regra, não no plano; e "baseline vermelha" reportada por outra sessão precisa ser reproduzida no ambiente atual antes de virar task (a Task 0 da revisão 1 consertava um problema que não existia aqui).

- [ ] **Step 7: Sincronização de documentação (gate de finalização do `CLAUDE.md`)**

Confirmar:

- Docstrings JSDoc PT-BR em todo código criado/modificado (componente, página, util, services, testes, specs e2e, helper de viewport, `jest-dom.d.ts`).
- `packages/backend/docs/openapi.json` com as duas descriptions/examples atualizados (Tasks 6-7).
- `.claude/rules/frontend-react.md` (Task 4), `.claude/rules/backend-api.md` (Task 6) e `.claude/rules/dev-workflow.md` (Step 5) atualizados.
- `CLAUDE.md`: sem mudança de stack/estrutura de monorepo — **não** alterar.
- `README.md`: verificado em 2026-08-10 — não descreve o comportamento dos filtros nem a ordenação das listas (só Roadmap); nenhuma atualização necessária. Reconferir com `grep -n -i "filtro\|categoria" README.md`.

- [ ] **Step 8: Commit**

```bash
git add KAIZEN_LOG.md .claude/rules/dev-workflow.md
git commit -m "docs(kaizen): registra ciclo dos pedidos da Vanessa e corrige regra de caminho"
```

- [ ] **Step 9 (pós-deploy em staging): conferir collation do banco de staging**

A ordenação de **músicas** depende do collation do Postgres (ordena no banco por causa da paginação). No dev está `en_US.utf8` (correto). Ao fazer o deploy destas mudanças em staging (host do runner: `root@192.168.0.6`), rodar no host:

```bash
docker ps --format '{{.Names}}' | grep -i postgres
docker exec <container_postgres> sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tc "SELECT datcollate FROM pg_database WHERE datname = current_database();"'
```

Regra de decisão: `en_US.utf8`/`pt_BR.utf8` → nada a fazer. `C`/`POSIX` (comum em imagens alpine) → a ordem de músicas acentuadas estará errada nesse ambiente; abrir follow-up de infra (fora do escopo deste plano) para recriar o banco com locale UTF-8 ou aplicar `COLLATE` na coluna `musicas.nome` via migration — **não** contornar com sort no frontend.

---

## Checklist Kaizen (PDCA)

### Do + Check — um incremento por vez, Jidoka em cada

| ✔ | # | Incremento | Critério de Check |
|---|---|---|---|
| [ ] | 0 | `loginAsAdmin` em `musicas.spec.ts` | baseline registrada → spec PASS no projeto `chromium` |
| [ ] | 1 | `jest-dom.d.ts` + `include: ["src","tests"]` + script `typecheck` | `npm run typecheck` com 0 erros; 194 testes ainda PASS; lint limpo |
| [ ] | 2 | `helpers/viewport.ts` extraído | `admin-igrejas` mobile PASS sem mudança de comportamento; typecheck limpo |
| [ ] | 3 | `MusicaFiltros.tsx` + testes | 8 testes PASS (FAIL→PASS); lint + typecheck |
| [ ] | 4 | `Songs.tsx` integrado | suíte completa PASS; `grep IntensityBars` vazio; visual 360px **e** 1024px conferido |
| [ ] | 5 | `musicas-filtros.mobile.spec.ts` | 4 testes PASS no projeto `mobile`; desktop sem regressão |
| [ ] | 6 | `ordenacao.ts` + categorias ordenadas | teste novo FAIL→PASS; typecheck; openapi atualizado |
| [ ] | 7 | Artistas ordenados | teste novo FAIL→PASS; typecheck; openapi atualizado |
| [ ] | 8 | Verificação final + Kaizen log + regra de caminho | suítes, smoke `curl`, e2e sem falha nova, docs sincronizadas |

### Act — gates de finalização do `CLAUDE.md`

- [ ] Docstrings JSDoc em PT-BR em **todo** código novo ou modificado, incluindo callbacks de teste (`describe`, `it`).
- [ ] `packages/backend/docs/openapi.json` refletindo as duas mudanças de contrato.
- [ ] `.claude/rules/frontend-react.md`, `.claude/rules/backend-api.md` e `.claude/rules/dev-workflow.md` atualizados.
- [ ] `CLAUDE.md` — sem mudança necessária (confirmar, não alterar).
- [ ] `README.md` — reconferido, sem mudança necessária.
- [ ] `KAIZEN_LOG.md` com a entrada única do ciclo, cada "Padronizado em" **verificado abrindo o arquivo**.
- [ ] Responsividade mobile verificada a **360px** e 1024px em toda tela tocada (`/musicas`, `/configuracoes`, `MusicaForm`).
- [ ] Nenhum refactor fora do escopo (única exceção autorizada: helper de viewport, Task 2).
- [ ] Nenhum caminho absoluto de máquina introduzido em código, script ou doc.

### Gate final

- [ ] `/clear` e então `/codereview:codereview` — iterar até **nota A** em todas as dimensões.

---

## Notas de Execução

- **Equivalência com o grill report** (que numera pela revisão 1): Task 1 → **3**, Task 2 → **4**, Task 3 → **5**, Task 4 → **6**, Task 5 → **7**, Task 6 → **8**. A Task 0 da revisão 1 (`import React`) foi **removida**; as Tasks 0, 1 e 2 desta revisão são novas.
- **Ordem das tasks**: 0 → 1 → 2 (destravamento dos gates; independentes entre si, mas todas antes do resto) → 3 → 4 → 5 (frontend, encadeadas) e 6 → 7 (backend; a 7 consome o util criado na 6). O bloco 6-7 é independente do 3-5 e pode ser executado antes, se preferir. A Task 8 é sempre a última.
- **Causa raiz confirmada no código (2026-08-10)**: Problema 1 em `Songs.tsx:302-368` (chips sempre visíveis no `CardHeader`); Problema 2 em `categorias.repository.ts:14-18` e `artistas.repository.ts:4-8` (`findAll` sem ordenação). Músicas já ordenadas (`musicas.repository.ts:40`) com collation de dev verificado.
- **Baseline verificada neste ambiente (2026-08-10)**: suíte unitária do frontend **194 passed / 0 failed**; backend `categorias`/`artistas` **32/32 PASS**; `Intl.Collator('pt-BR')` produz exatamente os arrays esperados pelos testes das Tasks 6-7; binário do Playwright presente (`chromium_headless_shell-1208`, e a config roda `headless: true`).
- **Escopo enxuto**: nenhuma mudança em repositories, hooks ou schemas; os toggles/URL state de `Songs.tsx` não mudam — só a apresentação dos chips.
- **DRY**: os chips existem uma única vez (`MusicaFiltrosChips`), consumidos pelo desktop inline e pelo drawer mobile; a checagem de overflow existe uma única vez (`helpers/viewport.ts`).
- **Reversibilidade (kaizen)**: cada commit é independente e reversível; reverter a Task 4 restaura o layout atual sem afetar o backend, e vice-versa.
