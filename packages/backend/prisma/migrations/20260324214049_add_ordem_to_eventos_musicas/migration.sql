-- DropForeignKey
ALTER TABLE "artistas" DROP CONSTRAINT "artistas_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "artistas_musicas" DROP CONSTRAINT "artistas_musicas_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "categorias" DROP CONSTRAINT "categorias_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos" DROP CONSTRAINT "eventos_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_musicas" DROP CONSTRAINT "eventos_musicas_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_users" DROP CONSTRAINT "eventos_users_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_users_funcoes" DROP CONSTRAINT "eventos_users_funcoes_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "funcoes" DROP CONSTRAINT "funcoes_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "musicas" DROP CONSTRAINT "musicas_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "musicas_categorias" DROP CONSTRAINT "musicas_categorias_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "musicas_funcoes" DROP CONSTRAINT "musicas_funcoes_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_users" DROP CONSTRAINT "tenant_users_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tipos_eventos" DROP CONSTRAINT "tipos_eventos_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tonalidades" DROP CONSTRAINT "tonalidades_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "users_funcoes" DROP CONSTRAINT "users_funcoes_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "users_permissions" DROP CONSTRAINT "users_permissions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "users_roles" DROP CONSTRAINT "users_roles_tenant_id_fkey";

-- AlterTable
ALTER TABLE "eventos_musicas" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "eventos_users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenant_users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users_funcoes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users_recovery_tokens" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "token" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users_refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "artistas" ADD CONSTRAINT "artistas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "artistas_musicas" ADD CONSTRAINT "artistas_musicas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_musicas" ADD CONSTRAINT "eventos_musicas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funcoes" ADD CONSTRAINT "funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "musicas" ADD CONSTRAINT "musicas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "musicas_funcoes" ADD CONSTRAINT "musicas_funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "musicas_categorias" ADD CONSTRAINT "musicas_categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_users" ADD CONSTRAINT "eventos_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_users_funcoes" ADD CONSTRAINT "eventos_users_funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_funcoes" ADD CONSTRAINT "users_funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tipos_eventos" ADD CONSTRAINT "tipos_eventos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tonalidades" ADD CONSTRAINT "tonalidades_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- DataMigration: popular campo ordem em registros existentes usando data de criacao
UPDATE eventos_musicas
SET ordem = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY evento_id
    ORDER BY created_at ASC
  ) AS row_num
  FROM eventos_musicas
) AS subquery
WHERE eventos_musicas.id = subquery.id;
