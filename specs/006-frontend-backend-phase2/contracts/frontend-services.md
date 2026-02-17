# Frontend Services Contract: Fase 2

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17

Este documento define os contratos de serviço, hooks e componentes que serão criados ou estendidos na Fase 2.

---

## 1. Services (Camada de API)

### `services/artistas.ts` (NOVO)

```typescript
/** Retorna todos os artistas cadastrados. */
getArtistas(): Promise<Artista[]>

/** Retorna um artista pelo ID. */
getArtista(id: string): Promise<Artista>

/** Cria um novo artista. */
createArtista(data: CreateArtistaForm): Promise<ArtistaResponse>

/** Atualiza o nome de um artista. */
updateArtista(id: string, data: UpdateArtistaForm): Promise<ArtistaResponse>

/** Remove um artista. */
deleteArtista(id: string): Promise<{ msg: string }>
```

### `services/musicas.ts` (extensões)

```typescript
/** Retorna uma música pelo ID com todas as relações. */
getMusica(id: string): Promise<Musica>  // já existe

/** Atualiza nome e/ou tonalidade de uma música. */
updateMusica(id: string, data: UpdateMusicaForm): Promise<MusicaCreateResponse>

/** Remove uma música. */
deleteMusica(id: string): Promise<{ msg: string }>

/** Retorna versões de uma música. */
getVersoes(musicaId: string): Promise<Versao[]>

/** Adiciona uma versão a uma música. */
addVersao(musicaId: string, data: CreateVersaoForm): Promise<{ msg: string; versao: Versao }>

/** Atualiza uma versão de uma música. */
updateVersao(musicaId: string, versaoId: string, data: UpdateVersaoForm): Promise<{ msg: string; versao: Versao }>

/** Remove uma versão de uma música. */
removeVersao(musicaId: string, versaoId: string): Promise<{ msg: string }>

/** Retorna tags de uma música. */
getTagsMusica(musicaId: string): Promise<IdNome[]>

/** Adiciona uma tag a uma música. */
addTagMusica(musicaId: string, tagId: string): Promise<{ msg: string }>

/** Remove uma tag de uma música. */
removeTagMusica(musicaId: string, tagId: string): Promise<{ msg: string }>

/** Retorna funções requeridas de uma música. */
getFuncoesMusica(musicaId: string): Promise<IdNome[]>

/** Adiciona uma função requerida a uma música. */
addFuncaoMusica(musicaId: string, funcaoId: string): Promise<{ msg: string }>

/** Remove uma função requerida de uma música. */
removeFuncaoMusica(musicaId: string, funcaoId: string): Promise<{ msg: string }>
```

### `services/eventos.ts` (extensões)

```typescript
/** Atualiza um evento existente. */
updateEvento(id: string, data: UpdateEventoForm): Promise<{ msg: string; evento: object }>

/** Remove um evento. */
deleteEvento(id: string): Promise<{ msg: string }>
```

### `services/integrantes.ts` (extensões)

```typescript
/** Retorna funções de um integrante. */
getFuncoesIntegrante(integranteId: string): Promise<IdNome[]>

/** Adiciona uma função a um integrante. */
addFuncaoIntegrante(integranteId: string, funcaoId: string): Promise<{ msg: string }>

/** Remove uma função de um integrante. */
removeFuncaoIntegrante(integranteId: string, funcaoId: string): Promise<{ msg: string }>
```

### `services/support.ts` (extensões — CRUD para entidades auxiliares)

```typescript
/** === Tags === */
createTag(data: CreateTagForm): Promise<CrudResponse>
updateTag(id: string, data: UpdateTagForm): Promise<CrudResponse>
deleteTag(id: string): Promise<{ msg: string }>

/** === Funções === */
createFuncao(data: CreateFuncaoForm): Promise<CrudResponse>
updateFuncao(id: string, data: UpdateFuncaoForm): Promise<CrudResponse>
deleteFuncao(id: string): Promise<{ msg: string }>

/** === Tonalidades === */
createTonalidade(data: CreateTonalidade): Promise<CrudResponse>
updateTonalidade(id: string, data: UpdateTonalidade): Promise<CrudResponse>
deleteTonalidade(id: string): Promise<{ msg: string }>

/** === Tipos de Evento === */
createTipoEvento(data: CreateTipoEvento): Promise<CrudResponse>
updateTipoEvento(id: string, data: UpdateTipoEvento): Promise<CrudResponse>
deleteTipoEvento(id: string): Promise<{ msg: string }>

/** === Artistas (para listagem geral) === */
getArtistas(): Promise<Artista[]>
```

---

## 2. Hooks (Camada React Query)

### `hooks/use-artistas.ts` (NOVO)

```typescript
useArtistas(): UseQueryResult<Artista[]>
useCreateArtista(): UseMutationResult
useUpdateArtista(): UseMutationResult
useDeleteArtista(): UseMutationResult
```

### `hooks/use-musicas.ts` (extensões)

```typescript
// Existentes: useMusicas, useCreateMusica
useMusica(id: string | null): UseQueryResult<Musica>  // já existe
useUpdateMusica(): UseMutationResult
useDeleteMusica(): UseMutationResult

// Versões
useAddVersao(musicaId: string): UseMutationResult
useUpdateVersao(musicaId: string): UseMutationResult
useRemoveVersao(musicaId: string): UseMutationResult

// Tags
useAddTagMusica(musicaId: string): UseMutationResult
useRemoveTagMusica(musicaId: string): UseMutationResult

// Funções
useAddFuncaoMusica(musicaId: string): UseMutationResult
useRemoveFuncaoMusica(musicaId: string): UseMutationResult
```

### `hooks/use-eventos.ts` (extensões)

```typescript
// Existentes: useEventos, useEvento, useCreateEvento, useAdd/RemoveMusica/Integrante
useUpdateEvento(): UseMutationResult
useDeleteEvento(): UseMutationResult
```

### `hooks/use-integrantes.ts` (extensões)

```typescript
// Existentes: useIntegrantes, useIntegrante, useCreate/Update/Delete
useAddFuncaoIntegrante(integranteId: string): UseMutationResult
useRemoveFuncaoIntegrante(integranteId: string): UseMutationResult
```

### `hooks/use-support.ts` (extensões)

```typescript
// Existentes: useTonalidades, useFuncoes, useTiposEventos
useCreateTag(): UseMutationResult
useUpdateTag(): UseMutationResult
useDeleteTag(): UseMutationResult

useCreateFuncao(): UseMutationResult
useUpdateFuncao(): UseMutationResult
useDeleteFuncao(): UseMutationResult

useCreateTonalidade(): UseMutationResult
useUpdateTonalidade(): UseMutationResult
useDeleteTonalidade(): UseMutationResult

useCreateTipoEvento(): UseMutationResult
useUpdateTipoEvento(): UseMutationResult
useDeleteTipoEvento(): UseMutationResult

useTags(): UseQueryResult<IdNome[]>
useArtistas(): UseQueryResult<Artista[]>
```

---

## 3. Componentes

### Novos Componentes

| Componente | Tipo | Descrição |
|------------|------|-----------|
| `DeleteConfirmDialog` | Component | Dialog reutilizável de confirmação de exclusão (AlertDialog do shadcn/ui) |
| `ConfigCrudSection<T>` | Component | Seção CRUD genérica para entidades auxiliares na página de Configurações |
| `VersaoForm` | Component | Dialog para criar/editar versão de música (artista, BPM, cifras, letras, link) |
| `MusicaDetail` | Component | Componente principal da página de detalhes da música |

### Novas Páginas

| Página | Rota | Descrição |
|--------|------|-----------|
| `SongDetail` | `/musicas/:id` | Página de detalhes da música com edição, versões, tags e funções |
| `Settings` | `/configuracoes` | Página de configurações com abas para entidades auxiliares |

### Componentes Modificados

| Componente | Alteração |
|------------|-----------|
| `AppSidebar` | Adicionar item "Configurações" com ícone Settings ao menu |
| `EventoForm` | Suportar modo edição (receber dados existentes, usar PUT) |
| `EventoDetail` | Adicionar botões Editar e Excluir |
| `IntegranteForm` | Adicionar seção de funções com badges + seletor |
| `MusicaForm` | Suportar modo edição (receber dados existentes, usar PUT) |
| `Songs` (page) | Adicionar navegação para detalhes, busca funcional |
| `Scales` (page) | Habilitar botão Editar, adicionar botão Excluir |
| `Members` (page) | Adicionar busca funcional |
| `Dashboard` (page) | Substituir dados fictícios por dados reais |
| `App` | Adicionar rotas `/musicas/:id` e `/configuracoes` |

---

## 4. Cache Invalidation Strategy

| Mutation | Invalidates |
|----------|-------------|
| Create/Update/Delete Artista | `["artistas"]` |
| Update/Delete Música | `["musicas"]`, `["musica", id]` |
| Add/Update/Remove Versão | `["musica", musicaId]` |
| Add/Remove Tag Música | `["musica", musicaId]` |
| Add/Remove Função Música | `["musica", musicaId]` |
| Update/Delete Evento | `["eventos"]`, `["evento", id]` |
| Add/Remove Função Integrante | `["integrantes"]`, `["integrante", id]` |
| Create/Update/Delete Tag | `["tags"]` |
| Create/Update/Delete Função | `["funcoes"]` |
| Create/Update/Delete Tonalidade | `["tonalidades"]` |
| Create/Update/Delete TipoEvento | `["tiposEventos"]` |
