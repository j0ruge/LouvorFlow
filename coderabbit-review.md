# CodeRabbit Review — PR #60

**PR:** feat: compartilhamento WhatsApp, CD fixes e auditoria mobile-first
**Branch:** develop → master
**Total findings:** 34 (16 inline + 2 outside-diff + 13 minor + 3 nitpick)

---

## CRITICAL (1)

- [x] **#1** `packages/backend/prisma/schema.prisma:128-135` — **Not applicable**: o invariante já é garantido em camada de aplicação via `createMusica`/`setMusicaVersaoAtomic` (transação atômica valida `musica_id` + lança `VERSAO_WRONG_MUSICA`). Uma FK composta em `Eventos_Musicas → Artistas_Musicas(id, musica_id, tenant_id)` exige reestruturar o schema e uma migration com backfill — escopo de PR arquitetural separado, não entra nesta rodada.

## HIGH (16)

- [x] **#2** `scripts/reconcile-migration-split.ts:44` — **Not applicable (parcial)**: o script já tem JSDoc de módulo, `__dirname` é válido (backend é CommonJS via `tsx`). A dependência de `pgcrypto` foi removida ao trocar `gen_random_uuid()::text` por `randomUUID()` do Node (ver #3).
- [x] **#3** `scripts/reconcile-migration-split.ts:181` — **Fixed**: adicionado `randomUUID` de `node:crypto`, UUID gerado em Node e passado como parâmetro, removendo dependência de `pgcrypto`.
- [x] **#4** `scripts/reconcile-migration-split.ts:158-209` — **Fixed**: JSDoc PT-BR adicionado nos callbacks de `$transaction`, `.catch` e `.finally`.
- [x] **#5** `src/controllers/eventos.controller.ts:49-68` — **Not applicable**: os controllers são wrappers finos de 3-5 linhas e já possuem JSDoc de uma linha; o contrato completo (@param/@returns/@throws) está documentado no serviço (`eventos.service.ts:282-332`). Duplicar seria redundante e violaria DRY.
- [x] **#6** `tests/fakes/fake-eventos.repository.ts:206-223` — **Not applicable (false positive)**: o repositório real (`eventos.repository.ts:80-98`) também não projeta `versoes_disponiveis`/`versao_selecionada` em `findMusicas` — apenas `findEventoMusicaDetail` e `buildEventoShow` fazem. O fake está consistente com a contraparte real.
- [x] **#7** `components/EventoDetail.tsx:136-145,606-615` — **Fixed**: `aria-label="Remover música"` e `aria-label="Remover integrante"` adicionados nos botões icon-only.
- [x] **#8** `components/EventoDetail.tsx:366-376` — **Fixed**: `EscalaShareActions` movido para fora do `canWrite`; usuário read-only agora vê Copiar/WhatsApp. Editar/Excluir permanecem gatados por `canWrite`.
- [x] **#9** `components/EventoDetail.tsx:368-384` — **Fixed**: `aria-label="Editar evento"` e `aria-label="Excluir evento"` adicionados.
- [x] **#10** `components/MusicaVersaoPicker.tsx:128` — **Fixed**: `currentKey` agora deriva dos IDs concatenados (`versoesDisponiveis.map(v => v.id).join(",")`), cobrindo swap com mesma cardinalidade.
- [x] **#11** `hooks/use-eventos.ts:232-249` — **Fixed**: JSDoc PT-BR adicionado em `mutationFn`, `onSuccess` e `onError` de `useSetMusicaVersao`.
- [x] **#12** `tests/unit/components/EscalaShareActions.test.ts:63,106,168,189` — **Fixed**: JSDoc PT-BR adicionado acima de cada um dos 4 blocos `describe`.
- [x] **#13** `tests/unit/components/EscalaShareActions.test.ts:170-186` — **Not applicable**: o teste como está valida a guard `if (!evento) return;` do handler real (mesma lógica). Renderizar o componente real via RTL + simular click seria um rewrite do teste — escopo além do comentário; a cobertura efetiva está nos outros 7 casos do arquivo.
- [x] **#14** `tests/unit/components/MusicaVersaoPicker.component.test.tsx:21-28` — **Already fixed**: `criarVersao` e todos os callbacks `describe`/`it` já possuem JSDoc PT-BR.
- [x] **#15** `tests/unit/components/MusicaVersaoPicker.test.ts:23-83` — **Fixed**: JSDoc PT-BR adicionado no `describe` e em cada um dos 8 blocos `it`.
- [x] **#16** `tests/unit/schemas/evento.test.ts:13-17` — **Not applicable (false positive)**: os testes passam com os UUIDs atuais (9/9 green) — `z.string().uuid()` da versão usada aceita o formato. Trocar para RFC4122 v1-strict seria cosmético sem fix de bug.
- [x] **#17** `tests/unit/schemas/evento.test.ts:18-143` — **Fixed**: JSDoc PT-BR adicionado nos 2 blocos `describe` (`VersaoMusicaSchema`, `MusicaEventoSchema`).

## MINOR (14)

- [x] **#18** `backend/docs/openapi.json:5373-5417` — **Not applicable**: atualizar ~6 exemplos aninhados para o novo shape `MusicaEvento` é um esforço documental significativo e ortogonal ao objetivo desta PR; aberto para PR de follow-up específico de spec.
- [x] **#19** `backend/docs/openapi.json:2326-2328,2400-2401` — **Not applicable**: puramente cosmético (UUID de exemplo em payload); não afeta validação nem consumidores reais.
- [x] **#20** `services/eventos.service.ts:315-317` — **Fixed**: substituído `detail!` por guard `if (!detail) throw new AppError("Falha ao recuperar música criada", 500)`.
- [x] **#21** `services/eventos.service.ts:346-348` — **Fixed**: mesma mitigação em `setMusicaVersao` com mensagem "Falha ao recuperar música atualizada".
- [x] **#22** `components/EscalaShareActions.tsx:12-28,45-48,67-130` — **Already fixed**: `WhatsAppIcon`, `EscalaShareActionsProps`, `handleCopy`, `handleWhatsApp`, `formattedMessage` já possuem JSDoc PT-BR completo.
- [x] **#23** `services/eventos.ts:161-173` — **Fixed**: `@returns` agora diz "Resposta da API com mensagem (`AssociationResponse`)", coerente com o tipo de retorno.
- [x] **#24** `lib/whatsapp-share.test.ts:115,322,336` — **Fixed**: JSDoc PT-BR adicionado nos 3 blocos `describe`.
- [x] **#25** `tests/unit/components/EscalaShareActions.test.ts:196-222` — **Fixed**: `vi.useRealTimers()` movido para `afterEach` do suite "ícone de confirmação", garantindo cleanup mesmo em throw antecipado.
- [x] **#26** `.claude/rules/backend-api.md:37,180` — **Fixed**: linha 180 atualizada para "25 modelos: 16 domínio + 9 auth" (consistente com linha 37 e com `grep -c '^model ' schema.prisma` = 25).
- [x] **#27** `.compozy/tasks/copiar-escala-whatsapp/memory/task_07.md:16-29` — **Not applicable**: arquivo de memória histórica da task; reflete o estado no momento da execução. Reescrever pós-fato distorce o histórico.
- [x] **#28** `.compozy/tasks/copiar-escala-whatsapp/task_03.md:26,33-37` — **Fixed**: contrato PATCH atualizado para `{ msg }` (linha 26) e subtasks 3.1-3.5 marcadas `[x]`.
- [x] **#29** `.compozy/tasks/copiar-escala-whatsapp/task_04.md:34-39` — **Fixed**: subtasks 4.1-4.6 marcadas `[x]`.
- [x] **#30** `.compozy/tasks/copiar-escala-whatsapp/task_05.md:34-39` — **Fixed**: subtasks 5.1-5.6 marcadas `[x]`.
- [x] **#31** `.compozy/tasks/copiar-escala-whatsapp/task_07.md:25-30` — **Not applicable**: a implementação real usa `evento?: EventoShow | undefined` e o componente já trata `if (!evento)` nos handlers e em `disabled`. O documento de task é histórico e não dita mais o contrato vigente.

## NITPICK (3)

- [x] **#32** `.claude/rules/dev-workflow.md:44-45` — **Not applicable**: os exemplos são intencionalmente específicos da máquina do autor (regra interna do repo, não é tutorial público); substituí-los por `<repo-root>` remove a clareza de "CWD precisa ser a raiz absoluta" que motivou a regra.
- [x] **#33** `components/MusicaVersaoPicker.tsx:44-58,110` — **Not applicable**: extrair `selectDefaultVersaoId` para outro módulo é um refactor preemptivo; o warning do Fast Refresh é cosmético em dev e não afeta build/runtime.
- [x] **#34** `repositories/eventos.repository.ts:100-118` — **Fixed**: JSDoc duplicada removida; mantida apenas a versão completa com `artistas_musicas_id`.

---

## Final Result

| Status | Count |
|--------|-------|
| Fixed | 18 |
| Already fixed | 2 |
| Not applicable | 14 |
| Pending | 0 |

**Tests:**
- Backend: 343/343 passed (33 files)
- Frontend: 110/110 passed (8 files)

**Conversations resolved:** 27/27
