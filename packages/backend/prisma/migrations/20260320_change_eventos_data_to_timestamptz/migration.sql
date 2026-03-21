-- AlterTable: change eventos.data from DATE to TIMESTAMPTZ
ALTER TABLE "eventos" ALTER COLUMN "data" SET DATA TYPE TIMESTAMPTZ USING "data"::timestamptz;
