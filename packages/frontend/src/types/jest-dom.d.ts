/**
 * Augmentation de tipos dos matchers do `@testing-library/jest-dom`.
 *
 * O `tests/setup.ts` registra os matchers em runtime via `expect.extend`, o que
 * funciona mas não informa nada ao TypeScript — daí os erros `TS2339` em
 * `toBeInTheDocument`/`toHaveAttribute`.
 *
 * O caminho canônico (`import "@testing-library/jest-dom/vitest"`) **não
 * funciona no Vitest 4**: aquele arquivo faz `declare module 'vitest'` sobre a
 * interface `Assertion`, que no Vitest 4 deixou de ser declarada no módulo
 * `vitest` e passou a viver em `@vitest/expect`, onde `Assertion` estende a
 * interface vazia `Matchers<T>` — este é o ponto de extensão oficial da versão.
 * Augmentar `Matchers` cobre `expect(...)`, `expect(...).not` e as variantes
 * assíncronas de uma vez, para toda a suíte.
 */

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "@vitest/expect" {
  /* eslint-disable @typescript-eslint/no-explicit-any -- `any` reproduz a assinatura
     genérica de `Matchers<T = any>` do próprio `@vitest/expect`; estreitar o tipo aqui
     quebraria a fusão de interfaces e os matchers voltariam a não existir. */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends TestingLibraryMatchers<any, T> {}
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
