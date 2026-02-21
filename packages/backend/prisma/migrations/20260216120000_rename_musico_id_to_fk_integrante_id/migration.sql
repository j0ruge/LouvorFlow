-- RenameColumn
ALTER TABLE "eventos_integrantes" RENAME COLUMN "musico_id" TO "fk_integrante_id";

-- RenameColumn
ALTER TABLE "integrantes_funcoes" RENAME COLUMN "musico_id" TO "fk_integrante_id";
