# Research: Testes Unitários com Fake Repositories

**Feature**: 004-unit-tests-fake-repos
**Date**: 2026-02-16

## R-001: Framework de Testes

**Decision**: Vitest

**Rationale**: Projeto TypeScript 5.9 novo (sem testes existentes). Vitest oferece:
- TypeScript nativo sem `ts-jest` ou configuração extra
- ESM nativo (projeto usa `module: NodeNext`)
- 10-20x mais rápido que Jest em watch mode
- API 95% compatível com Jest (`describe`, `it`, `expect`, `vi.mock`)
- Uma única dependência (`vitest`) vs 3+ do Jest

**Alternatives considered**:
- **Jest + ts-jest**: Maduro (15 anos), mas requer 3 dependências extras, configuração para TypeScript/ESM, mais lento
- **Node.js built-in test runner**: Ainda experimental, API limitada, sem `vi.mock()` equivalente
- **Mocha + Chai + Sinon**: 3 dependências separadas, mais configuração manual

## R-002: Estratégia de Mocking dos Repositories

**Decision**: `vi.mock()` com factory functions (fake repositories)

**Rationale**: Os services importam repositories como singletons via default export:

```typescript
import tagsRepository from '../repositories/tags.repository.js';
```

`vi.mock()` é hoisted automaticamente pelo Vitest, substituindo o módulo antes que o service o importe. Factory functions permitem criar instâncias limpas com `reset()`.

**Alternatives considered**:
- **Dependency Injection refactoring**: Exigiria modificar todos os 8 services + controllers + rotas. Viola princípio V da constituição (YAGNI)
- **vi.spyOn() em cada método**: Mais verboso, não garante isolamento completo, mock parcial
- **Manual mock em `__mocks__/`**: Funciona mas é menos explícito; Vitest suporta mas factory functions são mais flexíveis

## R-003: Mock do bcryptjs

**Decision**: `vi.mock('bcryptjs')` com implementação determinística

**Rationale**: bcrypt com SALT_ROUNDS=12 leva ~250ms por chamada. O IntegrantesService usa `bcrypt.hash()` no create e update. Mock retorna `'hashed_password'` para validar que o hash foi chamado sem custo de CPU.

**Alternatives considered**:
- **SALT_ROUNDS=1 nos testes**: Mais rápido (~10ms) mas ainda não determinístico; não permite asserção sobre o valor do hash
- **Sem mock (real bcrypt)**: Funcional mas adiciona ~3-5 segundos ao test suite inteiro; viola SC-002 (< 10s)

## R-004: Organização dos Dados Mockados

**Decision**: Arquivo centralizado `mock-data.ts` com UUIDs fixos

**Rationale**: Dados centralizados garantem:
- Consistência de FKs entre fake repos (musica → tonalidade, evento → tipo_evento)
- UUIDs previsíveis para asserções (`expect(result.id).toBe(MOCK_TAG_ID_1)`)
- Reutilização entre todos os fake repos sem duplicação
- Facilidade de manutenção — um único lugar para alterar dados

**Alternatives considered**:
- **Dados inline em cada fake repo**: Duplicação, risco de FKs inconsistentes
- **Faker.js / dados aleatórios**: Testes não determinísticos, dificulta asserções exatas
- **Fixtures em JSON**: Funcional mas TypeScript perde type safety; mais difícil de manter

## R-005: Convenção de Nomenclatura de Arquivos de Teste

**Decision**: `<nome-do-service>.test.ts` (ex: `tags.service.test.ts`)

**Rationale**:
- Padrão default do Vitest (`**/*.{test,spec}.{js,ts}`)
- `.test.ts` é a convenção mais adotada pela comunidade JavaScript/TypeScript
- Espelha o nome do arquivo fonte: `tags.service.ts` → `tags.service.test.ts`
- `.spec.ts` é mais comum em Angular/BDD; `.test.ts` é mais universal

**Alternatives considered**:
- **`*.spec.ts`**: Válido mas menos comum fora do ecossistema Angular
- **Co-located (`__tests__/` ao lado do service)**: Válido mas mistura código de teste com produção
- **`*.test.ts` sem o `.service` no nome**: Menos explícito sobre o que está sendo testado

## R-006: Isolamento entre Testes

**Decision**: `beforeEach()` com `fakeRepo.reset()` em cada arquivo de teste

**Rationale**: Cada fake repository mantém estado interno mutável (arrays). `reset()` restaura o estado inicial antes de cada teste, garantindo SC-007 (cada teste é isolado).

**Alternatives considered**:
- **Nova instância do fake repo por teste**: Funcional mas `vi.mock()` é hoisted — a factory roda uma vez. Precisaria de reset de qualquer forma
- **`afterEach()` cleanup**: Semanticamente equivalente, mas `beforeEach` é mais defensivo (garante estado limpo mesmo se teste anterior falhar)
