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
4. Executar `npm test` em ambos os packages (backend + frontend) para garantir que nada foi quebrado.

## 4. Git — CWD Sempre na Raiz do Repositório

No monorepo, comandos como `cd packages/backend && yarn run test` mudam o CWD para um subdiretório. Se o próximo comando executar `git add packages/backend/...` com caminho relativo à raiz, o git resolve como `packages/backend/packages/backend/...` — caminho duplicado, falha com `pathspec did not match`.

**Regra**: comandos `git` rodam **da raiz do repositório**, com caminhos relativos à raiz. Para rodar algo dentro de um package sem que o CWD vaze para o próximo comando, use subshell:

1. **Subshell para comandos de package**: `(cd packages/backend && yarn run test)` — os parênteses isolam o `cd`.
2. **Git sempre relativo à raiz**: `git add packages/backend/src/...`

**Nunca** escrever caminho absoluto de máquina em plano, script ou regra: o repositório já viveu em `/c/Users/.../source/repos/`, `/home/joruge/repos/` e `/home/pc_admin/repos/`, e todo caminho fixo quebra na migração seguinte.
