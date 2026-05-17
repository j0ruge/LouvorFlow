# Phase 1 — Quickstart: 027 CifraClub List Link

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-17

Roteiro de validação manual da feature pós-implementação. Cobre os 4 user stories e cenários de borda críticos.

## Pré-requisitos do ambiente

```powershell
# Banco + backend rodando
docker compose -f infra/postgres/docker-compose.yml up -d
cd packages/backend; npx prisma migrate dev; npm run dev
# Em outro terminal, frontend
cd packages/frontend; npm run dev
```

Confirmar:

- Migration `<ts>_add_cifraclub_list_url_to_eventos` aplicada (`psql -d louvorflow -c "\d eventos"` mostra as 2 novas colunas).
- Backend tsx watch sem erros no console.
- Frontend acessível em `http://localhost:5173`.
- Login com usuário com permissão `escalas.write` (admin ou role com essa permissão).

---

## Cenário 1 — US1: Cadastrar URL e compartilhar lista única no WhatsApp

**Objetivo**: validar o fluxo principal de valor (líder cadastra → compartilha → músico recebe link único).

1. Criar/abrir uma Escala qualquer com pelo menos 3 músicas (idealmente: ter feature 025 funcional para o diálogo da Playlist CifraClub).
2. No detalhe da Escala, clicar "Editar".
3. Localizar o campo **"Lista no CifraClub"** (novo). Verificar que o campo está vazio inicialmente.
4. Colar `https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/`.
5. **Esperado**: dentro de ~500ms (debounce), preview aparece embaixo do input: "**Sabado** · por JorUge Ferrari · 5 músicas · pública".
6. Salvar.
7. **Esperado**: detalhe da Escala recarrega; botão "**Abrir lista no CifraClub**" agora aparece no header próximo ao título (ícone `ListMusic`).
8. Abrir o diálogo "**Playlist CifraClub**" (botão da 025).
9. **Esperado**: footer do diálogo agora tem 4 botões — "Copiar links", "WhatsApp" (da 025), "**Lista no CifraClub**" (novo), "Fechar".
10. Clicar em "**Lista no CifraClub**".
11. **Esperado**: abre `wa.me/?text=...` com mensagem do tipo:

    ```text
    *Culto Domingo Manhã* — _17/05/2026 10:00_

    🎸 *Lista no CifraClub*: https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/

    _Toque para abrir no app do CifraClub._
    ```

12. Em um celular real (iOS ou Android com app CifraClub instalado), enviar essa mensagem para si mesmo e tocar a URL.
13. **Esperado**: app CifraClub abre na visualização nativa da lista "Sabado" com as 5 músicas.

---

## Cenário 2 — US2: Edição e remoção da URL

**Objetivo**: validar persistência e operações CRUD do campo.

1. Editar a Escala do Cenário 1 e mudar a URL para uma diferente válida (ex.: outra lista pública).
2. **Esperado**: preview atualiza; salvar persiste; `cifraclub_list_url_updated_at` no banco é atualizado para `NOW()` (verificar via `psql`).
3. Editar novamente e limpar o campo (apagar todo o texto).
4. **Esperado**: ao salvar, backend recebe `cifraclub_list_url: null`; campo persiste null; `cifraclub_list_url_updated_at` também vira null.
5. **Esperado UI**: botão "Abrir lista no CifraClub" desaparece do header; botão "Lista no CifraClub" desaparece do diálogo da Playlist; em vez deles aparece link discreto "Cadastrar URL da lista CifraClub" (no diálogo).
6. Tentar salvar com URL inválida (ex.: `https://youtube.com/foo`).
7. **Esperado**: erro inline "URL deve seguir o padrão https://www.cifraclub.com.br/musico/.../repertorio/...". Backend retorna 400 (inspecionar via DevTools network).

---

## Cenário 3 — US3: Acesso direto à lista pelo músico

**Objetivo**: validar o caminho independente do WhatsApp (US3 / FR-006).

1. Re-cadastrar a URL no Evento (recuperar Cenário 1).
2. Logar como usuário **sem** `escalas.write` (apenas `escalas.read` — ex.: um músico comum).
3. Abrir o detalhe da Escala.
4. **Esperado**: vê o botão "**Abrir lista no CifraClub**" no header (visibilidade só depende do campo estar cadastrado, não da permissão).
5. **Esperado**: NÃO vê o botão "Editar"; o campo no formulário fica disabled se ele abrir por algum caminho.
6. Tocar "Abrir lista no CifraClub" em um celular.
7. **Esperado**: redireciona via Universal/App Link para o app CifraClub (ou abre no navegador se app não instalado).

---

## Cenário 4 — US4: Aviso de "Lista possivelmente desatualizada"

**Objetivo**: validar o critério baseado em timestamps (FR-009).

1. Manter a URL cadastrada do Cenário 1. Verificar via `psql` que `cifraclub_list_url_updated_at = T0` (timestamp do último set).
2. No detalhe da Escala, adicionar 1 música nova ou remover/reordenar uma existente (via UI da 025 ou similar).
3. **Esperado**: backend atualiza `eventos_musicas.updated_at` para `T1 > T0`.
4. Recarregar o detalhe da Escala.
5. **Esperado**: aparece aviso discreto próximo ao campo "Lista no CifraClub": **"⚠ Lista possivelmente desatualizada — última edição de músicas em DD/MM/AAAA HH:mm"**.
6. Clicar no link "Atualizar no CifraClub" dentro do aviso.
7. **Esperado**: nova aba abre na URL da lista (mesma navegação do botão "Abrir lista no CifraClub").
8. Voltar ao LouvorFlow e editar a URL para qualquer valor diferente (ou reabrir o form e clicar salvar mesmo sem mudança).
9. **Esperado se a URL mudou**: `cifraclub_list_url_updated_at` vira `T2 > T1`; aviso some na próxima carga.
10. **Esperado se a URL não mudou (PATCH parcial)**: timestamp inalterado, aviso permanece — comportamento correto (a edição não refletiu na lista do CifraClub).

---

## Cenário 5 — Edge cases (regex + preview)

**Objetivo**: validar os 10 edge cases da spec.

| EC | Teste | Esperado |
|----|-------|----------|
| EC-1 | Cadastrar URL com query string (`…/repertorio/12339923/?utm=share`) | Salva literal; preview funciona (query é ignorada no fetch) |
| EC-2 | Cadastrar URL para lista-sistema (`/repertorio/favoritas/`) | Salva; preview retorna `null` graciosamente (sem fetch); UI mostra "lista do sistema — sem preview" |
| EC-3 | Cadastrar URL de lista privada (criar uma lista privada no CifraClub) | Salva com warning UI "essa lista não está acessível publicamente — músicos podem cair em tela de login" |
| EC-4 | Cadastrar URL com fragmento (`…/repertorio/12339923/#anything`) | Salva literal; preview funciona normalmente |
| EC-5 | Cadastrar URL de outro domínio (`https://www.cifras.com.br/foo`) | Erro inline; backend retorna 400 |
| EC-6 | Deletar a lista no CifraClub depois de cadastrar; tentar abrir | Erro 404 ao abrir; LouvorFlow não detecta passivamente (esperado); líder edita/remove URL |
| EC-7 | Tentar editar URL como usuário sem `escalas.write` | Campo disabled; tentativa via API direta retorna 403 |
| EC-8 | Cadastrar URL em tenant A, autenticar em tenant B, tentar acessar evento de A | 404 (invariante existente do `ensureTenantContext`); URL não vaza |
| EC-9 | (improvável) Escala muito longa fazendo o WhatsApp share atingir limite | Toast "mensagem muito longa, use Copiar texto" — mas como a 027 só envia 1 URL curta, não acontece na prática |
| EC-10 | Cadastrar URL com casing variado (`https://WWW.CifraCLUB.COM.BR/...`) | Aceito (regex `i`); salva literal |

---

## Cenário 6 — Regressão (SC-006)

**Objetivo**: garantir que 025 e 026 continuam funcionando.

1. Rodar `cd packages/backend; npm test` — confirmar 100% verde.
2. Rodar `cd packages/frontend; npm test` — confirmar 100% verde.
3. Abrir o diálogo da Playlist CifraClub em uma Escala **sem** `cifraclub_list_url`:
   - **Esperado**: footer mostra apenas os 3 botões originais da 025 (Copiar, WhatsApp, Fechar) — a 027 não introduz botão fantasma.
4. Compartilhar via WhatsApp (botão da 025).
   - **Esperado**: mensagem idêntica ao formato pré-027 (com músicas + `#key=N` se 026 estiver aplicada). A URL da 027 NÃO aparece nessa mensagem.

---

## Cenário 7 — Smoke API (curl/Invoke-RestMethod)

**Objetivo**: validar diretamente os contratos da `contracts/eventos-cifraclub-list-url.openapi.json`.

```powershell
$token = "<JWT_VALIDO>"
$eventoId = "<UUID_DA_ESCALA>"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# 1. GET — deve retornar os 3 novos campos
Invoke-RestMethod -Uri "http://localhost:3000/api/eventos/$eventoId" -Headers $headers | ConvertTo-Json -Depth 5

# 2. PUT cadastrando URL
$body = @{ cifraclub_list_url = "https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/eventos/$eventoId" -Method Put -Headers $headers -Body $body

# 3. PUT removendo
$bodyRemove = @{ cifraclub_list_url = $null } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/eventos/$eventoId" -Method Put -Headers $headers -Body $bodyRemove

# 4. PUT inválido — esperado 400
$bodyInvalid = @{ cifraclub_list_url = "https://youtube.com/foo" } | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3000/api/eventos/$eventoId" -Method Put -Headers $headers -Body $bodyInvalid } catch { $_.Exception.Response.StatusCode }
```

Validar em cada chamada:

- Status code esperado (200 para success, 400 para invalid, 403 para sem permissão).
- Resposta contém os 3 campos novos.
- `cifraclub_list_url_updated_at` é null se URL é null, sempre.

---

## Critério de aceite do fim-a-fim

Todos os 7 cenários devem passar. Se algum falhar, abrir issue no PR e não mergear.

## Rollback

Feature aditiva. Rollback = reverter o commit + rodar `npx prisma migrate resolve --rolled-back <migration_name>` E `psql -d louvorflow -c "ALTER TABLE eventos DROP COLUMN cifraclub_list_url, DROP COLUMN cifraclub_list_url_updated_at;"`. Frontend defensivo: schemas Zod aceitam ausência dos campos, então clientes que vejam um backend sem 027 funcionam.
