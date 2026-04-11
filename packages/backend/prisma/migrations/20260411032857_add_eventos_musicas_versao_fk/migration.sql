-- AlterTable
ALTER TABLE "eventos_musicas" ADD COLUMN     "fk_artistas_musicas" UUID;

-- CreateIndex
CREATE INDEX "eventos_musicas_fk_artistas_musicas_idx" ON "eventos_musicas"("fk_artistas_musicas");

-- AddForeignKey
ALTER TABLE "eventos_musicas" ADD CONSTRAINT "eventos_musicas_fk_artistas_musicas_fkey" FOREIGN KEY ("fk_artistas_musicas") REFERENCES "artistas_musicas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
