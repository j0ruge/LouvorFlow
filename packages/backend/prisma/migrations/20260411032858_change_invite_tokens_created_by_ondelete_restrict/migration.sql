-- Altera semântica de deleção do FK invite_tokens.created_by de CASCADE para RESTRICT.
-- Antes: deletar um usuário apagava silenciosamente todos os seus convites emitidos.
-- Depois: a deleção falha explicitamente se houver convites, forçando limpeza consciente.

-- DropForeignKey
ALTER TABLE "invite_tokens" DROP CONSTRAINT "invite_tokens_created_by_fkey";

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
