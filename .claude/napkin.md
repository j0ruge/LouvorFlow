# Napkin Runbook

## Curation Rules

- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)

1. **[2026-03-20] Após mudar backend, validar processo antes de depurar código**
   Do instead: confirmar restart do `tsx watch`, rodar smoke test via `curl` e reiniciar processo se comportamento divergir do código em disco.
2. **[2026-03-20] Mudou `prisma/schema.prisma`, regen é obrigatório**
   Do instead: executar `npx prisma generate` em `packages/backend` e reiniciar backend antes de testar.
3. **[2026-03-20] Task só fecha com documentação sincronizada**
   Do instead: atualizar docstrings PT-BR, OpenAPI e docs de regras/README quando houver impacto.

## Shell & Command Reliability

1. **[2026-03-20] Preferir busca rápida e escopo explícito**
   Do instead: usar `rg`/`rg --files` com caminhos específicos e ler blocos amplos para reduzir chamadas repetidas.

## Domain Behavior Guardrails

1. **[2026-03-20] Evitar compensar código por processo stale**
   Do instead: se API não refletir código-fonte, reiniciar processo antes de alterar implementação.

## User Directives

1. **[2026-03-20] Não refatorar sem pedido explícito**
   Do instead: aplicar a menor mudança possível, mantendo estilo e estrutura existentes.
