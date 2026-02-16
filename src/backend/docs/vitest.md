# Vitest - Documentação de Referência

> Documentação obtida via Context7 MCP (`/vitest-dev/vitest`)
> Framework de testes de próxima geração, alimentado pelo Vite.

---

## Índice

1. [Configuração](#configuração)
2. [API de Testes (describe, it, test)](#api-de-testes)
3. [Lifecycle Hooks](#lifecycle-hooks)
4. [Assertions e Matchers](#assertions-e-matchers)
5. [Mocking (vi.fn, vi.mock, vi.spyOn)](#mocking)
6. [Cobertura de Código (Coverage)](#cobertura-de-código)
7. [CLI - Interface de Linha de Comando](#cli)

---

## Configuração

### Arquivo `vitest.config.ts` dedicado

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,              // Habilita APIs de teste globais
    environment: 'jsdom',       // Ambiente DOM (jsdom, happy-dom, node)
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',           // ou 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 5000,
    hookTimeout: 10000,
    setupFiles: ['./setup.ts'],
    reporters: ['default', 'html'],
  },
})
```

### Integrar com configuração Vite existente

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    // ... opções do Vitest
  },
})
```

### Mesclar com configuração Vite existente

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.mjs'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'happy-dom',
  },
}))
```

---

## API de Testes

### Estrutura básica com `describe`, `it` e `expect`

```typescript
import { assert, describe, expect, it } from 'vitest'

describe('nome da suite', () => {
  it('foo', () => {
    expect(1 + 1).toEqual(2)
    expect(true).to.be.true
  })

  it('bar', () => {
    assert.equal(Math.sqrt(4), 2)
  })

  it('snapshot', () => {
    expect({ foo: 'bar' }).toMatchSnapshot()
  })
})
```

### Importações disponíveis

```typescript
import { afterAll, afterEach, beforeAll, beforeEach, describe, it, test, expect, vi } from 'vitest'
```

---

## Lifecycle Hooks

### `beforeAll`, `afterAll`, `beforeEach`, `afterEach`

```typescript
import { beforeAll, afterAll, beforeEach, afterEach, test } from 'vitest'

let server: Server
let db: Database

// Executa uma vez antes de todos os testes na suite
beforeAll(async () => {
  server = await startServer()
  db = await connectDatabase()
})

// Executa uma vez depois de todos os testes na suite
afterAll(async () => {
  await db.close()
  await server.stop()
})

// Executa antes de cada teste
beforeEach(async () => {
  await db.clear()
  await db.seed()
})

// Executa depois de cada teste
afterEach(async () => {
  await db.rollback()
})
```

### Função de cleanup retornada pelo hook

```typescript
beforeEach(async () => {
  const connection = await createConnection()
  return async () => {
    await connection.close()
  }
})
```

### Hooks aninhados

```typescript
describe('outer', () => {
  beforeAll(() => console.log('outer beforeAll'))

  describe('inner', () => {
    beforeAll(() => console.log('inner beforeAll'))
    beforeEach(() => console.log('inner beforeEach'))

    test('test', () => {})
  })
})
```

### Ordem de execução

```text
1. Código em nível de arquivo (fase de coleta)
2. Blocos describe são processados e testes registrados
3. beforeAll hooks (executam uma vez antes de todos os testes)
4. Para cada teste:
   - beforeEach hooks executam
   - Função do teste executa
   - afterEach hooks executam
   - onTestFinished callbacks executam
   - Se o teste falhou: onTestFailed callbacks executam
5. afterAll hooks (executam uma vez após todos os testes)
```

### Exemplo completo do fluxo

```typescript
console.log('File loaded')

describe('User API', () => {
  console.log('Suite defined')

  beforeAll(() => {
    console.log('beforeAll')
  })

  beforeEach(() => {
    console.log('beforeEach')
  })

  test('creates user', () => {
    console.log('test 1')
  })

  test('updates user', () => {
    console.log('test 2')
  })

  afterEach(() => {
    console.log('afterEach')
  })

  afterAll(() => {
    console.log('afterAll')
  })
})

// Saída:
// File loaded
// Suite defined
// beforeAll
// beforeEach
// test 1
// afterEach
// beforeEach
// test 2
// afterEach
// afterAll
```

---

## Assertions e Matchers

### Matchers básicos

```typescript
import { expect, test } from 'vitest'

test('matchers básicos', () => {
  // Igualdade
  expect(1 + 1).toBe(2)              // igualdade estrita (===)
  expect({ a: 1 }).toEqual({ a: 1 }) // igualdade profunda

  // Verdadeiro/Falso
  expect(true).toBeTruthy()
  expect(false).toBeFalsy()
  expect(null).toBeNull()
  expect(undefined).toBeUndefined()
  expect(1).toBeDefined()

  // Números
  expect(2 + 2).toBeGreaterThan(3)
  expect(2 + 2).toBeGreaterThanOrEqual(4)
  expect(2 + 2).toBeLessThan(5)
  expect(0.1 + 0.2).toBeCloseTo(0.3)

  // Strings
  expect('hello world').toMatch(/world/)
  expect('hello world').toContain('world')

  // Arrays
  expect([1, 2, 3]).toContain(2)
  expect([1, 2, 3]).toHaveLength(3)
})
```

### `toMatchObject` - Correspondência parcial de objetos

```typescript
import { expect, test } from 'vitest'

const johnInvoice = {
  isActive: true,
  customer: {
    first_name: 'John',
    last_name: 'Doe',
    location: 'China',
  },
  total_amount: 5000,
  items: [
    { type: 'apples', quantity: 10 },
    { type: 'oranges', quantity: 5 },
  ],
}

const johnDetails = {
  customer: {
    first_name: 'John',
    last_name: 'Doe',
    location: 'China',
  },
}

test('invoice has john personal details', () => {
  expect(johnInvoice).toMatchObject(johnDetails)
})

test('the number of elements must match exactly', () => {
  expect([{ foo: 'bar' }, { baz: 1 }]).toMatchObject([
    { foo: 'bar' },
    { baz: 1 },
  ])
})
```

### `toThrowError` - Testar exceções

```typescript
import { expect, test } from 'vitest'

test('throws an error', () => {
  // IMPORTANTE: envolver em função para capturar o erro
  expect(() => {
    throw new Error('something went wrong')
  }).toThrowError('something went wrong')

  // Usando RegExp
  expect(() => {
    throw new Error('something went wrong')
  }).toThrowError(/wrong/)
})
```

### Snapshot Testing

```typescript
import { expect, test } from 'vitest'

test('matches snapshot', () => {
  const data = { foo: new Set(['bar', 'snapshot']) }
  expect(data).toMatchSnapshot()
})

// Com shape matching parcial
test('matches snapshot with shape', () => {
  const data = { foo: new Set(['bar', 'snapshot']) }
  expect(data).toMatchSnapshot({ foo: expect.any(Set) })
})
```

---

## Mocking

### `vi.fn()` - Criar funções mock

```typescript
import { vi, expect } from 'vitest'

const getApples = vi.fn(() => 0)

getApples()

expect(getApples).toHaveBeenCalled()
expect(getApples).toHaveReturnedWith(0)

getApples.mockReturnValueOnce(5)

const res = getApples()
expect(res).toBe(5)
expect(getApples).toHaveNthReturnedWith(2, 5)
```

### `vi.fn()` - Mock de classes

```typescript
import { vi, expect } from 'vitest'

const Cart = vi.fn(class {
  get = () => 0
})

const cart = new Cart()
expect(Cart).toHaveBeenCalled()
```

### `vi.spyOn()` - Espiar métodos de objetos

```typescript
import { vi } from 'vitest'

const market = {
  getApples: () => 100,
}

const getApplesSpy = vi.spyOn(market, 'getApples')
market.getApples()
expect(getApplesSpy).toHaveBeenCalled()
expect(getApplesSpy.mock.calls).toHaveLength(1)
```

### `vi.mock()` - Mock de módulos inteiros

```typescript
// Arquivo: example.ts
export function method() {}
```

```typescript
// Teste usando vi.mock (hoisted ao topo do arquivo)
import { method } from './example.js'

vi.mock('./example.js', () => ({
  method: vi.fn(),
}))
```

### `vi.spyOn` em exports de módulos

```typescript
import * as exports from './example.js'

vi.spyOn(exports, 'method').mockImplementation(() => {})
```

### Matchers de mock

```typescript
import { vi, expect, test } from 'vitest'

test('mock matchers', () => {
  const fn = vi.fn()

  fn('hello', 'world')
  fn('foo')

  expect(fn).toHaveBeenCalled()
  expect(fn).toHaveBeenCalledTimes(2)
  expect(fn).toHaveBeenCalledWith('hello', 'world')
  expect(fn).toHaveBeenLastCalledWith('foo')
})
```

---

## Cobertura de Código

### Configuração do provider

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // ou 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportOnFailure: true, // gerar relatório mesmo quando testes falham
    },
  },
})
```

### Ignorar código na cobertura

```typescript
/* v8 ignore start -- @preserve */
if (parameter) {
  console.log('Ignorado na cobertura')
}
/* v8 ignore stop -- @preserve */

console.log('Incluído na cobertura')
```

```typescript
/* istanbul ignore start -- @preserve */
if (parameter) {
  console.log('Ignorado na cobertura')
}
/* istanbul ignore stop -- @preserve */

console.log('Incluído na cobertura')
```

### Providers disponíveis

- **v8** (padrão): Usa a cobertura nativa do engine JavaScript V8
- **istanbul**: Ferramenta popular de cobertura JavaScript

> Ao iniciar o Vitest, o sistema solicita automaticamente a instalação do pacote de suporte necessário para o provider escolhido.

---

## CLI

### Comandos principais

```bash
# Executar todos os testes
vitest

# Executar em modo watch (padrão em desenvolvimento)
vitest --watch

# Executar uma vez (sem watch)
vitest run

# Executar arquivos específicos
vitest src/utils.test.ts
vitest "src/**/*.spec.ts"

# Filtrar por nome do teste
vitest --testNamePattern="should add"
vitest -t "user"

# Filtrar por nome do arquivo
vitest user

# Executar com cobertura
vitest --coverage

# Atualizar snapshots
vitest -u

# Executar em modo UI
vitest --ui

# Executar projeto específico (workspaces)
vitest --project=unit-tests

# Executar por número da linha
vitest src/math.test.ts:15
```

### Paralelismo e sequenciamento

```bash
# Executar testes em paralelo
vitest --sequence.concurrent

# Desabilitar paralelismo de arquivos
vitest --no-file-parallelism
```

### Reporters

```bash
# Reporter verboso
vitest --reporter=verbose

# Reporter JSON com arquivo de saída
vitest --reporter=json --outputFile=results.json
```

### Filtrar por tags

```bash
vitest --tags-filter=frontend
vitest --tags-filter="frontend and backend"
```

### Modos de execução

| Comando | Descrição |
|---------|-----------|
| `vitest` | Inicia em modo watch (dev) ou run (CI) |
| `vitest watch` | Modo watch explícito (fallback para run em CI) |
| `vitest run` | Executa uma vez sem watch |
| `vitest --ui` | Interface gráfica no navegador |

---

## Referências

- [Documentação oficial do Vitest](https://vitest.dev/)
- [Repositório GitHub](https://github.com/vitest-dev/vitest)
- Fonte dos dados: Context7 MCP - `/vitest-dev/vitest` (Benchmark Score: 86, Reputation: High)
