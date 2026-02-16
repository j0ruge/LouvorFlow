# Research: Integração Frontend-Backend (Fase 1)

**Branch**: `005-frontend-backend-integration`
**Date**: 2026-02-16
**Status**: Complete — all unknowns resolved

## R1. HTTP Client: Fetch API vs Axios

**Decision**: Fetch API com wrapper customizado

**Rationale**: O princípio V da constituição (YAGNI) orienta usar a solução mais simples. A Fetch API é nativa do navegador, não requer dependência adicional e atende a todos os requisitos: requisições JSON, tratamento de erros HTTP, headers customizados. O React Query já fornece retry, caching e cancelamento de requisições — funcionalidades que reduzem a necessidade de features avançadas do Axios (interceptors, cancelamento nativo).

**Alternatives considered**:
- **Axios**: Oferece interceptors nativos e transformação automática de JSON. Rejeitado porque adiciona ~13KB ao bundle e o React Query já cobre retry/caching. O tratamento global de erros pode ser feito no wrapper Fetch.
- **ky**: Wrapper moderno sobre Fetch com retry. Rejeitado porque o React Query já fornece retry.

**Implementation**: Um único arquivo `lib/api.ts` exporta uma função `apiFetch<T>()` que:
1. Prepend a base URL (`http://localhost:3000/api`)
2. Define headers padrão (`Content-Type: application/json`)
3. Converte resposta para JSON
4. Para erros HTTP, extrai o campo `erro` da resposta e lança um `ApiError` customizado
5. Para erros de rede, lança erro com mensagem genérica em português

## R2. React Query v5: Padrões de Uso

**Decision**: Um hook customizado por operação, query keys padronizadas por recurso

**Rationale**: Hooks separados por operação (ex.: `useIntegrantes()`, `useCreateIntegrante()`) mantêm responsabilidade única e são fáceis de testar. Query keys seguem o padrão `[recurso]` ou `[recurso, id]` para invalidação precisa.

**Alternatives considered**:
- **Hook único por recurso** (ex.: `useIntegrantesApi()` retornando query + mutations): Rejeitado por violar responsabilidade única e dificultar tree-shaking.
- **Factory pattern** (ex.: `createResourceHooks('integrantes')`): Rejeitado por ser abstração prematura (YAGNI) — os 3 recursos têm padrões ligeiramente diferentes (paginação em músicas, detalhes em eventos).

**Padrões adotados**:
- `useQuery` para listagens e detalhes
- `useMutation` para criação, com `onSuccess` invalidando a query key do recurso
- `queryClient.invalidateQueries({ queryKey: ['recurso'] })` após mutação bem-sucedida
- Toast de sucesso no `onSuccess` da mutation; toast de erro no `onError`
- `isLoading` / `isPending` mapeados para componentes Skeleton ou Spinner

## R3. Validação com Zod: Estratégia

**Decision**: Schemas Zod para validação de formulários (input) e parsing de respostas da API (output)

**Rationale**: Zod já está instalado e é o validador recomendado na stack (CLAUDE.md). Usar schemas tanto para input (formulários via `@hookform/resolvers/zod`) quanto para output (parsing de respostas API) garante type-safety de ponta a ponta.

**Alternatives considered**:
- **Validação apenas no input** (confiar no tipo TypeScript para respostas): Rejeitado porque respostas da API podem divergir do contrato esperado. Zod `.parse()` em respostas captura divergências em runtime.
- **Yup**: Rejeitado porque Zod já está instalado e oferece inferência de tipos TypeScript superior.

**Padrões adotados**:
- Schemas de resposta: validam o formato retornado pela API (ex.: `IntegranteSchema`, `MusicaSchema`)
- Schemas de formulário: validam input do usuário antes do envio (ex.: `CreateIntegranteSchema`)
- Tipos inferidos com `z.infer<typeof Schema>` — sem interfaces manuais duplicadas
- Schemas compartilhados para `IdNome`, `Tonalidade`, `ApiError`, `PaginationMeta`

## R4. Formulários: react-hook-form + Zod

**Decision**: react-hook-form com resolver Zod para todos os formulários de criação

**Rationale**: react-hook-form já está instalado junto com `@hookform/resolvers`. Oferece validação performática (sem re-renders desnecessários), integração nativa com Zod via resolver, e preservação de dados no formulário após erro de envio (FR-013).

**Padrões adotados**:
- `useForm<T>({ resolver: zodResolver(schema) })` em cada formulário
- Mensagens de erro por campo via `formState.errors`
- `reset()` chamado apenas após sucesso da mutation (preserva dados em caso de erro)
- Formulários em Dialog (shadcn/ui) para criação inline sem navegar para outra página

## R5. Notificações: Sonner

**Decision**: Sonner como sistema de toast para feedback visual

**Rationale**: Sonner já está instalado e configurado no `App.tsx` (`<Sonner />`). É mais simples que o sistema Radix Toast customizado (que também existe mas não é usado). Sonner oferece API imperativa simples (`toast.success()`, `toast.error()`).

**Alternatives considered**:
- **Radix UI Toast** (custom `useToast` hook existente): Rejeitado por ser mais complexo (queue manual, reducer) sem benefício adicional para o caso de uso.
- **Ambos**: Rejeitado para evitar confusão — um único sistema de toast.

**Padrões adotados**:
- `toast.success(mensagem)` no `onSuccess` de mutations
- `toast.error(mensagem)` no `onError` de mutations, usando `error.message` (que vem do campo `erro` da API)
- Para erros de rede/500 sem mensagem legível: mensagem genérica "Ocorreu um erro inesperado. Tente novamente."

## R6. QueryClient: Configuração Global

**Decision**: QueryClientProvider no App.tsx com defaults conservadores

**Rationale**: Configuração centralizada garante comportamento consistente em toda a aplicação.

**Padrões adotados**:
- `staleTime: 1000 * 60` (1 minuto) — dados são considerados frescos por 1 minuto
- `retry: 1` — uma tentativa de retry automática em caso de erro
- `refetchOnWindowFocus: true` — recarrega dados ao voltar para a aba (padrão do React Query)

## R7. Variável de Ambiente: Base URL da API

**Decision**: Variável de ambiente Vite `VITE_API_BASE_URL` com fallback para `http://localhost:3000/api`

**Rationale**: Permite configurar a URL da API sem alterar código. O fallback garante que funciona out-of-the-box em desenvolvimento.

**Padrões adotados**:
- Definida em `.env` (não versionada) e `.env.example` (versionada como referência)
- Consumida em `lib/api.ts` via `import.meta.env.VITE_API_BASE_URL`
