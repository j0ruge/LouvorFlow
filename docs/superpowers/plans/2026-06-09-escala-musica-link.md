# Navegação Escala → Música (com restauração de rolagem) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement task-by-task. Steps use `- [ ]` checkboxes.
>
> **On execution:** also copy this plan to `docs/superpowers/plans/2026-06-09-escala-musica-link.md` and commit (project + skill convention). Branch `028-escala-musica-link` is already checked out with the spec committed.

**Goal:** Na escala (`/escalas/:id`), tocar/clicar num card de música abre `/musicas/:musicaId`; ao voltar (botão Voltar ou voltar do sistema) retorna-se à escala na mesma posição de rolagem, e a música abre no topo.

**Architecture:** Card inteiro clicável (padrão de `Songs.tsx`) com `onOpen` vindo da página; navegação reusa o contrato `state.from` já lido por `SongDetail`. A rolagem vive num `<div>` interno e compartilhado do `AppLayout` (não na janela), então a restauração é manual via um hook (`useScrollRestoration`) com store em `Map` de módulo, e a música abre no topo via `useScrollToTopOnMount`.

**Tech Stack:** React 18, React Router 6, @dnd-kit, TailwindCSS, Vitest 4 + @testing-library/react (jsdom).

---

## Context

A usuária, vendo uma escala, quer abrir a página de uma música escolhida e, ao voltar, retomar a escala **onde estava** (rolagem preservada). Hoje o card de música (`SortableMusicaCard` em `EventoDetail.tsx`) não é clicável. Além disso, descobriu-se que o scroll do app **não é da janela**: em `AppLayout.tsx` o `<main>` é `h-screen overflow-hidden` e a rolagem acontece num `<div overflow-y-auto scrollbar-overlay>` interno e **compartilhado** entre páginas. Consequências: (1) a restauração nativa de back/forward do navegador não cobre esse container; (2) sem tratamento, ao navegar para a música o container herda o `scrollTop` da escala (abre no meio). O design completo e aprovado está em `docs/superpowers/specs/2026-06-09-escala-musica-link-design.md`.

Decisões já confirmadas: **card inteiro clicável**; store em **`Map` em memória** (perde no reload — aceitável); **escopado à feature** (sem restauração genérica no `AppLayout`); disponível para **qualquer** usuário que vê a escala (inclusive read-only).

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `packages/frontend/src/hooks/use-scroll-restoration.ts` | **Novo.** Hooks `useScrollRestoration(key, ready)` e `useScrollToTopOnMount()` + helper `getScrollRoot()`. Único ponto que conhece o container interno. |
| `packages/frontend/src/components/AppLayout.tsx` | Adiciona `data-scroll-root` ao div de rolagem (contrato p/ o hook localizar o container). |
| `packages/frontend/src/components/EventoDetail.tsx` | `SortableMusicaCard` exportado + clicável (`onOpen`, `stopPropagation` no grip/remover/seletor de versão); `handleOpenMusica`; `useScrollRestoration`. |
| `packages/frontend/src/pages/SongDetail.tsx` | `useScrollToTopOnMount()` para abrir no topo. |
| `packages/frontend/src/hooks/__tests__/use-scroll-restoration.test.tsx` | **Novo.** Testes dos hooks (fake element via mock de `document.querySelector`). |
| `packages/frontend/src/components/__tests__/EventoMusicaCard.test.tsx` | **Novo.** Testes de navegação/teclado/stopPropagation do card. |

Convenções a reusar: `handleClickableKeyDown` (`@/lib/utils`), padrão de navegação com `state.from` (`Songs.tsx:194`), leitura de `location.state.from` (`SongDetail.tsx`).

---

## Task 1: Hooks de rolagem (`useScrollRestoration` + `useScrollToTopOnMount`)

**Files:**
- Create: `packages/frontend/src/hooks/use-scroll-restoration.ts`
- Test: `packages/frontend/src/hooks/__tests__/use-scroll-restoration.test.tsx`

- [ ] **Step 1: Escrever os testes (falhando)**

`packages/frontend/src/hooks/__tests__/use-scroll-restoration.test.tsx`:

```tsx
/**
 * Testes dos hooks de rolagem do container interno da aplicação.
 *
 * O jsdom não implementa layout (scrollTop real é sempre 0), então
 * interceptamos `document.querySelector` para devolver um elemento falso
 * inspecionável, isolando a lógica de salvar/restaurar do hook.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useScrollRestoration,
  useScrollToTopOnMount,
} from "@/hooks/use-scroll-restoration";

/**
 * Cria um elemento de rolagem falso e faz `document.querySelector` devolvê-lo.
 *
 * @returns Objeto com o elemento falso (`el`) para inspeção do teste.
 */
function mockScrollRoot() {
  const el = {
    scrollTop: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.spyOn(document, "querySelector").mockReturnValue(el as unknown as Element);
  return { el };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useScrollRestoration", () => {
  /** Sem posição salva para a chave, o container vai ao topo. */
  it("leva ao topo quando não há posição salva", () => {
    const { el } = mockScrollRoot();
    el.scrollTop = 123;
    renderHook(() => useScrollRestoration("escala:nova", true));
    expect(el.scrollTop).toBe(0);
  });

  /** Salva no unmount e restaura na remontagem com a mesma chave. */
  it("salva ao desmontar e restaura na próxima montagem", () => {
    const { el } = mockScrollRoot();
    const a = renderHook(() => useScrollRestoration("escala:x", true));
    expect(el.scrollTop).toBe(0); // entrada nova → topo
    el.scrollTop = 300; // usuária rola
    a.unmount(); // cleanup salva 300
    el.scrollTop = 0;
    renderHook(() => useScrollRestoration("escala:x", true));
    expect(el.scrollTop).toBe(300); // restaurado
  });

  /** Só restaura a posição salva quando `ready` é true (conteúdo carregado). */
  it("aguarda ready=true para restaurar", () => {
    const { el } = mockScrollRoot();
    const a = renderHook(() => useScrollRestoration("escala:wait", true));
    el.scrollTop = 250;
    a.unmount();
    el.scrollTop = 0;
    const r = renderHook(
      ({ ready }) => useScrollRestoration("escala:wait", ready),
      { initialProps: { ready: false } },
    );
    expect(el.scrollTop).toBe(0); // ainda não restaurou
    r.rerender({ ready: true });
    expect(el.scrollTop).toBe(250); // restaura quando pronto
  });
});

describe("useScrollToTopOnMount", () => {
  /** Leva o container ao topo ao montar. */
  it("zera o scrollTop ao montar", () => {
    const { el } = mockScrollRoot();
    el.scrollTop = 500;
    renderHook(() => useScrollToTopOnMount());
    expect(el.scrollTop).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd packages/frontend && yarn vitest run src/hooks/__tests__/use-scroll-restoration.test.tsx`
Expected: FAIL — `Failed to resolve import "@/hooks/use-scroll-restoration"`.

- [ ] **Step 3: Implementar o hook**

`packages/frontend/src/hooks/use-scroll-restoration.ts`:

```tsx
/**
 * Hooks de rolagem do container interno da aplicação.
 *
 * Em `AppLayout`, o scroll não é da janela: ocorre num `<div data-scroll-root>`
 * interno e compartilhado entre páginas. Estes hooks salvam/restauram a posição
 * de rolagem (back/forward na SPA) e permitem abrir uma página no topo.
 */
import { useEffect, useLayoutEffect, useRef } from "react";

/** Posições de rolagem em memória, keyed por chave de página. */
const scrollPositions = new Map<string, number>();

/**
 * Localiza o container de rolagem interno (`<div data-scroll-root>` do AppLayout).
 *
 * @returns O elemento de rolagem, ou null se ainda não montado.
 */
function getScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-scroll-root]");
}

/**
 * Salva e restaura a posição de rolagem do container interno.
 *
 * - Enquanto montado, salva `scrollTop` (throttle via rAF) e também ao desmontar.
 * - Ao montar: com posição salva e `ready=true`, restaura; sem posição salva,
 *   leva ao topo (corrige o carry-over do container compartilhado).
 *
 * @param key - Chave única da página (ex.: `escala:<id>`).
 * @param ready - Indica que o conteúdo carregou (altura disponível p/ restaurar).
 */
export function useScrollRestoration(key: string, ready: boolean): void {
  const restoredRef = useRef(false);

  useLayoutEffect(() => {
    if (restoredRef.current) return;
    const el = getScrollRoot();
    if (!el) return;
    const saved = scrollPositions.get(key);
    if (saved == null) {
      el.scrollTop = 0;
      restoredRef.current = true;
      return;
    }
    if (!ready) return;
    el.scrollTop = saved;
    restoredRef.current = true;
  }, [key, ready]);

  useEffect(() => {
    const el = getScrollRoot();
    if (!el) return;
    let raf = 0;
    /** Persiste a posição atual de forma throttled (uma vez por frame). */
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => scrollPositions.set(key, el.scrollTop));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      scrollPositions.set(key, el.scrollTop); // captura o valor final
    };
  }, [key]);
}

/**
 * Leva o container de rolagem interno ao topo ao montar.
 *
 * Usado em páginas de detalhe para abrir sempre no topo, já que o container de
 * rolagem é compartilhado entre páginas e pode herdar o `scrollTop` da anterior.
 */
export function useScrollToTopOnMount(): void {
  useLayoutEffect(() => {
    const el = getScrollRoot();
    if (el) el.scrollTop = 0;
  }, []);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd packages/frontend && yarn vitest run src/hooks/__tests__/use-scroll-restoration.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
cd /home/pc_admin/repos/LouvorFlow
git add packages/frontend/src/hooks/use-scroll-restoration.ts packages/frontend/src/hooks/__tests__/use-scroll-restoration.test.tsx
git commit -m "feat(frontend): hooks de restauração de rolagem do container interno"
```

---

## Task 2: `data-scroll-root` no AppLayout

**Files:**
- Modify: `packages/frontend/src/components/AppLayout.tsx` (div de rolagem)

- [ ] **Step 1: Adicionar o atributo**

Localizar:

```tsx
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-overlay p-4 sm:p-6">
            {children}
          </div>
```

Substituir por:

```tsx
          <div
            data-scroll-root
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-overlay p-4 sm:p-6"
          >
            {children}
          </div>
```

(Atualizar a docstring do componente mencionando que o div de conteúdo é o container de rolagem da app, marcado com `data-scroll-root`.)

- [ ] **Step 2: Sanity build/type-check**

Run: `cd packages/frontend && yarn vitest run` (suite atual continua verde) — sem novo teste para 1 atributo estático.

- [ ] **Step 3: Commit**

```bash
cd /home/pc_admin/repos/LouvorFlow
git add packages/frontend/src/components/AppLayout.tsx
git commit -m "feat(frontend): marca container de rolagem com data-scroll-root"
```

---

## Task 3: Card de música clicável + navegação + restauração na escala

**Files:**
- Modify: `packages/frontend/src/components/EventoDetail.tsx`
- Test: `packages/frontend/src/components/__tests__/EventoMusicaCard.test.tsx`

- [ ] **Step 1: Escrever o teste do card (falhando)**

`packages/frontend/src/components/__tests__/EventoMusicaCard.test.tsx`:

```tsx
/**
 * Testes do card de música da escala (`SortableMusicaCard`): navegação por
 * clique/teclado e isolamento dos controles internos (`stopPropagation`).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { SortableMusicaCard } from "@/components/EventoDetail";
import type { MusicaEvento } from "@/schemas/evento";

/** Música de teste sem tonalidade e sem versões (picker renderiza null). */
const musica: MusicaEvento = {
  id: "musica-1",
  nome: "Oceans",
  ordem: 1,
  tonalidade: null,
  versao_selecionada: null,
  versoes_disponiveis: [],
};

/**
 * Renderiza o card dentro dos provedores necessários (DnD + React Query).
 *
 * @param props - Spies `onOpen` e `onRemove`.
 * @returns Resultado do render do RTL.
 */
function renderCard(props: {
  onOpen: (id: string) => void;
  onRemove: () => void;
}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DndContext>
        <SortableContext items={[musica.id]}>
          <SortableMusicaCard
            musica={musica}
            canWrite={true}
            eventoId="evento-1"
            isPending={false}
            onOpen={props.onOpen}
            onRemove={props.onRemove}
          />
        </SortableContext>
      </DndContext>
    </QueryClientProvider>,
  );
}

describe("SortableMusicaCard", () => {
  /** Clicar no corpo do card chama onOpen com o id da música. */
  it("navega ao clicar no card", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen, onRemove: vi.fn() });
    fireEvent.click(
      screen.getByRole("button", { name: /abrir detalhes da música oceans/i }),
    );
    expect(onOpen).toHaveBeenCalledWith("musica-1");
  });

  /** Enter aciona a navegação via teclado. */
  it("navega ao pressionar Enter", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen, onRemove: vi.fn() });
    fireEvent.keyDown(
      screen.getByRole("button", { name: /abrir detalhes da música oceans/i }),
      { key: "Enter" },
    );
    expect(onOpen).toHaveBeenCalledWith("musica-1");
  });

  /** Clicar em remover dispara onRemove e NÃO navega (stopPropagation). */
  it("remover não navega", () => {
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    renderCard({ onOpen, onRemove });
    fireEvent.click(screen.getByRole("button", { name: /remover música/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd packages/frontend && yarn vitest run src/components/__tests__/EventoMusicaCard.test.tsx`
Expected: FAIL — `SortableMusicaCard` não é exportado / prop `onOpen` inexistente.

- [ ] **Step 3: Editar `EventoDetail.tsx`**

3a. Import de utils — localizar `import { isSafeUrl } from "@/lib/utils";` e trocar por:

```tsx
import { handleClickableKeyDown, isSafeUrl } from "@/lib/utils";
```

3b. Import do React Router — localizar `import { useParams, useNavigate } from "react-router-dom";` e trocar por:

```tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
```

3c. Import do hook — adicionar junto aos imports de hooks:

```tsx
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
```

3d. Assinatura e tipo do card — localizar `function SortableMusicaCard({ ... }: { ... })` e:
- exportar a função;
- adicionar a prop `onOpen`.

```tsx
export function SortableMusicaCard({
  musica,
  canWrite,
  onRemove,
  isPending,
  eventoId,
  onOpen,
}: {
  musica: MusicaEvento;
  canWrite: boolean;
  onRemove: () => void;
  isPending: boolean;
  eventoId: string;
  onOpen: (musicaId: string) => void;
}) {
```

3e. Tornar o card raiz clicável — localizar:

```tsx
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border border-border ${
        isDragging ? "shadow-lg opacity-75 bg-muted/50 z-10" : ""
      }`}
    >
```

Substituir por:

```tsx
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(musica.id)}
      onKeyDown={handleClickableKeyDown(() => onOpen(musica.id))}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes da música ${musica.nome}`}
      className={`p-3 rounded-lg border border-border cursor-pointer transition-all hover:shadow-medium hover:border-primary/30 ${
        isDragging ? "shadow-lg opacity-75 bg-muted/50 z-10" : ""
      }`}
    >
```

3f. `stopPropagation` no grip — localizar o `<button>` do grip (com `aria-label="Arrastar para reordenar"`) e adicionar `onClick`:

```tsx
            <button
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              aria-label="Arrastar para reordenar"
            >
```

3g. `stopPropagation` no remover — localizar o `<Button ... onClick={onRemove} ...>` e trocar o handler:

```tsx
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={isPending}
            className="flex-shrink-0"
            aria-label="Remover música"
          >
```

3h. `stopPropagation` no seletor de versão — localizar o `<MusicaVersaoPicker ... />` e envolvê-lo num `<span>` com `display: contents` (não afeta layout; a propagação de evento segue a árvore DOM):

```tsx
        <span className="contents" onClick={(e) => e.stopPropagation()}>
          <MusicaVersaoPicker
            musicaId={musica.id}
            versaoSelecionada={musica.versao_selecionada}
            versoesDisponiveis={musica.versoes_disponiveis}
            onSelect={(artistasMusicasId, options) =>
              setVersao.mutate({
                musicaId: musica.id,
                artistasMusicasId,
                silent: options?.silent,
              })
            }
            isPending={setVersao.isPending}
            readOnly={!canWrite}
          />
        </span>
```

3i. Página `EventoDetail` — adicionar `useLocation`, o handler e o hook de restauração. Localizar `const navigate = useNavigate();` e adicionar logo abaixo:

```tsx
  const location = useLocation();
```

Adicionar a restauração de rolagem **antes** dos early returns (`if (isLoading) ...`), por ex. logo após `const { can: canWrite } = useCan("escalas.write");`:

```tsx
  // Restaura a posição de rolagem ao voltar para esta escala (ver use-scroll-restoration).
  useScrollRestoration(`escala:${id ?? ""}`, !isLoading && !!evento);
```

Definir o handler junto dos demais (ex.: ao lado de `handleAddMusica`), reusando o contrato `state.from`:

```tsx
  /**
   * Navega ao detalhe da música preservando a URL atual em `location.state.from`.
   *
   * @param musicaId - UUID da música a abrir.
   */
  function handleOpenMusica(musicaId: string) {
    navigate(`/musicas/${musicaId}`, { state: { from: location.pathname } });
  }
```

3j. Passar `onOpen` ao card — localizar a renderização `<SortableMusicaCard ... />` dentro do `.map` e adicionar a prop:

```tsx
                    <SortableMusicaCard
                      key={musica.id}
                      musica={musica}
                      canWrite={canWrite}
                      eventoId={evento.id}
                      onOpen={handleOpenMusica}
                      onRemove={() => {
                        setRemovingMusicaId(musica.id);
                        removeMusica.mutate(musica.id, {
                          onSettled: () => setRemovingMusicaId(null),
                        });
                      }}
                      isPending={removingMusicaId === musica.id}
                    />
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd packages/frontend && yarn vitest run src/components/__tests__/EventoMusicaCard.test.tsx`
Expected: PASS (3 testes).
(Se o import de `@/components/EventoDetail` puxar efeito que exija API de browser ausente, é só checar `tests/setup.ts`; ResizeObserver/scrollIntoView já estão polyfilled. Não mockar `@/lib/api` — nenhuma query dispara no render do card.)

- [ ] **Step 5: Commit**

```bash
cd /home/pc_admin/repos/LouvorFlow
git add packages/frontend/src/components/EventoDetail.tsx packages/frontend/src/components/__tests__/EventoMusicaCard.test.tsx
git commit -m "feat(escala): card de música clicável navega para o detalhe e restaura rolagem"
```

---

## Task 4: Página da música abre no topo

**Files:**
- Modify: `packages/frontend/src/pages/SongDetail.tsx`

- [ ] **Step 1: Editar `SongDetail.tsx`**

Adicionar o import:

```tsx
import { useScrollToTopOnMount } from "@/hooks/use-scroll-restoration";
```

Chamar o hook **antes** dos early returns, logo após `const location = useLocation();` (já existente):

```tsx
  // O container de rolagem é compartilhado: garante abrir a música no topo.
  useScrollToTopOnMount();
```

- [ ] **Step 2: Rodar a suíte do frontend**

Run: `cd packages/frontend && yarn vitest run`
Expected: PASS (suíte completa, incluindo os novos testes). Comportamento de "abrir no topo" é coberto pelo teste de `useScrollToTopOnMount` na Task 1.

- [ ] **Step 3: Commit**

```bash
cd /home/pc_admin/repos/LouvorFlow
git add packages/frontend/src/pages/SongDetail.tsx
git commit -m "feat(musica): página de detalhe abre sempre no topo"
```

---

## Task 5: Documentação + verificação mobile + suíte completa

**Files:**
- Modify: `.claude/rules/frontend-react.md`
- Modify: `/home/pc_admin/.claude/projects/-home-pc-admin-repos-LouvorFlow/memory/MEMORY.md` (+ novo arquivo de memória)

- [ ] **Step 1: Atualizar `.claude/rules/frontend-react.md`**

- Em "Estrutura do Frontend", citar `hooks/use-scroll-restoration.ts` (restauração de rolagem do container interno).
- Adicionar nota curta: o scroll do app vive num `<div data-scroll-root>` interno do `AppLayout` (não na janela); usar `useScrollRestoration(key, ready)` para preservar posição ao voltar e `useScrollToTopOnMount()` para abrir páginas de detalhe no topo.
- Registrar o padrão "card clicável que navega para detalhe" (card inteiro, `role="button"` + `handleClickableKeyDown`, `stopPropagation` nos controles internos), com `EventoDetail.tsx` na tabela "Páginas já corrigidas".

- [ ] **Step 2: Atualizar memória**

Criar `memory/escala-musica-scroll-restoration.md` (frontmatter `type: project`/`reference`) descrevendo: scroll é de container interno (`data-scroll-root`), hooks em `use-scroll-restoration.ts`, store em `Map` (perde no reload). Adicionar a linha-índice em `MEMORY.md`.

- [ ] **Step 3: Verificação responsiva (mobile 360px + desktop 1024px)**

Com o app rodando (`./dev.sh`), em viewport **360×740**:
- Card de música clicável abre `/musicas/:id`; sem overflow horizontal; nome com `line-clamp-2`.
- Arrastar pelo grip ainda reordena (long-press); abrir o seletor de versão **não** navega; remover **não** navega.
- Voltar (botão Voltar **e** gesto/botão do sistema) retorna à escala na mesma posição de rolagem.
- Música abre no topo.
Repetir conferência em 1024px.

- [ ] **Step 4: Suíte completa + lint**

Run: `cd packages/frontend && yarn vitest run && yarn lint`
Expected: tudo verde.
(Backend intocado; sem mudança de API → `packages/backend/docs/openapi.json` permanece igual.)

- [ ] **Step 5: Commit**

```bash
cd /home/pc_admin/repos/LouvorFlow
git add .claude/rules/frontend-react.md
git commit -m "docs(frontend): documenta hooks de rolagem e padrão de card clicável"
```

---

## Self-Review (cobertura do spec)

- Card clicável (card inteiro) → Task 3 (3e) + testes (3 casos). ✓
- Navegação com `state.from` → Task 3 (3i `handleOpenMusica`); Voltar já lido por `SongDetail`. ✓
- `stopPropagation` em grip/remover/seletor de versão → Task 3 (3f/3g/3h); teste do remover. ✓
- Restauração de rolagem (Voltar e voltar do sistema) → Task 1 (`useScrollRestoration`) + Task 3 (3i wiring) + Task 2 (`data-scroll-root`). ✓
- Música abre no topo → Task 4 (`useScrollToTopOnMount`) + Task 1 (teste). ✓
- Disponível p/ read-only → navegação não usa `canWrite`; o card é clicável independentemente. ✓
- Sem mudança de API → nenhuma task toca backend/openapi. ✓
- Docstrings PT-BR, docs e responsividade → Task 5. ✓
- Consistência de tipos/nomes: `onOpen(musicaId)`, `useScrollRestoration(key, ready)`, `useScrollToTopOnMount()`, `getScrollRoot()`, `data-scroll-root` usados de forma idêntica em todas as tasks. ✓

## Verification (end-to-end)

1. `cd packages/frontend && yarn vitest run` → todos os testes verdes (hooks + card).
2. `./dev.sh` e exercitar o caminho crítico: escala com várias músicas → rolar → clicar numa música → abre no topo do detalhe → Voltar (botão) → escala na mesma posição → repetir usando o voltar do sistema (mobile). Conferir que arrastar, remover e seletor de versão não navegam.
3. `yarn lint` no frontend sem erros.
