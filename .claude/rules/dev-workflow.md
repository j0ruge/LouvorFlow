---
description: Regras obrigatórias de verificação pós-implementação para evitar execução de código stale
---

# Workflow de Desenvolvimento — Verificação Pós-Implementação

## 1. Verificação de Processo após Alterações de Backend

Após alterar qualquer arquivo em `src/backend/src/`:

- Confirmar que o `tsx watch` recarregou verificando o log do terminal por mensagens de restart.
- Se o processo estiver sendo executado em background, fazer um teste rápido de sanidade via `curl` para confirmar que o comportamento mudou.
- **Regra crítica**: Se a resposta da API não refletir o código-fonte no disco, **reiniciar o processo** (`kill` + `npm run dev`) antes de investigar bugs no código. Nunca alterar código funcional para compensar um processo stale.

### Sintomas de código stale

- Endpoint retorna estrutura antiga (ex: campo novo vem como `undefined` ou `[]` quando deveria ter dados).
- UUID inválido não retorna 404 (validação nova não está ativa).
- Logs adicionados no código não aparecem no terminal.

## 2. Prisma Client — Regeneração Obrigatória

Após qualquer alteração em `src/backend/prisma/schema.prisma`:

1. Executar `npx prisma generate` no diretório `src/backend/`.
2. Reiniciar o processo backend após a regeneração.
3. Sem isso, o Prisma Client em memória não conhece novos models ou campos — qualquer operação com entidades novas falhará silenciosamente ou com erros de tipo.

## 3. Smoke Test Obrigatório pós-Feature

Ao concluir a implementação de uma feature:

1. Executar pelo menos um **smoke test via API** (`curl`/`fetch`) que exercite o caminho crítico da feature.
2. Comparar o resultado com o comportamento esperado do código-fonte.
3. Se houver divergência entre código no disco e comportamento da API: **reiniciar processos antes de alterar código**.
4. **Promover o smoke test a spec E2E.** O `curl` que atestou a correção é descartável; a garantia não pode ser. Antes de fechar a task, o mesmo cenário vira um spec no nível da API em `packages/frontend/tests/e2e/` — ver `.claude/rules/frontend-react.md`, seção "Verificação manual vira spec — sempre", e a referência `tests/e2e/guardas-tenant.spec.ts`. Vale sobretudo para o que o teste unitário **não alcança** (escopo de tenant do Prisma real, índice único do banco, cascatas, cadeia de middlewares) — ali o fake passa mesmo com a guarda removida.
5. Executar `npm test` em ambos os packages (backend + frontend) para garantir que nada foi quebrado.

### Sintoma que justifica a regra

Em 2026-08-12 o smoke test de `POST /api/eventos` com `fk_tipo_evento` de outro tenant devolveu **500 com o stack trace do Prisma** (caminho do arquivo, linha e nome da constraint) — duas vezes: primeiro porque a guarda não existia, depois porque o `tsx watch` estava com 4h de processo e não tinha recarregado a correção (§1). Sem virar spec, nenhum dos dois modos de falha ficaria coberto.

## 4. Git — CWD Sempre na Raiz do Repositório

No monorepo, comandos como `cd packages/backend && yarn run test` mudam o CWD para um subdiretório. Se o próximo comando executar `git add packages/backend/...` com caminho relativo à raiz, o git resolve como `packages/backend/packages/backend/...` — caminho duplicado, falha com `pathspec did not match`.

**Regra**: comandos `git` rodam **da raiz do repositório**, com caminhos relativos à raiz. Para rodar algo dentro de um package sem que o CWD vaze para o próximo comando, use subshell:

1. **Subshell para comandos de package**: `(cd packages/backend && yarn run test)` — os parênteses isolam o `cd`.
2. **Git sempre relativo à raiz**: `git add packages/backend/src/...`

**Nunca** escrever caminho absoluto de máquina em plano, script ou regra: o repositório já viveu em `/c/Users/.../source/repos/`, `/home/joruge/repos/` e `/home/pc_admin/repos/`, e todo caminho fixo quebra na migração seguinte.
