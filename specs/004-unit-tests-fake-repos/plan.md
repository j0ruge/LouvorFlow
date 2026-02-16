# Implementation Plan: Testes Unitários com Fake Repositories

**Branch**: `004-unit-tests-fake-repos` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-unit-tests-fake-repos/spec.md`

## Summary

Implementar testes unitários para os 8 services do backend LouvorFlow usando **Vitest** com fake repositories em memória. Os fake repositories replicam a interface pública dos repositories reais (Prisma) com dados mockados do domínio gospel/louvor. O `bcryptjs` será mockado via `vi.mock()` nos testes do IntegrantesService. Todos os testes executam sem banco de dados em < 10 segundos.

## Technical Context

**Language/Version**: TypeScript 5.9 (target ES2022, module NodeNext)
**Primary Dependencies**: Vitest (test runner), bcryptjs (mockado nos testes)
**Storage**: N/A (testes in-memory, sem banco de dados)
**Testing**: Vitest com `vi.mock()` para substituir modules de repository
**Target Platform**: Node.js 18+ (ambiente de desenvolvimento)
**Project Type**: Web application (backend only — testes da camada service)
**Performance Goals**: Todos os testes executam em < 10 segundos
**Constraints**: Zero dependência de banco; isolamento total entre testes
**Scale/Scope**: 8 services, 8 fake repositories, ~90+ test cases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
|-----------|--------|---------------|
| I. Mobile-First | N/A | Feature de testes unitários backend — sem impacto em UI |
| II. Relational Data Integrity | PASS | Fake repos replicam UUIDs v4 e junction tables do schema real |
| III. RESTful API as Single Source of Truth | N/A | Testes focam na camada service, não alteram endpoints |
| IV. Version-Centric Repertoire Model | PASS | Fake repos preservam a distinção Musica vs Versão (Artistas_Musicas) |
| V. Simplicity & Pragmatism (YAGNI) | PASS | Usa `vi.mock()` para substituir modules — zero refatoração no código de produção |

## Project Structure

### Documentation (this feature)

```text
specs/004-unit-tests-fake-repos/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/backend/
├── vitest.config.ts                          # Configuração do Vitest
├── package.json                              # + vitest devDependency + script "test"
├── tests/
│   ├── fakes/
│   │   ├── fake-tags.repository.ts           # Fake para TagsRepository
│   │   ├── fake-tonalidades.repository.ts    # Fake para TonalidadesRepository
│   │   ├── fake-funcoes.repository.ts        # Fake para FuncoesRepository
│   │   ├── fake-tipos-eventos.repository.ts  # Fake para TiposEventosRepository
│   │   ├── fake-artistas.repository.ts       # Fake para ArtistasRepository
│   │   ├── fake-integrantes.repository.ts    # Fake para IntegrantesRepository
│   │   ├── fake-musicas.repository.ts        # Fake para MusicasRepository
│   │   ├── fake-eventos.repository.ts        # Fake para EventosRepository
│   │   └── mock-data.ts                      # Dados mockados centralizados (UUIDs, nomes gospel)
│   └── services/
│       ├── tags.service.test.ts
│       ├── tonalidades.service.test.ts
│       ├── funcoes.service.test.ts
│       ├── tipos-eventos.service.test.ts
│       ├── artistas.service.test.ts
│       ├── integrantes.service.test.ts
│       ├── musicas.service.test.ts
│       └── eventos.service.test.ts
```

**Structure Decision**: Diretório `tests/` na raiz do backend (`src/backend/tests/`) com separação entre `fakes/` (fake repositories + dados) e `services/` (arquivos de teste). Segue a estrutura já definida no CLAUDE.md (`tests/` ao lado de `src/`).

---

## Decisões de Arquitetura

### 1. Estratégia de Mocking: `vi.mock()` com Fake Repositories

**Decisão**: Usar `vi.mock()` do Vitest para substituir os módulos de repository importados pelos services.

**Raciocínio**: Os services importam repositories como singletons default export:

```typescript
// Padrão em todos os services:
import tagsRepository from '../repositories/tags.repository.js';
```

Com `vi.mock()`, substituímos o módulo inteiro sem alterar código de produção:

```typescript
import { vi } from 'vitest';
import { createFakeTagsRepository } from '../fakes/fake-tags.repository.js';

const fakeRepo = createFakeTagsRepository();

vi.mock('../../src/repositories/tags.repository.js', () => ({
  default: fakeRepo
}));
```

**Alternativa rejeitada**: Dependency Injection — exigiria refatorar todos os 8 services e seus consumidores. Viola o princípio V (YAGNI) da constituição.

### 2. Padrão dos Fake Repositories: Factory Function

**Decisão**: Cada fake repository é exportado como uma factory function `createFakeXxxRepository()` que retorna um objeto com os mesmos métodos do repository real.

**Raciocínio**:
- Factory function permite criar instâncias limpas entre testes
- O objeto retornado replica exatamente a API pública do singleton exportado pelo repository real
- Inclui método `reset()` para restaurar o estado inicial dos dados
- Dados armazenados em arrays internos à closure

**Padrão**:

```typescript
export function createFakeTagsRepository() {
  let data = [...INITIAL_TAGS];

  return {
    findAll: async () => data.map(({ id, nome }) => ({ id, nome })),
    findById: async (id: string) => data.find(t => t.id === id) ?? null,
    findByNome: async (nome: string) => data.find(t => t.nome === nome) ?? null,
    findByNomeExcludingId: async (nome: string, excludeId: string) =>
      data.find(t => t.nome === nome && t.id !== excludeId) ?? null,
    create: async (nome: string) => {
      const newTag = { id: randomUUID(), nome };
      data.push(newTag);
      return { id: newTag.id, nome: newTag.nome };
    },
    update: async (id: string, nome: string) => {
      const tag = data.find(t => t.id === id)!;
      tag.nome = nome;
      return { id: tag.id, nome: tag.nome };
    },
    delete: async (id: string) => {
      const idx = data.findIndex(t => t.id === id);
      const [removed] = data.splice(idx, 1);
      return removed;
    },
    reset: () => { data = [...INITIAL_TAGS]; }
  };
}
```

### 3. Dados Mockados Centralizados

**Decisão**: Um arquivo `mock-data.ts` centraliza todos os UUIDs fixos e dados do domínio gospel.

**Raciocínio**: Evita duplicação de UUIDs entre fake repos; garante coerência de relacionamentos (ex: `fk_tonalidade` de uma música aponta para um UUID que existe no fake de tonalidades).

**Dados previstos**:

| Entidade | Exemplos | Quantidade |
|----------|----------|------------|
| Tags | "Adoração", "Celebração", "Natal" | 3-5 |
| Tonalidades | "G", "D", "C", "A", "E" | 5 |
| Funções | "Vocal", "Guitarra", "Teclado", "Bateria", "Baixo" | 5 |
| Tipos de Eventos | "Culto Dominical", "Ensaio", "Conferência" | 3 |
| Artistas | "Aline Barros", "Fernandinho", "Gabriela Rocha" | 3 |
| Integrantes | "João Silva", "Maria Santos" | 2-3 |
| Músicas | "Rendido Estou", "Grande é o Senhor", "Nada Além do Sangue" | 3-5 (+ 25 para paginação) |
| Eventos | Evento de culto com data ISO 8601 | 2-3 |

Todos os IDs são UUIDs fixos (ex: `'11111111-1111-1111-1111-111111111111'`) para facilitar asserções nos testes.

### 4. Mock do bcryptjs

**Decisão**: Nos testes do IntegrantesService, usar `vi.mock('bcryptjs')` com implementação controlada.

```typescript
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
    genSalt: vi.fn().mockResolvedValue('fake_salt')
  }
}));
```

**Raciocínio**: bcrypt com SALT_ROUNDS=12 leva ~250ms por hash. Mock retorna instantaneamente com valor previsível para asserções.

### 5. Isolamento entre Testes

**Decisão**: `beforeEach()` chama `fakeRepo.reset()` em cada arquivo de teste.

```typescript
beforeEach(() => {
  fakeRepo.reset();
});
```

**Raciocínio**: Garante que cada teste inicia com o estado original dos dados mockados, sem contaminação entre testes (SC-007).

### 6. Configuração do Vitest

**Decisão**: Criar `vitest.config.ts` na raiz do backend com:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
    root: '.',
  },
});
```

**Scripts no package.json**:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Mapeamento: Service → Fake Repository → Métodos

### Services CRUD Simples (Tags, Tonalidades, Funcoes, TiposEventos)

Padrão idêntico para os 4 — cada fake repo implementa:
- `findAll()`, `findById(id)`, `findByNome(nome)` / `findByTom(tom)`
- `findByNomeExcludingId(nome, excludeId)` / `findByTomExcludingId(tom, excludeId)`
- `create(nome)` / `create(tom)`, `update(id, nome)` / `update(id, tom)`, `delete(id)`
- `reset()`

### ArtistasService

Fake repo: `findAll`, `findById` (com músicas), `findByIdSimple`, `findByNome`, `findByNomeExcludingId`, `create`, `update`, `delete`, `reset`

### IntegrantesService

Fake repo: `findAll`, `findById` (com funcoes), `findByIdSimple`, `findByIdPublic`, `findByDocId`, `findByDocIdExcludingId`, `create`, `update`, `delete`, `findFuncoesByIntegranteId`, `findIntegranteFuncao`, `createIntegranteFuncao`, `deleteIntegranteFuncao`, `findFuncaoById`, `reset`

### MusicasService

Fake repo: `findAll(skip, take)`, `count`, `findById`, `findByIdSimple`, `findByIdNameOnly`, `create`, `update`, `delete`, `findVersoes`, `findVersaoById`, `createVersao`, `updateVersao`, `deleteVersao`, `findVersaoDuplicate`, `findArtistaById`, `findTags`, `createTag`, `deleteTag`, `findTagDuplicate`, `findTagById`, `findFuncoes`, `createFuncao`, `deleteFuncao`, `findFuncaoDuplicate`, `findFuncaoById`, `reset`

**Dependência adicional**: MusicasService também importa `tonalidadesRepository` — precisa de mock separado.

### EventosService

Fake repo: `findAll`, `findById`, `findByIdSimple`, `findByIdForDelete`, `create`, `update`, `delete`, `findMusicas`, `createMusica`, `deleteMusica`, `findMusicaDuplicate`, `findMusicaById`, `findIntegrantes`, `createIntegrante`, `deleteIntegrante`, `findIntegranteDuplicate`, `findIntegranteById`, `reset`

---

## Estimativa de Test Cases por Service

| Service | Sucesso | Validação 400 | Duplicata 409 | Não encontrado 404 | Total |
|---------|---------|---------------|---------------|---------------------|-------|
| Tags | 5 | 4 | 2 | 3 | ~14 |
| Tonalidades | 5 | 4 | 2 | 3 | ~14 |
| Funcoes | 5 | 4 | 2 | 3 | ~14 |
| TiposEventos | 5 | 4 | 2 | 3 | ~14 |
| Artistas | 5 | 3 | 2 | 3 | ~13 |
| Integrantes | 7 | 3 | 3 | 4 | ~17 |
| Musicas | 10 | 4 | 3 | 5 | ~22 |
| Eventos | 10 | 4 | 3 | 5 | ~22 |
| **Total** | | | | | **~130** |

---

## Ordem de Implementação

1. **Infraestrutura** (P0): Instalar Vitest, criar `vitest.config.ts`, atualizar `package.json`
2. **Dados Mockados** (P0): Criar `mock-data.ts` com UUIDs fixos e dados do domínio
3. **Fake Repos Simples** (P1): Tags, Tonalidades, Funcoes, TiposEventos — padrão idêntico
4. **Testes CRUD Simples** (P1): 4 arquivos de teste para os services simples
5. **Fake Artistas Repo** (P1): Incluindo `findByIdSimple` e músicas no `findById`
6. **Testes Artistas** (P1): Validar padrão `findByNomeExcludingId` no update
7. **Fake Integrantes Repo** (P2): Incluindo sub-recurso funções e campo público
8. **Testes Integrantes** (P2): Com `vi.mock('bcryptjs')` e normalização doc_id
9. **Fake Musicas Repo** (P2): Paginação + 3 sub-recursos (versões, tags, funções)
10. **Testes Musicas** (P2): Paginação, limites, normalização `formatMusica()`
11. **Fake Eventos Repo** (P3): `formatEventoIndex/Show` + 2 sub-recursos
12. **Testes Eventos** (P3): Validação ISO 8601, formatação em 2 níveis

## Complexity Tracking

> Nenhuma violação de constituição detectada. Tabela não aplicável.
