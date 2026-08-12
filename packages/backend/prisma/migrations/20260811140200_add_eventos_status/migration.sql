-- Status da escala. `rascunho` é a escala em preparação: não deve ser comunicada
-- à equipe nem contar como "próxima escala" no Dashboard. `publicada` é o
-- comportamento atual de todo evento existente, e por isso é o DEFAULT — o
-- backfill das linhas já gravadas sai de graça.
CREATE TYPE "EventoStatus" AS ENUM ('rascunho', 'publicada');
ALTER TABLE "eventos" ADD COLUMN "status" "EventoStatus" NOT NULL DEFAULT 'publicada';
CREATE INDEX "eventos_tenant_id_status_idx" ON "eventos"("tenant_id", "status");
