# Data Model: Testes Unitários com Fake Repositories

**Feature**: 004-unit-tests-fake-repos
**Date**: 2026-02-16

> Este documento descreve o modelo de dados dos **fake repositories** e dados mockados — não altera o schema real do Prisma.

## Entidades dos Fake Repositories

### 1. FakeTag

```typescript
{ id: string; nome: string }
```

- **Unicidade**: `nome` é único
- **Dados iniciais**: "Adoração", "Celebração", "Natal"

### 2. FakeTonalidade

```typescript
{ id: string; tom: string }
```

- **Unicidade**: `tom` é único
- **Dados iniciais**: "G", "D", "C", "A", "E"

### 3. FakeFuncao

```typescript
{ id: string; nome: string }
```

- **Unicidade**: `nome` é único
- **Dados iniciais**: "Vocal", "Guitarra", "Teclado", "Bateria", "Baixo"

### 4. FakeTipoEvento

```typescript
{ id: string; nome: string }
```

- **Unicidade**: `nome` é único
- **Dados iniciais**: "Culto Dominical", "Ensaio", "Conferência"

### 5. FakeArtista

```typescript
{ id: string; nome: string }
```

- **Unicidade**: `nome` é único
- **Dados iniciais**: "Aline Barros", "Fernandinho", "Gabriela Rocha"
- `findById` retorna artista com array de músicas (join com Artistas_Musicas)

### 6. FakeIntegrante

```typescript
{
  id: string;
  nome: string;
  doc_id: string;
  email: string;
  senha: string;
  telefone: string | null;
}
```

- **Unicidade**: `doc_id` é único
- **Dados iniciais**: 2-3 integrantes com doc_id normalizado
- **Campo sensível**: `senha` é excluído nas operações `findByIdPublic`, `create`, `update`
- **Sub-recurso**: `Integrantes_Funcoes` (junction table)

### 7. FakeMusica

```typescript
{
  id: string;
  nome: string;
  fk_tonalidade: string;
}
```

- **Relacionamentos**:
  - `fk_tonalidade → FakeTonalidade.id`
  - `Artistas_Musicas` (versões): `{ id, artista_id, musica_id, bpm, cifras, lyrics, link_versao }`
  - `Musicas_Tags`: `{ id, musica_id, tag_id }`
  - `Musicas_Funcoes`: `{ id, musica_id, funcao_id }`
- **Paginação**: `findAll(skip, take)` com `count()` separado
- **Dados iniciais**: 3 músicas para testes gerais + 25 para teste de paginação

### 8. FakeEvento

```typescript
{
  id: string;
  data: Date;
  fk_tipo_evento: string;
  descricao: string;
}
```

- **Relacionamentos**:
  - `fk_tipo_evento → FakeTipoEvento.id`
  - `Eventos_Musicas`: `{ id, evento_id, musicas_id }`
  - `Eventos_Integrantes`: `{ id, evento_id, fk_integrante_id }`
- **Formatação**: Dois níveis — `formatEventoIndex()` (simplificado) e `formatEventoShow()` (expandido)
- **Dados iniciais**: 2-3 eventos com datas ISO 8601 válidas

## Diagrama de Relacionamentos (Fake Repos)

```text
FakeTonalidade ─────────┐
                        │ fk_tonalidade
FakeTag ──── Musicas_Tags ──── FakeMusica ──── Artistas_Musicas ──── FakeArtista
                                  │
FakeFuncao ── Musicas_Funcoes ────┘
     │
     └── Integrantes_Funcoes ──── FakeIntegrante
                                      │
FakeTipoEvento ── FakeEvento ─────────┤
                      │               │
               Eventos_Musicas    Eventos_Integrantes
```

## UUIDs Fixos (mock-data.ts)

Cada entidade usa UUIDs previsíveis com prefixo numérico para facilitar identificação:

```text
Tags:           'aaa00001-...' a 'aaa00005-...'
Tonalidades:    'bbb00001-...' a 'bbb00005-...'
Funcoes:        'ccc00001-...' a 'ccc00005-...'
TiposEventos:   'ddd00001-...' a 'ddd00003-...'
Artistas:       'eee00001-...' a 'eee00003-...'
Integrantes:    'fff00001-...' a 'fff00003-...'
Musicas:        'ggg00001-...' a 'ggg00025-...' (25 para paginação)
Eventos:        'hhh00001-...' a 'hhh00003-...'
Junction IDs:   'jjj00001-...' em diante
```
