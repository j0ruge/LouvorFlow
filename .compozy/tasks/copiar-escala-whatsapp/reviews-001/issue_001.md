---
status: pending
file: packages/backend/prisma/migrations/20260411032857_add_eventos_musicas_versao_fk/migration.sql
line: 2
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Migração altera FK de invite_tokens sem relação com a feature

## Review Comment

A migração `20260411032857_add_eventos_musicas_versao_fk` — cujo nome descreve apenas
adicionar a FK `fk_artistas_musicas` em `eventos_musicas` — contém duas mudanças
não relacionadas que entraram silenciosamente por schema drift:

```sql
-- DropForeignKey
ALTER TABLE "invite_tokens" DROP CONSTRAINT "invite_tokens_created_by_fkey";
...
-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;
```

A migração original `20260328120308_add_invite_tokens/migration.sql` criou essa
FK com `ON DELETE CASCADE`. Esta migração a altera silenciosamente para `RESTRICT`,
o que é uma mudança semântica relevante: antes, ao deletar um usuário seus convites
eram removidos em cascata; agora, a deleção do usuário falha com violação de FK se
ele tiver convites. Qualquer fluxo que deleta um usuário (admin, self-delete, etc.)
passa a quebrar sem aviso.

Além disso, a migração também adiciona um índice em `artistas_musicas`
(`artistas_musicas_tenant_id_musica_id_idx`) que também não pertence a esta feature.

A causa raiz é drift entre `schema.prisma` (declarou `onDelete: Restrict` em algum
commit anterior sem gerar migração) e o banco. `prisma migrate dev` então empacotou
o drift dentro da migração desta feature.

### Sugestão de correção

1. Reverter as alterações em `invite_tokens` desta migração e gerar uma migração
   dedicada (ex.: `change_invite_tokens_created_by_ondelete`) que também valide o
   impacto no código que deleta usuários.
2. Confirmar se a intenção era `Restrict` (e ajustar a lógica de deleção de usuário
   para limpar convites antes) ou `Cascade` (e voltar o schema ao estado anterior).
3. Mover o índice `artistas_musicas_tenant_id_musica_id_idx` para uma migração
   separada com um nome descritivo.
4. Após recriar, rodar `npx prisma migrate status` para confirmar zero drift.

## Triage

- Decision: `UNREVIEWED`
- Notes:
