# Quickstart — Integração CifraClub

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-24

Roteiro de validação manual pós-implementação.

## Pré-requisitos

```powershell
docker compose -f infra/postgres/docker-compose.yml up -d
cd packages/backend; npx prisma migrate dev; npm run dev
cd packages/frontend; npm run dev
```

Confirmar: ambas migrações aplicadas, backend sem erros, frontend em `http://localhost:5173`, login com `escalas.write` + `musicas.write`.

---

## Cenário 1 — Cadastrar `cifraclub_url` em versão

1. Abrir uma música existente → editar versão.
2. No campo "Link CifraClub", colar `https://www.cifraclub.com.br/aline-barros/rendido-estou/`.
3. **Esperado**: salva sem erro; ao recarregar, campo exibe a URL.
4. Testar URL inválida (`javascript:alert(1)`) → **Esperado**: 400.
5. Limpar o campo → salvar → **Esperado**: campo volta null.

---

## Cenário 2 — Playlist CifraClub com transposição

1. Criar/abrir escala com ≥3 músicas. Garantir que pelo menos 2 têm `cifraclub_url` e `fk_tonalidade` definida.
2. Abrir `EventoDetail` → botão "CifraClub" **sempre visível** no header.
3. Tocar o botão → diálogo abre com:
   - Header com nome + data.
   - Badge "X de Y músicas com cifra".
   - Lista numerada: músicas com link mostram `tom_final` badge + botão "Abrir"; sem link mostram "_sem cifra cadastrada_".
4. Verificar que URLs com domínio `cifraclub.com.br` têm `#key=N` no final.
5. Verificar que URLs de outros domínios (YouTube) aparecem **sem** `#key=N`.
6. Tocar "Abrir" em um link → **Esperado**: nova aba com a cifra no tom correto.
7. "Copiar links" → **Esperado**: clipboard com texto numerado incluindo músicas sem link.
8. "WhatsApp" → **Esperado**: `wa.me` abre com mensagem formatada.

---

## Cenário 3 — Lista pública por Evento

1. No detalhe da Escala, editar.
2. Campo "Lista no CifraClub" (novo) — colar `https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/`.
3. **Esperado**: preview aparece (~500ms debounce): "**Sabado** · por JorUge Ferrari · 5 músicas · pública".
4. Salvar → **Esperado**: botão "Abrir lista no CifraClub" aparece no header.
5. Abrir diálogo CifraClub → **Esperado**: botão "Lista no CifraClub" aparece no footer.
6. Tocar "Lista no CifraClub" → **Esperado**: `wa.me` com mensagem curta (header + URL + microcopy).
7. Editar para vazio → salvar → **Esperado**: botão/link desaparece do header e do diálogo.
8. URL inválida (`https://youtube.com/x`) → **Esperado**: erro inline + backend 400.

---

## Cenário 4 — Staleness

1. Com URL cadastrada (Cenário 3), verificar `cifraclub_list_url_updated_at = T0`.
2. Adicionar/remover/reordenar uma música na escala.
3. Recarregar → **Esperado**: aviso "⚠ Lista possivelmente desatualizada".
4. Editar a URL para valor diferente → salvar → **Esperado**: aviso desaparece.

---

## Cenário 5 — RBAC

1. Login como usuário **sem** `escalas.write` nem `musicas.write`.
2. Abrir escala com URL cadastrada → **Esperado**: botão "Abrir lista" visível (leitura OK).
3. Tentar editar URL → **Esperado**: campo disabled + tooltip "Sem permissão".
4. Tentar PUT via curl sem permissão → **Esperado**: 403.
5. Botão "CifraClub" (diálogo) → **Esperado**: visível (é read-only).

---

## Cenário 6 — Edge cases

| EC | Teste | Esperado |
|----|-------|----------|
| EC-04 | Playlist > 3800 chars encoded | Toast "mensagem muito longa" + clipboard |
| EC-07 | Tom "Am" na música | `tom_final = "A"`, `#key=0` |
| EC-11 | Tom "A#" na música | `tom_final = "Bb"`, `#key=1` |
| EC-15 | URL lista-sistema `/repertorio/favoritas/` | Salva; preview mostra "lista do sistema" |
| EC-17 | URL com fragmento `.../#anything` | Regex aceita; salva literal |
| EC-20 | Sem `escalas.write` | Campo disabled |

---

## Cenário 7 — Regressão

1. `cd packages/backend && npm test` — 100% verde.
2. `cd packages/frontend && npm test` — 100% verde.
3. Share WhatsApp existente (`EscalaShareActions`) segue inalterado.
