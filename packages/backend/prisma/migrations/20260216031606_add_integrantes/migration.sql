/*
  Warnings:

  - A unique constraint covering the columns `[artista_id,musica_id]` on the table `artistas_musicas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[evento_id,musico_id]` on the table `eventos_integrantes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[evento_id,musicas_id]` on the table `eventos_musicas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nome]` on the table `funcoes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[musico_id,funcao_id]` on the table `integrantes_funcoes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[musica_id,funcao_id]` on the table `musicas_funcoes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tom]` on the table `tonalidades` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "integrantes" ADD COLUMN     "telefone" VARCHAR(20);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musicas_tags" (
    "id" UUID NOT NULL,
    "musica_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "musicas_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_nome_unico" ON "tags"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "musicas_tags_musica_id_tag_id_key" ON "musicas_tags"("musica_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "artistas_musicas_artista_id_musica_id_key" ON "artistas_musicas"("artista_id", "musica_id");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_integrantes_evento_id_musico_id_key" ON "eventos_integrantes"("evento_id", "musico_id");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_musicas_evento_id_musicas_id_key" ON "eventos_musicas"("evento_id", "musicas_id");

-- CreateIndex
CREATE UNIQUE INDEX "funcoes_nome_unico" ON "funcoes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "integrantes_funcoes_musico_id_funcao_id_key" ON "integrantes_funcoes"("musico_id", "funcao_id");

-- CreateIndex
CREATE UNIQUE INDEX "musicas_funcoes_musica_id_funcao_id_key" ON "musicas_funcoes"("musica_id", "funcao_id");

-- CreateIndex
CREATE UNIQUE INDEX "tonalidades_tom_unico" ON "tonalidades"("tom");

-- AddForeignKey
ALTER TABLE "musicas_tags" ADD CONSTRAINT "musicas_tags_musica_id_fkey" FOREIGN KEY ("musica_id") REFERENCES "musicas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "musicas_tags" ADD CONSTRAINT "musicas_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
