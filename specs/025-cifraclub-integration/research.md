# Phase 0 — Research: Integração CifraClub

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-24

Decisões técnicas consolidadas das 3 specs originais (025, 026, 027) + clarificações da sessão unificada.

---

## 1. Campo `cifraclub_url` em versões (FR-001–FR-004)

**Decisão**: Coluna `cifraclub_url TEXT NULL` em `artistas_musicas`. Validação via `safeUrlSchema` existente (aceita qualquer http/https, rejeita javascript:/data:/vbscript:). Sem restrição de domínio.

**Rationale**: O campo `link_versao` já existe com a mesma semântica genérica. `cifraclub_url` é um campo **separado** (não substitui `link_versao`) porque serve um propósito específico — alimentar a playlist CifraClub com transposição. Reutiliza o `safeUrlSchema` que já valida URLs seguras.

**Alternativas rejeitadas**: (a) Reuso de `link_versao` — rejeitado porque misturaria YouTube com CifraClub; (b) Validação de domínio `cifraclub.com.br` — rejeitado por existirem variantes legítimas (`m.cifraclub.com.br`).

---

## 2. Endpoint `GET /api/eventos/:id/cifraclub-playlist` (FR-005–FR-009)

**Decisão**: Novo endpoint no controller de Eventos. Reutiliza `EVENTO_SHOW_SELECT` (que já inclui `Eventos_Musicas` com versões e tonalidade). O service monta a playlist transformando os dados já carregados — sem query adicional.

**Rationale**: O select existente já traz músicas com versões, tonalidade e artista. A resolução do link (versão selecionada → fallback primeira versão → null) é lógica pura no service. Performance <300ms p95 garantida pelo mesmo invariante dos endpoints existentes.

**Resposta**:

```typescript
{
  evento: { id, data, descricao, tipo_evento },
  playlist: [{
    ordem, musica_id, nome, tom, tom_final, tom_ajustado,
    artista_nome, cifraclub_url // com #key=N se aplicável
  }],
  stats: { total, com_link, sem_link },
  cifraclub_list_url: string | null // campo do evento (FR-028)
}
```

---

## 3. Cálculo de `#key=N` (FR-017–FR-024)

**Decisão**: Função pura `computeKeyFragment(tom: string): { N: number, tom_final: string } | null` em `src/lib/cifraclub-key-mapping.ts`. Tabela hardcoded:

```typescript
const CHROMATIC_MAP: Record<string, number> = {
  'A': 0, 'Bb': 1, 'B': 2, 'C': 3, 'Db': 4, 'D': 5,
  'Eb': 6, 'E': 7, 'F': 8, 'F#': 9, 'G': 10, 'Ab': 11
};
const ENHARMONIC_MAP: Record<string, string> = {
  'A#': 'Bb', 'C#': 'Db', 'D#': 'Eb', 'Gb': 'F#', 'G#': 'Ab'
};
```

**Etapas do cálculo**:
1. Normalizar Unicode (♭→b, ♯→#)
2. Extrair nota raiz (regex `/^([A-Ga-g][#b♯♭]?)/` — descartar m, maj, 7, /X)
3. Uppercase primeira letra
4. Mapear enarmônicos para grafia canônica CifraClub
5. Lookup na tabela cromática → N
6. Retornar `{ N, tom_final }` ou `null` se não-mapeável

**Aplicação à URL**:
1. Verificar domínio contém `cifraclub.com.br` (case-insensitive) — senão, skip
2. Separar URL em `base?query#fragment`
3. Substituir fragmento por `#key=N`
4. Reconstruir: `base` + (query ? `?${query}` : '') + `#key=${N}`

**Rationale**: Função pura, zero I/O, testável exaustivamente. Duplicada no frontend para validação visual (badge de tom).

---

## 4. Regex de URL de lista CifraClub (FR-026)

**Decisão**: Regex case-insensitive com suporte a query string e fragmento:

```regex
^https://www\.cifraclub\.com\.br/musico/(\d+)/repertorio/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)/?(\?[^#]*)?(#.*)?$
```

Grupos: (1) userId, (2) listId/slug, (3) query string, (4) fragmento.

Função `validateCifraclubListUrl(url): { valid, userId?, listId?, isSystemList }`.

**Rationale**: Regex cobre formatos reais observados + edge cases EC-14 (query), EC-15 (sistema), EC-17 (fragmento), EC-23 (casing). Copiada 1:1 entre backend e frontend (YAGNI sobre lib compartilhada).

---

## 5. Preview da lista (FR-035)

**Decisão**: Frontend-only. `fetchListPreview(url, signal): Promise<ListPreview | null>`.

```typescript
interface ListPreview {
  name: string;
  ownerName: string;
  totalSongs: number;
  isPublic: boolean;
}
```

- Endpoint: `GET https://api.cifraclub.com.br/v3/songbook/{listId}`
- Timeout: 3s via AbortController
- Listas-sistema (slug não-numérico): skip fetch, retornar null
- Qualquer erro: retornar null (preview some, cadastro continua)
- Zero código backend

**Rationale**: CORS confirmado aberto. Não criar proxy para manter YAGNI. Preview é bônus, nunca gate.

---

## 6. Staleness detection (FR-033)

**Decisão**: Campo derivado `cifraclub_list_url_stale: boolean` computado no service ao montar a resposta de `GET /api/eventos/:id`. Lógica:

```typescript
const stale = evento.cifraclub_list_url != null
  && evento.cifraclub_list_url_updated_at != null
  && latestMusicaUpdatedAt != null
  && latestMusicaUpdatedAt > evento.cifraclub_list_url_updated_at;
```

Onde `latestMusicaUpdatedAt = MAX(eventos_musicas.updated_at)` — obtido via `take: 1, orderBy: { updated_at: 'desc' }` já incluído no `EVENTO_SHOW_SELECT`.

**Rationale**: Uma sub-query `take: 1` é desprezível em performance. Inclui reordenação (Q11). Não persistido — derivado por request.

---

## 7. Formato WhatsApp — Playlist (FR-015)

**Decisão**: Formatador puro `formatCifraclubPlaylist(evento, playlist, stats): string`:

```text
*🎸 Cifras — {tipo_evento}*
_{data pt-BR} · {com_link} de {total} músicas com cifra_

1. {nome} ({tom_final}) — {artista}
   {cifraclub_url_com_key}
2. {nome} ({tom_final})
   _(sem cifra cadastrada)_
...

📱 _Toque em cada link para abrir a cifra no app do CifraClub._
```

---

## 8. Formato WhatsApp — Lista única (FR-032)

**Decisão**: Formatador puro `formatCifraclubListShare(evento): string`:

```text
*{tipo_evento}* — _{data pt-BR}_

🎸 *Lista no CifraClub*: {cifraclub_list_url}

_Toque para abrir no app do CifraClub._
```

**Guard**: Verificar `encodeURIComponent(text).length > WHATSAPP_URL_SAFE_LIMIT` antes de abrir `wa.me`. Se exceder: toast + clipboard fallback.

---

## 9. Coexistência de shares (FR-037)

**Decisão**: Diálogo `CifraclubPlaylistDialog` tem 4 botões no footer: "Copiar links" | "WhatsApp" (playlist) | "Lista no CifraClub" (condicional) | "Fechar". Os shares existentes em `EscalaShareActions` permanecem 100% inalterados.

**Rationale**: Dois recursos independentes são mais simples de evoluir (KISS). Nenhum checkbox, merge ou toggle.

---

## 10. Permissões e RBAC

**Decisão**:
- **Playlist endpoint** (GET): `ensureAuthenticated + ensureTenantContext` (qualquer usuário autenticado). Sem `can()` — é read-only.
- **`cifraclub_url` em versão** (POST/PUT): protegido pelo middleware existente `can(['musicas.write'])` nos endpoints de versão.
- **`cifraclub_list_url` em evento** (POST/PUT): protegido pelo middleware existente `can(['escalas.write'])` nos endpoints de evento.
- **UI**: Campo `cifraclub_list_url` desabilitado + tooltip para usuários sem `escalas.write` (via `useCan`).
