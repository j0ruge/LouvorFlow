-- AlterTable: change eventos.data from DATE to TIMESTAMPTZ
-- AlterTable: change eventos.data from DATE to TIMESTAMPTZ
ALTER TABLE "eventos" ALTER COLUMN "data"
SET DATA TYPE
TIMESTAMPTZ USING
("data"::timestamp AT TIME ZONE 'UTC');