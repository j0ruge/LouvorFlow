-- AlterTable
ALTER TABLE "artistas_musicas" ADD COLUMN     "intensidade" TEXT;

-- CreateIndex
CREATE INDEX "eventos_musicas_evento_id_ordem_idx" ON "eventos_musicas"("evento_id", "ordem");
