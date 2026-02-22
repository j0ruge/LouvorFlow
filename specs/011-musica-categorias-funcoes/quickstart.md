# Quickstart: Categorias e Funções Requeridas no Formulário de Música

**Feature**: 011-musica-categorias-funcoes
**Date**: 2026-02-22

## Pré-requisitos

- Docker Compose rodando (`louvorflow_db` na porta 35432)
- `npm install` executado em `packages/backend` e `packages/frontend`
- Schema Prisma atualizado (`npx prisma generate` em `packages/backend`)

## Ordem de Implementação

### Fase 1: Backend — Estender Endpoints Completos

1. **Estender `musicas.service.ts`**:
   - `createComplete()`: aceitar `categoria_ids[]` e `funcao_ids[]` opcionais
   - `updateComplete()`: aceitar `categoria_ids[]` e `funcao_ids[]` opcionais com sync (diff)
   - Validar que cada ID referencia entidade existente antes de criar junções

2. **Estender `musicas.repository.ts`**:
   - `createWithVersao()`: incluir criação de junções `musicas_categorias` e `musicas_funcoes` na transação
   - `updateWithVersao()`: incluir sync de junções na transação

3. **Verificar**: `formatMusica()` já mapeia `Musicas_Categorias` e `Musicas_Funcoes` na resposta — confirmar que funciona com os novos registros.

### Fase 2: Frontend — Novo Componente CreatableMultiCombobox

4. **Criar `CreatableMultiCombobox.tsx`**:
   - Props: `options`, `value` (array de strings), `onValueChange`, `onCreate`, `placeholder`, `createLabel`, `isLoading`
   - UI: Popover + Command (mesmo padrão visual do `CreatableCombobox`)
   - Exibir badges dos itens selecionados com botão "X"
   - Filtrar itens já selecionados da lista
   - Opção "Criar X" quando texto não tem match exato
   - Popover permanece aberto após seleção

### Fase 3: Frontend — Integrar no MusicaForm

5. **Estender `musica.ts` (schemas)**:
   - Adicionar `categoria_ids: z.array(z.string().uuid()).optional()` ao `CreateMusicaCompleteFormSchema`
   - Adicionar `funcao_ids: z.array(z.string().uuid()).optional()` ao `CreateMusicaCompleteFormSchema`
   - Mesma extensão no `UpdateMusicaCompleteFormSchema`

6. **Estender `MusicaForm.tsx`**:
   - Importar `useCategorias`, `useCreateCategoria`, `useFuncoes`, `useCreateFuncao`
   - Adicionar dois campos `CreatableMultiCombobox` (categorias + funções) após os campos existentes
   - Handlers `handleCreateCategoria` e `handleCreateFuncao` (mesmo padrão de tonalidade/artista)
   - Na edição: pré-preencher com `musica.categorias` e `musica.funcoes`

7. **Estender `musicas.ts` (services)**:
   - Incluir `categoria_ids` e `funcao_ids` no payload de `createMusicaComplete()` e `updateMusicaComplete()`

### Fase 4: Testes

8. **Testes backend**: Validar que `createComplete` e `updateComplete` criam/sincronizam junções
9. **Testes frontend**: Validar comportamento do `CreatableMultiCombobox` (seleção, remoção, criação inline, filtragem)

## Comandos Úteis

```bash
# Backend — rodar servidor de desenvolvimento
cd packages/backend && npm run dev

# Frontend — rodar Vite dev server
cd packages/frontend && npm run dev

# Testes
cd packages/backend && npm test
cd packages/frontend && npm test

# Prisma — regenerar client (se necessário)
cd packages/backend && npx prisma generate
```

## Verificação Rápida

1. Abrir formulário de nova música
2. Verificar que campos "Categorias" e "Funções Requeridas" aparecem
3. Digitar texto → verificar que a lista filtra
4. Selecionar item → verificar que badge aparece
5. Digitar nome inexistente → verificar que opção "Criar" aparece
6. Criar inline → verificar que badge aparece e item é persistido
7. Remover badge → verificar que item volta à lista
8. Submeter formulário → verificar que associações são persistidas
9. Editar música → verificar que badges são pré-preenchidos
10. Modificar seleção na edição → verificar que sync funciona
