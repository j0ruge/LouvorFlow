-- AlterTable: tornar artista_id nullable em artistas_musicas
ALTER TABLE "artistas_musicas" ALTER COLUMN "artista_id" DROP NOT NULL;

-- DropIndex: remover unique index antigo (full unique com artista_id NOT NULL)
DROP INDEX IF EXISTS "artistas_musicas_tenant_id_artista_id_musica_id_key";

-- CreateIndex: partial unique index — uniqueness apenas quando artista_id IS NOT NULL
CREATE UNIQUE INDEX "artistas_musicas_tenant_id_artista_id_musica_id_key"
  ON "artistas_musicas" ("tenant_id", "artista_id", "musica_id")
  WHERE "artista_id" IS NOT NULL;
