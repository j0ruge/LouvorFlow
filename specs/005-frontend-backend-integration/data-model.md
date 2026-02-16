# Data Model: Integração Frontend-Backend (Fase 1)

**Branch**: `005-frontend-backend-integration`
**Date**: 2026-02-16

Este documento define os schemas Zod que representam o contrato entre o frontend e a API REST do backend. Os tipos TypeScript são inferidos dos schemas (`z.infer<typeof Schema>`).

## Schemas Compartilhados (`schemas/shared.ts`)

### IdNome

Usado em: funções, tags, tipos de evento, artistas e qualquer entidade com apenas `id` + `nome`.

```typescript
const IdNomeSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
})
```

### Tonalidade

```typescript
const TonalidadeSchema = z.object({
  id: z.string().uuid(),
  tom: z.string(),
})
```

### ApiError

Formato padrão de erro retornado pelo backend.

```typescript
const ApiErrorSchema = z.object({
  erro: z.string(),
  codigo: z.number(),
})
```

### PaginationMeta

Usado na listagem paginada de músicas.

```typescript
const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})
```

## Integrantes (`schemas/integrante.ts`)

### Response Schemas

**IntegranteComFuncoes** — Item da listagem e detalhe.

```typescript
const IntegranteComFuncoesSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  doc_id: z.string(),
  email: z.string().email(),
  telefone: z.string().nullable(),
  funcoes: z.array(IdNomeSchema),
})
```

**IntegranteResponse** — Resposta de criação/atualização/exclusão.

```typescript
const IntegranteResponseSchema = z.object({
  msg: z.string(),
  integrante: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    doc_id: z.string(),
    email: z.string().email(),
    telefone: z.string().nullable(),
  }),
})
```

### Form Schemas

**CreateIntegranteForm** — Validação do formulário de criação.

```typescript
const CreateIntegranteFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  doc_id: z.string().min(1, "Documento é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  telefone: z.string().optional(),
})
```

## Músicas (`schemas/musica.ts`)

### Response Schemas

**Versao** — Versão de uma música por um artista específico.

```typescript
const VersaoSchema = z.object({
  id: z.string().uuid(),
  artista: IdNomeSchema,
  bpm: z.number().nullable(),
  cifras: z.string().nullable(),
  lyrics: z.string().nullable(),
  link_versao: z.string().nullable(),
})
```

**Musica** — Item da listagem e detalhe.

```typescript
const MusicaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tonalidade: TonalidadeSchema.nullable(),
  tags: z.array(IdNomeSchema),
  versoes: z.array(VersaoSchema),
  funcoes: z.array(IdNomeSchema),
})
```

**MusicasPaginadas** — Resposta paginada da listagem.

```typescript
const MusicasPaginadasSchema = z.object({
  items: z.array(MusicaSchema),
  meta: PaginationMetaSchema,
})
```

**MusicaCreateResponse** — Resposta de criação.

```typescript
const MusicaCreateResponseSchema = z.object({
  msg: z.string(),
  musica: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    tonalidade: TonalidadeSchema,
  }),
})
```

### Form Schemas

**CreateMusicaForm** — Validação do formulário de criação.

```typescript
const CreateMusicaFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fk_tonalidade: z.string().uuid("Selecione uma tonalidade"),
})
```

## Eventos (`schemas/evento.ts`)

### Response Schemas

**MusicaEvento** — Música simplificada no contexto de evento.

```typescript
const MusicaEventoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tonalidade: TonalidadeSchema.nullable(),
})
```

**IntegranteEvento** — Integrante simplificado no contexto de evento.

```typescript
const IntegranteEventoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  funcoes: z.array(IdNomeSchema),
})
```

**EventoIndex** — Item da listagem de eventos.

```typescript
const EventoIndexSchema = z.object({
  id: z.string().uuid(),
  data: z.string(),
  descricao: z.string(),
  tipoEvento: IdNomeSchema.nullable(),
  musicas: z.array(IdNomeSchema),
  integrantes: z.array(IdNomeSchema),
})
```

**EventoShow** — Detalhe completo do evento.

```typescript
const EventoShowSchema = z.object({
  id: z.string().uuid(),
  data: z.string(),
  descricao: z.string(),
  tipoEvento: IdNomeSchema.nullable(),
  musicas: z.array(MusicaEventoSchema),
  integrantes: z.array(IntegranteEventoSchema),
})
```

**EventoCreateResponse** — Resposta de criação.

```typescript
const EventoCreateResponseSchema = z.object({
  msg: z.string(),
  evento: z.object({
    id: z.string().uuid(),
    data: z.string(),
    descricao: z.string(),
    tipoEvento: IdNomeSchema,
  }),
})
```

### Form Schemas

**CreateEventoForm** — Validação do formulário de criação (etapa 1).

```typescript
const CreateEventoFormSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  fk_tipo_evento: z.string().uuid("Selecione um tipo de evento"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
})
```

## Relações Entre Entidades

```text
Integrante ──┬── funcoes: IdNome[]         (via GET /integrantes ou GET /integrantes/:id)
             └── eventos: EventoIndex[]    (não exposto diretamente nesta fase)

Música ──────┬── tonalidade: Tonalidade    (FK, selecionada de GET /tonalidades)
             ├── versoes: Versao[]         (via GET /musicas/:id ou GET /musicas)
             ├── tags: IdNome[]            (via GET /musicas/:id)
             └── funcoes: IdNome[]         (via GET /musicas/:id)

Evento ──────┬── tipoEvento: IdNome        (FK, selecionado de GET /tipos-eventos)
             ├── musicas: MusicaEvento[]   (via GET /eventos/:id, associação via POST /eventos/:id/musicas)
             └── integrantes: IntegranteEvento[] (via GET /eventos/:id, associação via POST /eventos/:id/integrantes)
```
