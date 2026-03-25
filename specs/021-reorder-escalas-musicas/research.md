# Research: Reordenacao de Musicas na Escala

**Branch**: `021-reorder-escalas-musicas` | **Date**: 2026-03-24

## R1: Biblioteca de Drag-and-Drop para React

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Rationale**:
- Suporte nativo a touch (mobile) e mouse (desktop) sem configuracao extra
- Modular e leve (~12KB gzipped para core + sortable)
- Compativel com React 18 e TypeScript
- Sensores configuraveis: `PointerSensor` (desktop) e `TouchSensor` com `activationConstraint.delay` para long press (mobile)
- Amplamente usado no ecossistema shadcn/ui
- Nao depende de APIs web-only (`react-beautiful-dnd` usa `window.getComputedStyle` extensivamente), facilitando futura migracao para React Native

**Alternatives considered**:
- `react-beautiful-dnd`: Descontinuado pelo Atlassian, nao recebe mais atualizacoes. Depende de APIs DOM especificas.
- `react-dnd`: API complexa com backend system. Overhead desnecessario para sortable list simples.
- `@hello-pangea/dnd`: Fork do rbd, mantido pela comunidade, mas mesmas limitacoes de portabilidade.

## R2: Estrategia de Ordenacao no Banco

**Decision**: Inteiros sequenciais (1, 2, 3, ...) com reordenacao em lote

**Rationale**:
- Simples de implementar e entender
- A escala de dados e pequena (tipicamente 5-15 musicas por escala), dispensando abordagens mais complexas
- Reordenacao em lote via `$transaction` do Prisma garante consistencia
- `orderBy: { ordem: 'asc' }` no Prisma e direto e eficiente

**Alternatives considered**:
- Fractional indexing (ex: 1.0, 1.5, 2.0): Evita recalculo, mas adiciona complexidade desnecessaria para listas pequenas. Viola YAGNI (Constitution Principle V).
- Linked list (prev/next pointers): Complexidade de queries e updates nao se justifica para o volume de dados.

## R3: Endpoint de Reordenacao

**Decision**: `PATCH /api/eventos/:eventoId/musicas/reorder`

**Rationale**:
- PATCH e semanticamente correto: atualiza parcialmente o recurso (apenas ordem)
- Recebe array de IDs na ordem desejada: `{ musicas_ids: ["uuid1", "uuid2", "uuid3"] }`
- O backend calcula as posicoes (1, 2, 3) a partir da ordem do array
- Operacao atomica dentro de `prisma.$transaction`
- Segue o padrao RESTful da Constitution (Principle III)

**Alternatives considered**:
- PUT individual para cada musica: Multiplos requests, race conditions, nao atomico.
- WebSocket para sync em tempo real: Over-engineering para o caso de uso. Last-write-wins e suficiente.

## R4: Optimistic UI com React Query

**Decision**: `useMutation` com `onMutate` para cache update otimista, `onError` para rollback, `onSettled` para invalidate

**Rationale**:
- Padrao documentado do React Query para optimistic updates
- Evita flash de loading entre reordenacoes consecutivas
- Rollback automatico via `previousData` salvo no `onMutate`
- Toast de erro via `sonner` (ja instalado no projeto)

## R5: Migracao de Dados Existentes

**Decision**: Usar `created_at` como criterio de ordenacao para registros existentes

**Rationale**:
- Unico campo temporal disponivel na junction table
- Reflete a ordem natural em que as musicas foram adicionadas
- Migracao via SQL no Prisma: `UPDATE eventos_musicas SET ordem = subquery.row_num FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY evento_id ORDER BY created_at) as row_num FROM eventos_musicas) subquery WHERE eventos_musicas.id = subquery.id`
