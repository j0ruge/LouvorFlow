# Phase 0 — Research: 026 CifraClub Key Mapping

**Branch**: `026-cifraclub-key-mapping` · **Date**: 2026-05-17

Decisões técnicas que destravam o Phase 1 (design). Cada item segue o formato `Decisão · Rationale · Alternativas consideradas`.

---

## 1. Dependência operacional sobre a feature 025

**Decisão**: Tratar a 025 como **pré-requisito implementacional rígido**. O plano de tarefas (`/speckit.tasks`) será gerado assumindo que `Artistas_Musicas.cifraclub_url`, o endpoint `GET /api/eventos/:id/cifraclub-playlist` e o `CifraclubPlaylistDialog` já existem. Se ao iniciar a implementação a 025 ainda não estiver merged, executar 025 primeiro (PR separado, baseado em master) e depois rebasear 026.

**Rationale**: A 025 é um corpo de trabalho independente com seu próprio PRD detalhado, testes e migração de schema. Embuti-la em 026 dobraria o tamanho do PR sem ganho — apenas atrasaria a entrega e dificultaria revisão. A 026 é genuinamente uma **extensão pequena e cirúrgica** (sem schema, ~6h) que faz sentido como entrega separada.

**Alternativas consideradas**:

- **Bundle 025+026 num PR único**: rejeitado. PR ficaria com 12–15 arquivos de domínio + 1 migration + ~600 linhas de delta — alto custo de revisão. Sem benefício, dado que 026 só consome artefatos de 025.
- **Aguardar 025 em produção real antes de mergear 026**: alternativa válida mas desnecessariamente conservadora. Basta que 025 esteja merged em master antes do merge da 026 (não precisa estar em prod). Permite as duas features irem juntas no mesmo release.

**Verificação no estado atual do repo (2026-05-17)**:

- `Artistas_Musicas.cifraclub_url` **não existe** (`grep` no schema confirma).
- Endpoint `cifraclub-playlist` **não existe** (sem refs em `routes/eventos.routes.ts`).
- Único artefato de 025 mergeado: o PRD em `specs/025-cifraclub-playlist-integration/prd.md` (commit `5292f94`).
- Existe branch remoto `claude/cifraclube-playlist-integration-bftFM` mas só com docs (também sem implementação).

Ação acionável: equipe decide a ordem antes de `/speckit.tasks`. Se 025 será implementada agora, gerar tasks de 025 primeiro (re-rodar `/speckit.plan` para 025) e só depois rodar `/speckit.tasks` para 026.

---

## 2. Definição operacional de "tom da escala"

**Decisão**: Para esta entrega, **"tom da escala" = tom da Música cadastrado em `Musicas.fk_tonalidade → Tonalidades.tom`**, lido junto da playlist via `EVENTO_SHOW_SELECT` já existente. Não há override por escala. Cada música possui um único tom, válido globalmente para o tenant.

**Rationale**: O schema atual não comporta override per-`eventos_musicas`. Adicionar essa coluna é uma decisão de produto independente e não é necessária para entregar valor: na maioria dos casos a equipe muda o tom da música globalmente quando precisa adequar à tessitura do vocalista. Manter escopo apertado preserva a Simplicity (Princípio V).

**Alternativas consideradas**:

- **Adicionar `eventos_musicas.tom_override TEXT NULL`**: viável tecnicamente (campo nullable, sem backfill, sem breaking change). Mas implica nova migração Prisma, mudança em validators, exposição em outro endpoint, atualização da UI da Escala (input de tom por linha) — escopo significativamente maior que o desta feature. Endereçar em spec futura ("027-per-escala-tom-override") se houver demanda real.
- **Ler tom de `Artistas_Musicas` (versão)**: rejeitado. Constituição IV é explícita: tom é atributo da Música. Versão tem cifra/lyrics/bpm/link/intensidade, sem tom.

---

## 3. Tabela cromática absoluta (canonical CifraClub)

**Decisão**: Tabela fixa em código (não em banco):

```typescript
const CIFRACLUB_KEY_MAP: Record<string, number> = {
  // Notas naturais
  A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10,
  // Bemóis canônicos do CifraClub
  Bb: 1, Db: 4, Eb: 6, Ab: 11,
  // Sustenido canônico do CifraClub
  'F#': 9,
  // Enarmônicos aceitos como entrada (mapeiam para o mesmo N)
  'A#': 1, 'C#': 4, 'D#': 6, Gb: 9, 'G#': 11,
};
```

Grafia canonical de saída (campo `tom_final`):

```typescript
const CIFRACLUB_KEY_LABEL: readonly string[] =
  ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab'];
// CIFRACLUB_KEY_LABEL[N] devolve a grafia canônica para um N ∈ [0, 11]
```

**Rationale**: Tabela canônica vem do seletor de tom oficial do CifraClub (screenshot capturado pelo usuário em 2026-05-17 e referenciado em [spec.md §Clarifications](./spec.md#clarifications)). Manter em código garante zero latência, zero query de banco, zero risco de divergência entre tenants. A simetria entre o map de entrada (12 grafias canônicas + 5 enarmônicas) e o array de saída (12 labels canônicos) torna `applyKeyFragment` e a derivação de `tom_final` triviais.

**Alternativas consideradas**:

- **Tabela em `Tonalidades` (banco)**: adicionaria `Tonalidades.cifraclub_key INT` por linha. Rejeitado por YAGNI — não temos requisito de personalização por tenant; ainda precisaria de seed e migração; complica casos onde tenants criam novas tonalidades.
- **Cálculo aritmético (parser + offset cromático)**: viável mas complica o teste e a leitura. Tabela explícita é "executable documentation" — qualquer dev lê 14 linhas e entende.
- **Aceitar caracteres Unicode `♯/♭`**: tratamento de input apenas (normalização antes do lookup), não impacta a tabela. Coberto em §4.

---

## 4. Normalização de input de tom

**Decisão**: Antes do lookup na tabela, aplicar este pipeline puro:

```text
tom (raw) → trim → replace ♯→#, ♭→b → strip modal/extension suffix → match root note
```

Onde "strip suffix" remove qualquer caractere após a nota raiz potencial (`A`, `Bb`, `F#`, etc.). Exemplos:

| Input | Após normalização | `N` |
|-------|-------------------|-----|
| `"A"` | `"A"` | 0 |
| `"Am"` | `"A"` | 0 |
| `"A#m7"` | `"A#"` | 1 |
| `"Bb/D"` | `"Bb"` | 1 |
| `"F♯"` | `"F#"` | 9 |
| `"  e  "` | `"E"` (uppercase + trim) | 7 |
| `""` | — | `null` (sem fragmento, `tom_ajustado: false`) |
| `"X"` | — | `null` |
| `null/undefined` | — | `null` |

Regex de extração da raiz: `^\s*([A-Ga-g])([#b])?` aplicado após substituições Unicode. Se não casar, retornar `null`.

**Rationale**: A flexibilidade de input reflete a realidade do dataset (líderes digitam de formas variadas). Pipeline puro (sem efeito colateral, sem I/O) é trivial de testar e raciocinar. Decisão de uppercase a letra raiz garante que `a` e `A` sejam o mesmo tom — defensiva contra erro de digitação.

**Alternativas consideradas**:

- **Rejeitar inputs com sufixo**: muito restritivo; quebraria escalas históricas que tem `"Am"` ou `"Dsus4"`.
- **Lib externa de parsing musical (ex.: `tonal.js`)**: 200KB+ de dependência por <30 linhas de código. Violenta Princípio V (Simplicity).

---

## 5. Smoke test pré-implementação (D2 da spec)

**Decisão**: Antes de qualquer código de produção, um dev abre 3 cifras de tom-base diferente no CifraClub e valida manualmente o comportamento de `#key=N` para `N ∈ {0, 1, 5, 7, 11}`. O cenário esperado: a cifra é renderizada cromaticamente conforme a tabela `A=0, Bb=1, …, Ab=11` da §3, **independentemente do tom-base catalogado pelo CifraClub**. Resultado documentado em [quickstart.md §1](./quickstart.md).

**Rationale**: A spec foi clarificada na hipótese H2 (absoluta) com base em duas amostras (`A=0`, `Bb=1`). Validar com 3 cifras × 5 valores (15 observações) elimina o risco de a hipótese estar errada. Custo: ~30 min. Custo de descobrir o erro pós-deploy: refatorar a feature inteira e retrabalhar a comunicação com a equipe — ordens de magnitude maior.

**Alternativas consideradas**:

- **Confiar nos 2 exemplos do usuário e implementar direto**: economiza 30 min, arrisca semanas. Não vale.
- **Automatizar via Puppeteer/Playwright**: overkill — a verificação é uma vez só, manual basta. Se a hipótese se confirmar, não precisamos repetir.

---

## 6. Substituição de fragmento com query string preservada (decisão Q2)

**Decisão**: Função `applyKeyFragment(url, N)` em `packages/backend/src/lib/cifraclub-key.ts` faz:

1. `URL.parse(url)` (API nativa do Node).
2. Substitui `.hash` por `#key=${N}` independentemente do valor anterior.
3. Mantém `.search` (query string) intacta.
4. Retorna `url.toString()`.

Quando `N` é `null` (tom inválido ou ausente), retorna a URL original **inalterada** (incluindo fragmento original, se houver). Isso atende EC-4 (fallback preserva o que o líder cadastrou).

**Rationale**: Usar o parser nativo de URL elimina edge cases de string manipulation (URLs com `?` no path, fragments com `#` extras, etc.). API nativa do Node 18+ é estável e zero-cost.

**Alternativas consideradas**:

- **Manipulação por string (split em `#`)**: bug-prone — quebra para URLs com `#` na query encoded, ou múltiplos `#`.
- **Lib `query-string` ou `url-parse`**: dependência desnecessária; API nativa já cobre 100% do caso.

---

## 7. Tratamento de erro (resiliência — SC-004)

**Decisão**: A função `applyKeyFragment` **nunca lança**. Em qualquer cenário:

- URL malformada (não parseável) → retorna a string original sem alteração + `tom_ajustado: false`.
- Tom inválido → não modifica URL + `tom_ajustado: false`.
- Tom válido + URL válida → URL com `#key=N` + `tom_ajustado: true`.

Logging: em casos de URL malformada ou tom inválido, logar `console.warn` com `{ eventoId, musicaId, motivo }` para alimentar métricas futuras (SC-003 — % de `tom_ajustado: false`).

**Rationale**: O endpoint da playlist NUNCA deve falhar com 500 por causa de um dado de música malformado. Graceful degradation é o comportamento correto — o líder ainda vê a lista, só fica sem transposição naquele item.

**Alternativas consideradas**:

- **Lançar e capturar no controller**: complica o controller, polui error handler centralizado.
- **Sem logging**: perdemos visibilidade sobre qualidade de dados; SC-003 fica difícil de medir.

---

## 8. Testes (cobertura)

**Decisão**: Cobertura mínima para mergear:

- **Unit (`packages/backend/tests/lib/cifraclub-key.test.ts`)**: tabela exaustiva (12 notas × ~3 grafias cada = ~30 casos), modal (`Am`, `A#m7`), enarmônicos (`A# == Bb`), Unicode (`F♯ == F#`), edge cases (vazio, null, "X", `URL` malformada).
- **Integration (`packages/backend/tests/services/eventos.service.test.ts`)**: cenário "escala com 3 músicas — 1 com tom válido e cifraclub_url, 1 com tom válido sem URL, 1 sem tom" — valida resposta correta em todos os 3.
- **Frontend (`packages/frontend/tests/lib/cifraclub-playlist.test.ts`)**: badge `tom_final` aparece quando há, mensagem "tom não ajustado" quando flag é `false`.

**Rationale**: Função pura é trivial de testar e o ROI é altíssimo (impede regressões silenciosas). Integration test valida o caminho real (Prisma → service → controller). Frontend test garante que a UX não regredir.

**Alternativas consideradas**:

- **Apenas unit test**: insuficiente — integration valida que `getCifraclubPlaylist` chama `applyKeyFragment` corretamente.
- **E2E com Playwright**: fora do estilo do projeto; nenhum teste E2E hoje. Spec não requer.
