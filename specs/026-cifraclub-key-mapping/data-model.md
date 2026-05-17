# Phase 1 — Data Model: 026 CifraClub Key Mapping

**Branch**: `026-cifraclub-key-mapping` · **Date**: 2026-05-17

## Resumo de impacto no modelo de dados

| Camada | Mudança |
|---|---|
| **Banco PostgreSQL** | **Nenhuma.** Zero migrações. Zero colunas novas. Zero índices. |
| **Prisma schema** | **Nenhuma.** `packages/backend/prisma/schema.prisma` não é tocado. |
| **TypeScript types (backend)** | 2 campos adicionados em `CifraclubPlaylistItem` (response do endpoint da 025). |
| **Zod schemas (frontend)** | Schema do response da playlist ganha os 2 mesmos campos. |

A feature é **puramente um transformer de string** — não há entidade nova, não há relacionamento novo, não há ciclo de vida.

---

## Dados consumidos (leitura)

A feature lê os dados abaixo que já existem no schema atual. Nenhum dado novo é persistido.

### Música (`Musicas`)

Campo relevante: `fk_tonalidade` (FK opcional para `Tonalidades`).

| Atributo | Origem | Uso na feature |
|---|---|---|
| `musicas.fk_tonalidade` | Já existe | FK para resolver tom |
| `tonalidades.tom` (string) | Já existe | **Entrada principal** do cálculo `#key=N`. Ex.: "A", "Bb", "Em" |

### Versão (`Artistas_Musicas`)

| Atributo | Origem | Uso na feature |
|---|---|---|
| `artistas_musicas.cifraclub_url` | Adicionado pela **025** | URL base da cifra. Substituímos o fragmento por `#key=N`. |

### Escala (`Eventos_Musicas`)

| Atributo | Origem | Uso na feature |
|---|---|---|
| `eventos_musicas.fk_artistas_musicas` | Já existe | Identifica versão selecionada por escala (já usado pela 025) |
| `eventos_musicas.ordem` | Já existe | Ordem da música na playlist (já usado pela 025) |

---

## Entidade de resposta enriquecida

### `CifraclubPlaylistItem` (response item — TypeScript / Zod / OpenAPI)

Tipo lógico do item retornado pelo endpoint `GET /api/eventos/:id/cifraclub-playlist`. Os campos `tom_final` e `tom_ajustado` são **novos nesta feature**.

```typescript
interface CifraclubPlaylistItem {
  ordem: number;                      // [025] posição na playlist (>= 1)
  musica_id: string;                  // [025] UUID da Música
  nome: string;                       // [025] nome da Música
  tom: string | null;                 // [025] tom cru da Música (Tonalidades.tom) — pode vir nulo se música sem tom
  artista_nome: string | null;        // [025] nome do artista da versão selecionada (null para versão sem artista)
  cifraclub_url: string | null;       // [026] URL FINAL: já contém #key=N quando tom_ajustado=true; ou URL original cadastrada caso contrário
  tom_final: string | null;           // [026] NOVO — grafia canônica CifraClub do tom efetivamente usado (ex.: "Bb", "F#"); null se sem tom
  tom_ajustado: boolean;              // [026] NOVO — true sse a URL foi enriquecida com #key=N; false caso contrário
}
```

### Invariantes

| ID | Invariante | Como garantir |
|---|---|---|
| INV-1 | `tom_ajustado === true` ⇒ `cifraclub_url` termina com `#key=N` para algum `N ∈ [0, 11]` | Função pura `applyKeyFragment` controlada pelo backend |
| INV-2 | `tom_ajustado === false` ⇒ `cifraclub_url` é literalmente o valor cadastrado em `Artistas_Musicas.cifraclub_url` (sem modificação) | Idem |
| INV-3 | `cifraclub_url === null` ⇒ `tom_ajustado === false` ∧ `tom_final` pode ser `string` ou `null` (independente) | Validação no construtor da resposta |
| INV-4 | `tom_final !== null` ⇒ `tom_final ∈ ['A','Bb','B','C','Db','D','Eb','E','F','F#','G','Ab']` | Derivado da tabela canônica via `CIFRACLUB_KEY_LABEL[N]` |
| INV-5 | Idempotência: 2 chamadas consecutivas ao endpoint com mesmos dados retornam o mesmo `cifraclub_url` final | Pureza de `applyKeyFragment` + `toCifraclubKey` |

### Estado/transições

A entidade não tem ciclo de vida persistido (é só uma projeção em memória). Os 4 estados possíveis de um item são puramente derivados:

| Estado | `tom` (input) | `cifraclub_url` (input) | `tom_ajustado` | `tom_final` | `cifraclub_url` (output) |
|---|---|---|---|---|---|
| **Pleno** | tom válido | URL cadastrada | `true` | grafia CifraClub | URL + `#key=N` |
| **Sem URL** | tom válido | `null` | `false` | grafia CifraClub | `null` |
| **Tom inválido/ausente, com URL** | inválido/null | URL cadastrada | `false` | `null` | URL original (preserva fragmento original se houver) |
| **Vazio** | inválido/null | `null` | `false` | `null` | `null` |

---

## Tabela de mapeamento (constante de código)

Não persistida no banco. Definida em `packages/backend/src/lib/cifraclub-key.ts`. Documentada aqui para referência cruzada com a spec.

### Entrada → `N`

| Grafia aceita | `N` | Notas |
|---|---|---|
| `A`, `Am`, `A7`, `Asus`, `a` | 0 | Sufixos descartados; uppercase aplicado |
| `Bb`, `A#`, `Bbm`, `A#m7` | 1 | Enarmônicos equivalentes |
| `B`, `Bm` | 2 | |
| `C`, `Cm`, `C/G` | 3 | Baixo invertido descartado |
| `Db`, `C#`, `Dbm` | 4 | Enarmônicos equivalentes |
| `D`, `Dm` | 5 | |
| `Eb`, `D#` | 6 | Enarmônicos equivalentes |
| `E`, `Em` | 7 | |
| `F`, `Fm` | 8 | |
| `F#`, `Gb`, `F#m` | 9 | Enarmônicos equivalentes |
| `G`, `Gm` | 10 | |
| `Ab`, `G#`, `Abm` | 11 | Enarmônicos equivalentes |
| `""`, `null`, `"X"`, `"123"` | — | Retorna `null`, marca `tom_ajustado: false` |
| `F♯`, `B♭` | 9, 1 | Caracteres Unicode normalizados para ASCII antes do lookup |

### `N` → grafia canônica (`tom_final`)

```typescript
['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']
//  0    1    2    3    4    5    6    7    8    9    10   11
```

---

## Compatibilidade & migração de dados

- **Forward**: Nenhuma. Campos novos são apenas na resposta JSON do endpoint; clientes antigos (caso houvesse) ignorariam os campos extras (princípio de tolerância JSON).
- **Backward**: Se a feature for revertida, o frontend que espera os campos novos precisa um fallback (`tom_final ?? tom`, `tom_ajustado ?? false`). Implementado defensivamente no schema Zod do frontend.
- **Migração de banco**: nenhuma. `prisma migrate dev` não roda nada para esta feature.
