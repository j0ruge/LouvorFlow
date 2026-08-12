-- Tom por evento: cada música escalada pode ter um tom próprio que sobrepõe
-- o tom global de `musicas.fk_tonalidade`. NULL significa "usa o tom da música",
-- que é exatamente o comportamento atual — por isso não há data migration.
-- ON DELETE SET NULL: apagar uma tonalidade devolve a música ao tom global.
ALTER TABLE "eventos_musicas" ADD COLUMN "fk_tonalidade" UUID;
CREATE INDEX "eventos_musicas_fk_tonalidade_idx" ON "eventos_musicas"("fk_tonalidade");
ALTER TABLE "eventos_musicas" ADD CONSTRAINT "eventos_musicas_fk_tonalidade_fkey"
  FOREIGN KEY ("fk_tonalidade") REFERENCES "tonalidades"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
