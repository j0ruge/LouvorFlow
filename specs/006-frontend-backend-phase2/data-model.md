# Data Model: Integração Frontend-Backend (Fase 2)

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17

Este documento descreve os schemas Zod e tipos TypeScript necessários no frontend para a Fase 2. Os schemas existentes da Fase 1 são referenciados mas não duplicados.

## Schemas Existentes (Fase 1 — sem alteração)

### `schemas/shared.ts`

| Campo | Tipo | Regras |
|-------|------|--------|
| `IdNome.id` | `string (UUID)` | Obrigatório |
| `IdNome.nome` | `string` | Obrigatório |
| `Tonalidade.id` | `string (UUID)` | Obrigatório |
| `Tonalidade.tom` | `string` | Obrigatório |
| `ApiErrorResponse.erro` | `string` | Obrigatório |
| `ApiErrorResponse.codigo` | `number` | Obrigatório |
| `PaginationMeta.total` | `number` | Obrigatório |
| `PaginationMeta.page` | `number` | Obrigatório |
| `PaginationMeta.per_page` | `number` | Obrigatório |
| `PaginationMeta.total_pages` | `number` | Obrigatório |

### `schemas/musica.ts` (existente)

| Tipo | Campos |
|------|--------|
| `Versao` | `id, artista: {id, nome}, bpm?, cifras?, lyrics?, link_versao?` |
| `Musica` | `id, nome, tonalidade?, tags[], versoes[], funcoes[]` |
| `MusicasPaginadas` | `items: Musica[], meta: PaginationMeta` |
| `CreateMusicaForm` | `nome, fk_tonalidade` |

### `schemas/integrante.ts` (existente)

| Tipo | Campos |
|------|--------|
| `IntegranteComFuncoes` | `id, nome, doc_id, email, telefone?, funcoes[]` |
| `CreateIntegranteForm` | `nome, doc_id, email, senha (min 6), telefone?` |
| `UpdateIntegranteForm` | `nome, doc_id, email, senha? (opcional), telefone?` |

### `schemas/evento.ts` (existente)

| Tipo | Campos |
|------|--------|
| `EventoIndex` | `id, data, descricao, tipo_evento, musicas: IdNome[], integrantes: IdNome[]` |
| `EventoShow` | `id, data, descricao, tipo_evento, musicas: MusicaEvento[], integrantes: IntegranteEvento[]` |
| `CreateEventoForm` | `data, fk_tipo_evento, descricao` |

---

## Novos Schemas (Fase 2)

### `schemas/artista.ts` (NOVO)

| Tipo | Campos | Regras |
|------|--------|--------|
| `Artista` | `id: string, nome: string` | UUID, obrigatórios |
| `ArtistaResponse` | `msg: string, artista: Artista` | Resposta de criação/edição |
| `CreateArtistaForm` | `nome: string` | `nome` min 1 caractere, trim |
| `UpdateArtistaForm` | `nome: string` | `nome` min 1 caractere, trim |

### `schemas/musica.ts` (extensões)

| Tipo | Campos | Regras |
|------|--------|--------|
| `UpdateMusicaForm` | `nome: string, fk_tonalidade: string` | Mesmas regras de CreateMusicaForm |
| `CreateVersaoForm` | `artista_id: string, bpm?: number, cifras?: string, lyrics?: string, link_versao?: string` | `artista_id` obrigatório; BPM >= 1 se informado |
| `UpdateVersaoForm` | `bpm?: number, cifras?: string, lyrics?: string, link_versao?: string` | BPM >= 1 se informado |
| `MusicaDetailResponse` | `Musica` (completo com versões, tags, funções) | Resposta do `GET /musicas/:id` |

### `schemas/evento.ts` (extensões)

| Tipo | Campos | Regras |
|------|--------|--------|
| `UpdateEventoForm` | `data?: string, fk_tipo_evento?: string, descricao?: string` | Campos opcionais, ao menos 1 deve estar presente |

### `schemas/support.ts` (extensões para CRUD)

| Tipo | Campos | Regras |
|------|--------|--------|
| `CreateTagForm` | `nome: string` | min 1 caractere, trim |
| `UpdateTagForm` | `nome: string` | min 1 caractere, trim |
| `CreateFuncaoForm` | `nome: string` | min 1 caractere, trim |
| `UpdateFuncaoForm` | `nome: string` | min 1 caractere, trim |
| `CreateTonalidade` | `tom: string` | min 1 caractere, trim |
| `UpdateTonalidade` | `tom: string` | min 1 caractere, trim |
| `CreateTipoEvento` | `nome: string` | min 1 caractere, trim |
| `UpdateTipoEvento` | `nome: string` | min 1 caractere, trim |
| `CrudResponse` | `msg: string, [entity]: object` | Resposta genérica de CRUD |

---

## Diagrama de Relações (Frontend)

```text
Artista ──1:N──▶ Versão ◀──N:1── Música
                                    │
                                    ├──N:M──▶ Tag
                                    ├──N:M──▶ Função
                                    └──N:M──▶ Evento (via evento_musicas)

Integrante ──N:M──▶ Função
Integrante ──N:M──▶ Evento (via evento_integrantes)

Evento ──N:1──▶ TipoEvento
Música ──N:1──▶ Tonalidade
```

---

## Mapeamento Endpoint → Schema

| Endpoint | Método | Schema Request | Schema Response |
|----------|--------|----------------|-----------------|
| `/artistas` | GET | — | `Artista[]` |
| `/artistas` | POST | `CreateArtistaForm` | `ArtistaResponse` |
| `/artistas/:id` | GET | — | `Artista` |
| `/artistas/:id` | PUT | `UpdateArtistaForm` | `ArtistaResponse` |
| `/artistas/:id` | DELETE | — | `{ msg }` |
| `/musicas/:id` | GET | — | `Musica` (completo) |
| `/musicas/:id` | PUT | `UpdateMusicaForm` | `MusicaCreateResponse` |
| `/musicas/:id` | DELETE | — | `{ msg }` |
| `/musicas/:id/versoes` | GET | — | `Versao[]` |
| `/musicas/:id/versoes` | POST | `CreateVersaoForm` | `{ msg, versao }` |
| `/musicas/:id/versoes/:vid` | PUT | `UpdateVersaoForm` | `{ msg, versao }` |
| `/musicas/:id/versoes/:vid` | DELETE | — | `{ msg }` |
| `/musicas/:id/tags` | GET | — | `IdNome[]` |
| `/musicas/:id/tags` | POST | `{ tag_id }` | `{ msg }` |
| `/musicas/:id/tags/:tid` | DELETE | — | `{ msg }` |
| `/musicas/:id/funcoes` | GET | — | `IdNome[]` |
| `/musicas/:id/funcoes` | POST | `{ funcao_id }` | `{ msg }` |
| `/musicas/:id/funcoes/:fid` | DELETE | — | `{ msg }` |
| `/eventos/:id` | PUT | `UpdateEventoForm` | `{ msg, evento }` |
| `/eventos/:id` | DELETE | — | `{ msg }` |
| `/integrantes/:id/funcoes` | GET | — | `IdNome[]` |
| `/integrantes/:id/funcoes` | POST | `{ funcao_id }` | `{ msg }` |
| `/integrantes/:id/funcoes/:fid` | DELETE | — | `{ msg }` |
| `/tags` | POST | `CreateTagForm` | `CrudResponse` |
| `/tags/:id` | PUT | `UpdateTagForm` | `CrudResponse` |
| `/tags/:id` | DELETE | — | `{ msg }` |
| `/funcoes` | POST | `CreateFuncaoForm` | `CrudResponse` |
| `/funcoes/:id` | PUT | `UpdateFuncaoForm` | `CrudResponse` |
| `/funcoes/:id` | DELETE | — | `{ msg }` |
| `/tonalidades` | POST | `CreateTonalidade` | `CrudResponse` |
| `/tonalidades/:id` | PUT | `UpdateTonalidade` | `CrudResponse` |
| `/tonalidades/:id` | DELETE | — | `{ msg }` |
| `/tipos-eventos` | POST | `CreateTipoEvento` | `CrudResponse` |
| `/tipos-eventos/:id` | PUT | `UpdateTipoEvento` | `CrudResponse` |
| `/tipos-eventos/:id` | DELETE | — | `{ msg }` |
