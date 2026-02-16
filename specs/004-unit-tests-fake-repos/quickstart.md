# Quickstart: Testes Unitários com Fake Repositories

**Feature**: 004-unit-tests-fake-repos
**Date**: 2026-02-16

## Pré-requisitos

- Node.js 18+
- Dependências do backend já instaladas (`npm install` em `src/backend/`)

## Setup

```bash
cd src/backend

# Instalar Vitest como devDependency
npm install --save-dev vitest

# Executar testes
npm test

# Executar testes em watch mode
npm run test:watch
```

## Estrutura

```text
src/backend/tests/
├── fakes/           # Fake repositories + dados mockados
│   ├── mock-data.ts
│   ├── fake-tags.repository.ts
│   ├── fake-tonalidades.repository.ts
│   ├── fake-funcoes.repository.ts
│   ├── fake-tipos-eventos.repository.ts
│   ├── fake-artistas.repository.ts
│   ├── fake-integrantes.repository.ts
│   ├── fake-musicas.repository.ts
│   └── fake-eventos.repository.ts
└── services/        # Arquivos de teste
    ├── tags.service.test.ts
    ├── tonalidades.service.test.ts
    ├── funcoes.service.test.ts
    ├── tipos-eventos.service.test.ts
    ├── artistas.service.test.ts
    ├── integrantes.service.test.ts
    ├── musicas.service.test.ts
    └── eventos.service.test.ts
```

## Executar um teste específico

```bash
# Executar apenas os testes do TagsService
npx vitest run tests/services/tags.service.test.ts

# Executar testes com filtro por nome
npx vitest run -t "deve retornar erro 404"
```

## Padrão de um teste

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeTagsRepository } from '../fakes/fake-tags.repository.js';
import { AppError } from '../../src/errors/AppError.js';

const fakeRepo = createFakeTagsRepository();

vi.mock('../../src/repositories/tags.repository.js', () => ({
  default: fakeRepo,
}));

// Import APÓS vi.mock (Vitest faz hoisting automático)
const { default: tagsService } = await import('../../src/services/tags.service.js');

describe('TagsService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  describe('listAll', () => {
    it('deve retornar todas as tags', async () => {
      const result = await tagsService.listAll();
      expect(result).toHaveLength(3);
    });
  });

  describe('create', () => {
    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(tagsService.create(undefined))
        .rejects
        .toThrow(AppError);

      try {
        await tagsService.create(undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
      }
    });
  });
});
```

## Verificar cobertura

```bash
npx vitest run --coverage
```

> Nota: Para relatório de cobertura, instale `@vitest/coverage-v8`:
> `npm install --save-dev @vitest/coverage-v8`
