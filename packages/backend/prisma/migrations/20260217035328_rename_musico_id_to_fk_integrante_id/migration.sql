-- RenameForeignKey
ALTER TABLE "eventos_integrantes" RENAME CONSTRAINT "eventos_integrantes_musico_id_fkey" TO "eventos_integrantes_fk_integrante_id_fkey";

-- RenameForeignKey
ALTER TABLE "integrantes_funcoes" RENAME CONSTRAINT "integrantes_funcoes_musico_id_fkey" TO "integrantes_funcoes_fk_integrante_id_fkey";

-- RenameIndex
ALTER INDEX "eventos_integrantes_evento_id_musico_id_key" RENAME TO "eventos_integrantes_evento_id_fk_integrante_id_key";

-- RenameIndex
ALTER INDEX "integrantes_funcoes_musico_id_funcao_id_key" RENAME TO "integrantes_funcoes_fk_integrante_id_funcao_id_key";
