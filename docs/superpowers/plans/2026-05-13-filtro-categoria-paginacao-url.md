# Filtro por Categoria + Preservação de Página na Lista de Músicas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar filtro multi-categoria na lista `/musicas` e preservar `page`/`q`/`categorias` na URL para que "Voltar" do detalhe restaure o estado exato da lista.

**Architecture:** Backend ganha query params `?categorias=csv&q=texto&page&limit` validados via Zod; service/repository aceitam `Prisma.MusicasWhereInput`. Frontend usa `useSearchParams` para sincronizar estado da lista com a URL; `SongDetail` lê `location.state.from` para retornar à URL original (fallback `/musicas`). Busca por nome migra de client-side para server-side.

**Tech Stack:** Express 5 + Zod + Prisma 6 (backend); React 18 + react-router-dom 6 + TanStack Query 5 + shadcn/ui (frontend); Vitest.

**Spec de referência:** _(plano interno do autor — `velvety-imagining-toast.md`, não versionado neste repositório)_

---

## File Structure

**Backend:**
- `packages/backend/src/validators/musicas.validators.ts` — adicionar `listMusicasQuerySchema`.
- `packages/backend/src/routes/musicas.routes.ts` — aplicar validator na rota `GET /`.
- `packages/backend/src/controllers/musicas.controller.ts` — `index` passa filtros ao service.
- `packages/backend/src/services/musicas.service.ts` — `listAll({ page, limit, categoriaIds?, q? })`.
- `packages/backend/src/repositories/musicas.repository.ts` — `findAll(skip, take, where?)` e `count(where?)`.
- `packages/backend/docs/openapi.json` — params `categorias` e `q` em `GET /musicas`.
- `packages/backend/tests/services/musicas.service.test.ts` — novos casos do filtro.

**Frontend:**
- `packages/frontend/src/services/categorias.ts` — **criar** `listCategorias()`.
- `packages/frontend/src/hooks/use-categorias.ts` — **criar** `useCategorias()`.
- `packages/frontend/src/services/musicas.ts` — `getMusicas(params)` com `categorias` e `q`.
- `packages/frontend/src/hooks/use-musicas.ts` — `useMusicas(params)`.
- `packages/frontend/src/pages/Songs.tsx` — `useSearchParams`, chips, nav state.
- `packages/frontend/src/pages/SongDetail.tsx` — "Voltar" via `location.state.from`.

---

## Task 1: Backend — Validator de query params

**Files:**
- Modify: `packages/backend/src/validators/musicas.validators.ts`

- [ ] **Step 1: Adicionar schema ao final do arquivo**

```typescript
/**
 * Schema de validação para query params de listagem de músicas (GET /api/musicas).
 *
 * - `page`: inteiro >=1 (default 1)
 * - `limit`: inteiro 1..100 (default 20)
 * - `categorias`: CSV de UUIDs (ex.: "id1,id2"). Vazio/ausente = sem filtro.
 * - `q`: substring case-insensitive para busca por nome. Vazio/ausente = sem busca.
 */
export const listMusicasQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    categorias: z.string().optional().transform((val, ctx) => {
        if (!val) return undefined;
        const ids = val.split(',').map((s) => s.trim()).filter(Boolean);
        for (const id of ids) {
            if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `UUID inválido em categorias: ${id}` });
                return z.NEVER;
            }
        }
        return ids.length > 0 ? ids : undefined;
    }),
    q: z.string().trim().min(1).optional(),
});
```

- [ ] **Step 2: Commit**

```bash
git -C /c/Users/pc_admin/source/repos/LouvorFlow add packages/backend/src/validators/musicas.validators.ts
git -C /c/Users/pc_admin/source/repos/LouvorFlow commit -m "feat(musicas): validator para query params da listagem (categorias, q)"
```

---

## Task 2: Backend — Repository aceita `where`

**Files:**
- Modify: `packages/backend/src/repositories/musicas.repository.ts:26-37`

- [ ] **Step 1: Alterar findAll/count para aceitar `where`**

```typescript
async findAll(skip: number, take: number, where?: Prisma.MusicasWhereInput) {
    return getPrisma().musicas.findMany({
        select: MUSICA_SELECT,
        where,
        skip,
        take,
        orderBy: { nome: 'asc' }
    });
}

async count(where?: Prisma.MusicasWhereInput) {
    return getPrisma().musicas.count({ where });
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `cd packages/backend && npm run typecheck`
Expected: PASS

---

## Task 3: Backend — Service constrói filtros e expõe nova assinatura

**Files:**
- Modify: `packages/backend/src/services/musicas.service.ts:31-53`

- [ ] **Step 1: Substituir `listAll` por nova assinatura**

```typescript
/**
 * Lista músicas paginadas, opcionalmente filtradas por categorias e/ou busca textual.
 *
 * @param params.page - Página (>=1)
 * @param params.limit - Itens por página (1..100)
 * @param params.categoriaIds - UUIDs de categorias; retorna músicas com AO MENOS UMA delas
 * @param params.q - Substring case-insensitive a buscar no nome
 */
async listAll(params: { page: number; limit: number; categoriaIds?: string[]; q?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MusicasWhereInput = {};
    if (params.categoriaIds && params.categoriaIds.length > 0) {
        where.Musicas_Categorias = { some: { categoria_id: { in: params.categoriaIds } } };
    }
    if (params.q) {
        where.nome = { contains: params.q, mode: 'insensitive' };
    }

    const [musicas, total] = await Promise.all([
        musicasRepository.findAll(skip, limit, where),
        musicasRepository.count(where)
    ]);

    return {
        items: musicas.map(formatMusica),
        meta: {
            total,
            page,
            per_page: limit,
            total_pages: Math.ceil(total / limit)
        }
    };
}
```

- [ ] **Step 2: Adicionar import do `Prisma`**

No topo de `musicas.service.ts`, adicionar (se ainda não existir):

```typescript
import { Prisma } from '@prisma/client';
```

- [ ] **Step 3: Verificar typecheck**

Run: `cd packages/backend && npm run typecheck`
Expected: PASS

---

## Task 4: Backend — Controller passa filtros validados

**Files:**
- Modify: `packages/backend/src/controllers/musicas.controller.ts:7-13`

- [ ] **Step 1: Substituir `index` para usar `req.query` validado**

```typescript
/** Lista músicas paginadas com filtros opcionais por categorias e busca textual. */
async index(req: Request, res: Response): Promise<void> {
    const { page, limit, categorias, q } = req.query as unknown as {
        page: number; limit: number; categorias?: string[]; q?: string;
    };
    const result = await musicasService.listAll({ page, limit, categoriaIds: categorias, q });
    res.status(200).json(result);
}
```

Nota: o cast é seguro porque o validator do passo 5 garante os tipos. Express 5 mantém `req.query` como `ParsedQs`, mas o middleware Zod parseou e o resultado pode ser lido confiadamente.

- [ ] **Step 2: Verificar typecheck**

Run: `cd packages/backend && npm run typecheck`
Expected: PASS

---

## Task 5: Backend — Aplicar validator na rota

**Files:**
- Modify: `packages/backend/src/routes/musicas.routes.ts`

- [ ] **Step 1: Importar schema novo**

No bloco de imports do validator, adicionar `listMusicasQuerySchema`.

- [ ] **Step 2: Aplicar middleware na rota GET `/`**

Localizar a linha que define `router.get('/', ensureAuthenticated, ensureTenantContext, musicasController.index);` e trocar por:

```typescript
router.get('/', ensureAuthenticated, ensureTenantContext, validateRequest({ query: listMusicasQuerySchema }), musicasController.index);
```

**Cuidado Express 5**: o middleware `validateRequest` NÃO deve reatribuir `req.query`. Verificar o middleware existente — se ele reatribui, ler `schema.parse(req.query)` e expor o resultado em `res.locals.query` ou similar. Se a base atual não suporta `query`, abrir uma sub-task para estender o middleware antes deste passo.

- [ ] **Step 3: Confirmar suporte a `query` no `validateRequest`**

Run: `cd packages/backend && grep -n "validateRequest" src/middlewares/*.ts`
Expected: encontrar a definição. Se o tipo do parâmetro não inclui `query`, ESTENDER o middleware (criar sub-tarefa) — ele deve aceitar `{ body?, params?, query? }` e parsear cada um, **sem reatribuir `req.query`**, expondo o resultado parseado em `req.query` via `Object.defineProperty` ou usando uma propriedade custom. Para esta task, se reatribuição não for possível em Express 5, mudar a abordagem: ler `req.query` cru no controller e chamar `listMusicasQuerySchema.parse(req.query)` ali — manter validação 1-para-1.

- [ ] **Step 4: Commit das tasks 2-5**

```bash
git -C /c/Users/pc_admin/source/repos/LouvorFlow add packages/backend/src/repositories/musicas.repository.ts packages/backend/src/services/musicas.service.ts packages/backend/src/controllers/musicas.controller.ts packages/backend/src/routes/musicas.routes.ts
git -C /c/Users/pc_admin/source/repos/LouvorFlow commit -m "feat(musicas): filtros categorias e q em GET /api/musicas"
```

---

## Task 6: Backend — Testes do service

**Files:**
- Modify: `packages/backend/tests/services/musicas.service.test.ts`

- [ ] **Step 1: Escrever testes (assumindo padrão existente de fakes)**

Adicionar dentro do `describe('listAll', ...)` (ou criar se não existir):

```typescript
describe('listAll com filtros', () => {
    /** Sem filtros, retorna todas as músicas paginadas. */
    it('retorna todas as músicas quando sem filtros', async () => {
        // dado: fake repo retorna 3 músicas
        const result = await musicasService.listAll({ page: 1, limit: 20 });
        expect(result.items).toHaveLength(3);
        expect(result.meta.total).toBe(3);
    });

    /** Com 1 categoria, filtra via where Prisma. */
    it('passa where com categoria_id quando categoriaIds tem 1 item', async () => {
        const spy = vi.spyOn(musicasRepository, 'findAll');
        await musicasService.listAll({ page: 1, limit: 20, categoriaIds: ['cat-1'] });
        expect(spy).toHaveBeenCalledWith(
            0, 20,
            expect.objectContaining({
                Musicas_Categorias: { some: { categoria_id: { in: ['cat-1'] } } }
            })
        );
    });

    /** Com múltiplas categorias, usa `in` (OR). */
    it('usa `in` com múltiplos ids', async () => {
        const spy = vi.spyOn(musicasRepository, 'findAll');
        await musicasService.listAll({ page: 1, limit: 20, categoriaIds: ['cat-1', 'cat-2'] });
        expect(spy).toHaveBeenCalledWith(
            0, 20,
            expect.objectContaining({
                Musicas_Categorias: { some: { categoria_id: { in: ['cat-1', 'cat-2'] } } }
            })
        );
    });

    /** Com `q`, aplica `contains` insensitive. */
    it('aplica busca case-insensitive em nome quando q presente', async () => {
        const spy = vi.spyOn(musicasRepository, 'findAll');
        await musicasService.listAll({ page: 1, limit: 20, q: 'agnus' });
        expect(spy).toHaveBeenCalledWith(
            0, 20,
            expect.objectContaining({ nome: { contains: 'agnus', mode: 'insensitive' } })
        );
    });

    /** Combina categoria + busca. */
    it('combina filtros de categoria e busca', async () => {
        const spy = vi.spyOn(musicasRepository, 'findAll');
        await musicasService.listAll({ page: 1, limit: 20, categoriaIds: ['cat-1'], q: 'rei' });
        const callWhere = spy.mock.calls[0][2];
        expect(callWhere).toHaveProperty('Musicas_Categorias');
        expect(callWhere).toHaveProperty('nome');
    });
});
```

Antes de escrever: **abrir o arquivo atual** para entender o padrão de mock (fakes vs vi.mock). Adaptar imports/spies ao padrão usado. Se o padrão é fake repository, contar quantos itens existem no fake e ajustar.

- [ ] **Step 2: Rodar testes — devem FALHAR antes da implementação (se essa task vier antes das 2-5, o que NÃO é o caso aqui — então devem PASSAR já)**

Run: `cd packages/backend && npm run test -- musicas.service`
Expected: PASS (porque tasks 2-5 já implementaram)

- [ ] **Step 3: Commit**

```bash
git -C /c/Users/pc_admin/source/repos/LouvorFlow add packages/backend/tests/services/musicas.service.test.ts
git -C /c/Users/pc_admin/source/repos/LouvorFlow commit -m "test(musicas): cobertura de filtros categorias e q em listAll"
```

---

## Task 7: Backend — Atualizar OpenAPI

**Files:**
- Modify: `packages/backend/docs/openapi.json` (próximo à linha 380, parâmetros de `GET /musicas`)

- [ ] **Step 1: Adicionar dois parâmetros ao array `parameters` de `GET /musicas`**

```json
{
    "name": "categorias",
    "in": "query",
    "required": false,
    "description": "UUIDs de categorias separados por vírgula. Retorna músicas com pelo menos uma das categorias informadas.",
    "schema": { "type": "string", "example": "uuid1,uuid2" }
},
{
    "name": "q",
    "in": "query",
    "required": false,
    "description": "Substring case-insensitive para busca por nome.",
    "schema": { "type": "string" }
}
```

- [ ] **Step 2: Commit**

```bash
git -C /c/Users/pc_admin/source/repos/LouvorFlow add packages/backend/docs/openapi.json
git -C /c/Users/pc_admin/source/repos/LouvorFlow commit -m "docs(openapi): documentar params categorias e q em GET /musicas"
```

---

## Task 8: Frontend — Service + hook de categorias

**Files:**
- Create: `packages/frontend/src/services/categorias.ts`
- Create: `packages/frontend/src/hooks/use-categorias.ts`

- [ ] **Step 1: Criar `services/categorias.ts`**

```typescript
/**
 * Serviço de categorias — chamadas à API REST.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { IdNomeSchema, type IdNome } from "@/schemas/shared";

/**
 * Lista todas as categorias do tenant atual.
 *
 * @returns Array de categorias `{ id, nome }`.
 */
export async function listCategorias(): Promise<IdNome[]> {
    const data = await apiFetch<unknown>("/categorias");
    return z.array(IdNomeSchema).parse(data);
}
```

Antes de implementar: **inspecionar o response de `GET /api/categorias`** no openapi.json. Se a resposta for paginada ou tiver formato diferente de `IdNome[]`, ajustar o schema.

- [ ] **Step 2: Criar `hooks/use-categorias.ts`**

```typescript
/**
 * Hook React Query para listar categorias do tenant.
 */

import { useQuery } from "@tanstack/react-query";
import { listCategorias } from "@/services/categorias";

/**
 * Hook que retorna todas as categorias do tenant ativo.
 *
 * Cache mantido por 5 minutos (lista raramente muda).
 *
 * @returns Resultado do `useQuery` com array de categorias.
 */
export function useCategorias() {
    return useQuery({
        queryKey: ["categorias"],
        queryFn: listCategorias,
        staleTime: 5 * 60 * 1000,
    });
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `cd packages/frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git -C /c/Users/pc_admin/source/repos/LouvorFlow add packages/frontend/src/services/categorias.ts packages/frontend/src/hooks/use-categorias.ts
git -C /c/Users/pc_admin/source/repos/LouvorFlow commit -m "feat(frontend): service e hook para listar categorias"
```

---

## Task 9: Frontend — Refatorar `getMusicas` para aceitar params

**Files:**
- Modify: `packages/frontend/src/services/musicas.ts:41-49`

- [ ] **Step 1: Substituir assinatura**

```typescript
/**
 * Parâmetros aceitos por `getMusicas`.
 */
export interface GetMusicasParams {
    page?: number;
    limit?: number;
    categorias?: string[];
    q?: string;
}

/**
 * Busca músicas com paginação e filtros opcionais.
 *
 * @param params - Página, limite, lista de categorias e/ou busca textual.
 * @returns Resposta paginada de músicas parseada pelo schema Zod.
 */
export async function getMusicas(params: GetMusicasParams = {}): Promise<MusicasPaginadas> {
    const { page = 1, limit = 20, categorias, q } = params;
    const search = new URLSearchParams();
    search.set("page", String(page));
    search.set("limit", String(limit));
    if (categorias && categorias.length > 0) search.set("categorias", categorias.join(","));
    if (q) search.set("q", q);
    const data = await apiFetch<unknown>(`/musicas?${search.toString()}`);
    return MusicasPaginadasSchema.parse(data);
}
```

- [ ] **Step 2: Verificar typecheck (vai quebrar callers até a Task 10)**

Run: `cd packages/frontend && npm run typecheck`
Expected: FAIL em `hooks/use-musicas.ts` — ok, será corrigido na próxima task.

---

## Task 10: Frontend — Refatorar `useMusicas` para aceitar params

**Files:**
- Modify: `packages/frontend/src/hooks/use-musicas.ts:36-48`

- [ ] **Step 1: Substituir hook**

```typescript
import type { GetMusicasParams } from "@/services/musicas";

/**
 * Hook para buscar músicas com paginação e filtros.
 *
 * @param params - Parâmetros de paginação e filtros (categorias, q).
 * @returns Resultado do useQuery com a resposta paginada de músicas.
 */
export function useMusicas(params: GetMusicasParams = {}) {
    return useQuery({
        queryKey: ["musicas", params],
        queryFn: () => getMusicas(params),
    });
}
```

- [ ] **Step 2: Verificar typecheck (ainda vai quebrar em Songs.tsx — ok)**

Run: `cd packages/frontend && npm run typecheck`
Expected: FAIL em `pages/Songs.tsx` (chama `useMusicas(page, limit)`). Próxima task corrige.

---

## Task 11: Frontend — `Songs.tsx` com URL state + chips

**Files:**
- Modify: `packages/frontend/src/pages/Songs.tsx`

- [ ] **Step 1: Reescrever a página completa**

```typescript
/**
 * Página de gerenciamento do catálogo de músicas.
 *
 * Estado da lista (page, busca, categorias) sincronizado com a URL via
 * `useSearchParams`. Filtros por categoria via chips multi-seleção.
 * Busca textual e filtro por categoria executados no backend.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useMusicas } from "@/hooks/use-musicas";
import { useCategorias } from "@/hooks/use-categorias";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MusicaForm } from "@/components/MusicaForm";
import { useCan } from "@/hooks/use-can";
import { handleClickableKeyDown } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

/**
 * Skeleton de item de música durante carregamento.
 */
function SongSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-border gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Página de músicas com filtros sincronizados na URL.
 */
const Songs = () => {
  const { can: canWrite } = useCan("musicas.write");
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /** Estado canônico vive na URL. */
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const q = searchParams.get("q") ?? "";
  const categoriasParam = searchParams.get("categorias") ?? "";
  const categoriaIds = categoriasParam ? categoriasParam.split(",").filter(Boolean) : [];

  /** Input local para debounce de busca antes de gravar na URL. */
  const [searchInput, setSearchInput] = useState(q);

  /** Debounce: aplica `q` na URL após 300ms sem digitação. */
  useEffect(
    function debounceSearchToUrl() {
      const timer = setTimeout(() => {
        if (searchInput === q) return;
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (searchInput) next.set("q", searchInput);
            else next.delete("q");
            next.set("page", "1");
            return next;
          },
          { replace: true },
        );
      }, 300);
      return () => clearTimeout(timer);
    },
    [searchInput, q, setSearchParams],
  );

  const { data: categoriasList } = useCategorias();
  const { data, isLoading, isError, error, refetch } = useMusicas({
    page,
    limit: ITEMS_PER_PAGE,
    categorias: categoriaIds.length > 0 ? categoriaIds : undefined,
    q: q || undefined,
  });

  const meta = data?.meta;
  const songs = data?.items ?? [];

  /**
   * Alterna uma categoria no filtro, resetando para a página 1.
   */
  const toggleCategoria = (id: string) => {
    const set = new Set(categoriaIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (set.size > 0) next.set("categorias", Array.from(set).join(","));
      else next.delete("categorias");
      next.set("page", "1");
      return next;
    });
  };

  /**
   * Navega ao detalhe preservando a URL atual em `location.state.from`.
   */
  const goToSong = (id: string) => {
    navigate(`/musicas/${id}`, {
      state: { from: location.pathname + location.search },
    });
  };

  /**
   * Atualiza a página na URL.
   */
  const setPage = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Músicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o repertório do ministério
          </p>
        </div>
        {canWrite && (
          <Button
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Música
          </Button>
        )}
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas por nome..."
                className="pl-10"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {categoriasList && categoriasList.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
              {categoriasList.map((cat) => {
                const active = categoriaIds.includes(cat.id);
                return (
                  <Badge
                    key={cat.id}
                    variant={active ? "default" : "outline"}
                    className={
                      "cursor-pointer select-none transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-primary/10")
                    }
                    role="checkbox"
                    aria-checked={active}
                    tabIndex={0}
                    onClick={() => toggleCategoria(cat.id)}
                    onKeyDown={handleClickableKeyDown(() => toggleCategoria(cat.id))}
                  >
                    {cat.nome}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SongSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorState
              message={error?.message ?? "Erro ao carregar músicas."}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && songs.length === 0 && (
            <EmptyState
              title={
                q || categoriaIds.length > 0
                  ? "Nenhum resultado encontrado"
                  : "Nenhuma música cadastrada"
              }
              description={
                q || categoriaIds.length > 0
                  ? "Tente remover filtros ou ajustar a busca."
                  : "Comece adicionando músicas ao catálogo do ministério."
              }
              actionLabel={
                !q && categoriaIds.length === 0 ? "Nova Música" : undefined
              }
              onAction={
                !q && categoriaIds.length === 0
                  ? () => setFormOpen(true)
                  : undefined
              }
            />
          )}

          {!isLoading && !isError && songs.length > 0 && (
            <>
              <div className="space-y-4">
                {songs.map((song) => {
                  const categoriaBadges = song.categorias.map((categoria) => (
                    <Badge
                      key={categoria.id}
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {categoria.nome}
                    </Badge>
                  ));
                  return (
                    <div
                      key={song.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-gradient-card border border-border hover:shadow-medium hover:border-primary/30 transition-all duration-300 cursor-pointer gap-3 sm:gap-4"
                      onClick={() => goToSong(song.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={handleClickableKeyDown(() => goToSong(song.id))}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 shadow-soft">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{song.nome}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {song.versoes[0]?.artista?.nome ?? "Artista desconhecido"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end leading-none shrink-0 sm:hidden">
                          {song.tonalidade && (
                            <span className="font-display font-bold text-lg text-foreground">
                              {song.tonalidade.tom}
                            </span>
                          )}
                          {song.versoes[0]?.bpm && (
                            <span className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                              {song.versoes[0].bpm} BPM
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3 sm:gap-6 flex-wrap">
                        {song.tonalidade && (
                          <span className="font-display font-bold text-lg text-foreground leading-none">
                            {song.tonalidade.tom}
                          </span>
                        )}
                        {song.versoes[0]?.bpm && (
                          <div className="text-sm text-muted-foreground tabular-nums">
                            {song.versoes[0].bpm} BPM
                          </div>
                        )}
                        <div className="flex gap-2">{categoriaBadges}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToSong(song.id);
                          }}
                        >
                          Detalhes
                        </Button>
                      </div>

                      {song.categorias.length > 0 && (
                        <div className="flex flex-wrap gap-2 sm:hidden">{categoriaBadges}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Página {meta.page} de {meta.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(meta.total_pages, page + 1))}
                    disabled={page >= meta.total_pages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <MusicaForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default Songs;
```

- [ ] **Step 2: Verificar typecheck**

Run: `cd packages/frontend && npm run typecheck`
Expected: PASS

---

## Task 12: Frontend — `SongDetail.tsx` "Voltar" via `location.state.from`

**Files:**
- Modify: `packages/frontend/src/pages/SongDetail.tsx:22-30, 60, 74`

- [ ] **Step 1: Importar `useLocation` e ajustar navegação**

Adicionar `useLocation` ao import existente de `react-router-dom`:

```typescript
import { useParams, useNavigate, useLocation } from "react-router-dom";
```

Dentro do componente:

```typescript
const location = useLocation();
const backTo = (location.state as { from?: string } | null)?.from ?? "/musicas";
```

Substituir `onClick={() => navigate("/musicas")}` (linha ~60) por:

```typescript
onClick={() => navigate(backTo)}
```

Substituir `onDeleted={() => navigate("/musicas")}` (linha ~74) por:

```typescript
onDeleted={() => navigate("/musicas")}
```

Mantemos o destino fixo no `onDeleted` para evitar voltar a uma lista que ainda mostraria o item recém-removido em cache obsoleto.

- [ ] **Step 2: Verificar typecheck**

Run: `cd packages/frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit das tasks 9-12**

```bash
git -C /c/Users/pc_admin/source/repos/LouvorFlow add packages/frontend/src/services/musicas.ts packages/frontend/src/hooks/use-musicas.ts packages/frontend/src/pages/Songs.tsx packages/frontend/src/pages/SongDetail.tsx
git -C /c/Users/pc_admin/source/repos/LouvorFlow commit -m "feat(musicas): filtro por categoria via chips e preservacao da URL ao voltar do detalhe"
```

---

## Task 13: Verificação end-to-end manual

- [ ] **Step 1: Subir stack**

Run (em terminais separados ou via dev script):
```bash
cd packages/backend && npm run dev
cd packages/frontend && npm run dev
```

- [ ] **Step 2: Smoke test backend via curl**

```bash
# Obter token primeiro (login). Usar token a seguir.
curl -s "http://localhost:3000/api/musicas?page=1&limit=5" -H "Authorization: Bearer <TOKEN>" | jq '.meta'
curl -s "http://localhost:3000/api/musicas?categorias=<UUID_CAT>&page=1&limit=5" -H "Authorization: Bearer <TOKEN>" | jq '.items[].nome'
curl -s "http://localhost:3000/api/musicas?q=agnus" -H "Authorization: Bearer <TOKEN>" | jq '.items[].nome'
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/musicas?categorias=invalid" -H "Authorization: Bearer <TOKEN>"
# Esperado: 400
```

Confirmar `meta.total`, filtro aplicado, e 400 em UUID inválido.

- [ ] **Step 3: Smoke test frontend (mobile 360px + desktop)**

Abrir `/musicas`:
- Chips aparecem acima da lista. Clicar "Adoração" → URL vira `?categorias=<id>&page=1`, lista atualiza.
- Clicar "Celebração" também → URL `?categorias=<id1>,<id2>`. Lista mostra união.
- Digitar "agnus" na busca → após 300ms, URL ganha `q=agnus&page=1`.
- Paginar para página 3 (com filtro ativo) → URL `?categorias=...&q=...&page=3`.
- Clicar numa música → abre detalhe.
- Clicar "Voltar" → volta para `/musicas?categorias=...&q=...&page=3`.
- Entrar direto em `/musicas/<id>` (sem `state.from`) → "Voltar" cai em `/musicas` (fallback).
- Compartilhar URL `?categorias=<id>&page=2` em outra aba → estado restaurado.
- DevTools mobile 360px: sem overflow horizontal, chips com wrap, input full-width.

- [ ] **Step 4: Testes automatizados completos**

```bash
cd packages/backend && npm run test && npm run typecheck
cd packages/frontend && npm run test && npm run typecheck && npm run lint
```
Expected: tudo PASS.

- [ ] **Step 5: Sanity check de docs**

Confirmar:
- `packages/backend/docs/openapi.json` tem os 2 novos params.
- Docstrings JSDoc PT-BR em todo código modificado (validator, service, repo, controller, services frontend, hooks, pages).

---

## Notas de Execução

- **Ordem importa**: tasks 2 → 3 → 4 → 5 (typecheck dependente). Task 9 → 10 → 11 também encadeadas.
- **Cuidado Express 5**: `req.query` é read-only. Se `validateRequest` não suporta `query`, ver Step 3 da Task 5 para abordagem alternativa.
- **MEMORY.md**: não precisa de update — padrões já existentes (mobile-first, elegância, URL state).
- **DRY/YAGNI**: não criar componente `<CategoriaChips>` separado nesta iteração — está inline em `Songs.tsx` com ~20 linhas; só extrair se vier a ser reutilizado.
