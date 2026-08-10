-- CreateTable
CREATE TABLE "funcoes_grupos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "funcoes_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funcoes_grupos_tenant_id_idx" ON "funcoes_grupos"("tenant_id");

-- CreateIndex
CREATE INDEX "funcoes_grupos_tenant_id_ordem_idx" ON "funcoes_grupos"("tenant_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "funcoes_grupos_tenant_nome_unico" ON "funcoes_grupos"("tenant_id", "nome");

-- AlterTable
ALTER TABLE "funcoes" ADD COLUMN     "fk_grupo" UUID;

-- CreateIndex
CREATE INDEX "funcoes_fk_grupo_idx" ON "funcoes"("fk_grupo");

-- AddForeignKey
ALTER TABLE "funcoes_grupos" ADD CONSTRAINT "funcoes_grupos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funcoes" ADD CONSTRAINT "funcoes_fk_grupo_fkey" FOREIGN KEY ("fk_grupo") REFERENCES "funcoes_grupos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- DataMigration: cria os 5 grupos padrao para cada tenant de dominio.
-- O filtro EXISTS exclui o tenant sentinela "Sistema", que nao possui funcoes.
INSERT INTO funcoes_grupos (id, nome, ordem, tenant_id, created_at, updated_at)
SELECT gen_random_uuid(), g.nome, g.ordem, t.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM tenants t
CROSS JOIN (VALUES
  ('Ministração', 1),
  ('Direção Musical', 2),
  ('Vocal', 3),
  ('Instrumentos', 4),
  ('Outros', 5)
) AS g(nome, ordem)
WHERE EXISTS (SELECT 1 FROM funcoes f WHERE f.tenant_id = t.id)
ON CONFLICT DO NOTHING;

-- DataMigration: classifica as funcoes existentes nos grupos por nome (case-insensitive).
-- Nomes nao reconhecidos permanecem com fk_grupo NULL e aparecem ao final da mensagem
-- ate serem classificados manualmente na aba "Grupos" de Configuracoes.
UPDATE funcoes f
SET fk_grupo = fg.id
FROM funcoes_grupos fg
WHERE fg.tenant_id = f.tenant_id
  AND fg.nome = CASE
    WHEN lower(f.nome) IN ('ministração', 'ministro de louvor') THEN 'Ministração'
    WHEN lower(f.nome) = 'direção musical' THEN 'Direção Musical'
    WHEN lower(f.nome) IN ('vocal', 'back vocal') THEN 'Vocal'
    WHEN lower(f.nome) IN ('violão', 'guitarra', 'contrabaixo', 'bateria',
                           'percussão', 'teclado', 'saxofone') THEN 'Instrumentos'
    WHEN lower(f.nome) IN ('sonorização', 'mídia', 'iluminação') THEN 'Outros'
  END;
