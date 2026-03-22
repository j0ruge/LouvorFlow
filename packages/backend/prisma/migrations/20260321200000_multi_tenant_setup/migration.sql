-- Migration: Multi-Tenant Setup
-- Strategy: 3-step (add nullable → backfill → set NOT NULL)

-- ============================================================
-- Step 1: Create enum, new tables, add nullable tenant_id columns
-- ============================================================

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'inactive', 'system');

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tenant_users
CREATE TABLE "tenant_users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

-- Add tenant_id as NULLABLE to all domain tables
ALTER TABLE "artistas" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "musicas" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "tonalidades" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "funcoes" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "categorias" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "tipos_eventos" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "eventos" ADD COLUMN "tenant_id" UUID;

-- Add tenant_id as NULLABLE to all junction tables
ALTER TABLE "artistas_musicas" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "musicas_funcoes" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "musicas_categorias" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "eventos_musicas" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "eventos_users" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "eventos_users_funcoes" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "users_funcoes" ADD COLUMN "tenant_id" UUID;

-- Add tenant_id as NULLABLE to RBAC assignment tables
ALTER TABLE "users_roles" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "users_permissions" ADD COLUMN "tenant_id" UUID;

-- ============================================================
-- Step 2: Backfill — create tenants, assign all data to default
-- ============================================================

-- Create system tenant (platform-level assignments like super-admin)
INSERT INTO "tenants" ("id", "name", "status", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000000', 'Sistema', 'system', CURRENT_TIMESTAMP);

-- Create default tenant for existing data migration
INSERT INTO "tenants" ("id", "name", "status", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'Igreja Padrão', 'active', CURRENT_TIMESTAMP);

-- Backfill domain tables
UPDATE "artistas" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "musicas" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "tonalidades" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "funcoes" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "categorias" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "tipos_eventos" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "eventos" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;

-- Backfill junction tables
UPDATE "artistas_musicas" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "musicas_funcoes" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "musicas_categorias" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "eventos_musicas" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "eventos_users" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "eventos_users_funcoes" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "users_funcoes" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;

-- Backfill RBAC assignment tables
UPDATE "users_roles" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;
UPDATE "users_permissions" SET "tenant_id" = '00000000-0000-0000-0000-000000000001' WHERE "tenant_id" IS NULL;

-- Create TenantUsers entries for all existing users → default tenant
INSERT INTO "tenant_users" ("id", "tenant_id", "user_id", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', "id", CURRENT_TIMESTAMP
FROM "users";

-- ============================================================
-- Step 3: Finalize — set NOT NULL, drop old constraints, create new
-- ============================================================

-- Make tenant_id NOT NULL on all tables
ALTER TABLE "artistas" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "musicas" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "tonalidades" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "funcoes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "categorias" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "tipos_eventos" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "eventos" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "artistas_musicas" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "musicas_funcoes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "musicas_categorias" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "eventos_musicas" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "eventos_users" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "eventos_users_funcoes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "users_funcoes" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "users_roles" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "users_permissions" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Drop old unique constraints
DROP INDEX IF EXISTS "artistas_nome_unico";
DROP INDEX IF EXISTS "funcoes_nome_unico";
DROP INDEX IF EXISTS "categorias_nome_unico";
DROP INDEX IF EXISTS "tipos_eventos_nome_unico";
DROP INDEX IF EXISTS "tonalidades_tom_unico";
DROP INDEX IF EXISTS "artistas_musicas_artista_id_musica_id_key";
DROP INDEX IF EXISTS "musicas_funcoes_musica_id_funcao_id_key";
DROP INDEX IF EXISTS "musicas_categorias_musica_id_categoria_id_key";
DROP INDEX IF EXISTS "eventos_musicas_evento_id_musicas_id_key";
DROP INDEX IF EXISTS "eventos_users_evento_id_fk_user_id_key";
DROP INDEX IF EXISTS "eventos_users_funcoes_evento_user_id_funcao_id_key";
DROP INDEX IF EXISTS "users_funcoes_fk_user_id_funcao_id_key";

-- Update RBAC composite PKs to include tenant_id
ALTER TABLE "users_roles" DROP CONSTRAINT "users_roles_pkey";
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_pkey" PRIMARY KEY ("user_id", "role_id", "tenant_id");

ALTER TABLE "users_permissions" DROP CONSTRAINT "users_permissions_pkey";
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_pkey" PRIMARY KEY ("user_id", "permission_id", "tenant_id");

-- Create new compound unique constraints
CREATE UNIQUE INDEX "artistas_tenant_nome_unico" ON "artistas"("tenant_id", "nome");
CREATE UNIQUE INDEX "funcoes_tenant_nome_unico" ON "funcoes"("tenant_id", "nome");
CREATE UNIQUE INDEX "categorias_tenant_nome_unico" ON "categorias"("tenant_id", "nome");
CREATE UNIQUE INDEX "tipos_eventos_tenant_nome_unico" ON "tipos_eventos"("tenant_id", "nome");
CREATE UNIQUE INDEX "tonalidades_tenant_tom_unico" ON "tonalidades"("tenant_id", "tom");
CREATE UNIQUE INDEX "artistas_musicas_tenant_id_artista_id_musica_id_key" ON "artistas_musicas"("tenant_id", "artista_id", "musica_id");
CREATE UNIQUE INDEX "musicas_funcoes_tenant_id_musica_id_funcao_id_key" ON "musicas_funcoes"("tenant_id", "musica_id", "funcao_id");
CREATE UNIQUE INDEX "musicas_categorias_tenant_id_musica_id_categoria_id_key" ON "musicas_categorias"("tenant_id", "musica_id", "categoria_id");
CREATE UNIQUE INDEX "eventos_musicas_tenant_id_evento_id_musicas_id_key" ON "eventos_musicas"("tenant_id", "evento_id", "musicas_id");
CREATE UNIQUE INDEX "eventos_users_tenant_id_evento_id_fk_user_id_key" ON "eventos_users"("tenant_id", "evento_id", "fk_user_id");
CREATE UNIQUE INDEX "eventos_users_funcoes_tenant_id_evento_user_id_funcao_id_key" ON "eventos_users_funcoes"("tenant_id", "evento_user_id", "funcao_id");
CREATE UNIQUE INDEX "users_funcoes_tenant_id_fk_user_id_funcao_id_key" ON "users_funcoes"("tenant_id", "fk_user_id", "funcao_id");

-- Create tenant_users unique constraint
CREATE UNIQUE INDEX "tenant_users_tenant_id_user_id_key" ON "tenant_users"("tenant_id", "user_id");

-- Create indexes on tenant_id columns
CREATE INDEX "tenant_users_tenant_id_idx" ON "tenant_users"("tenant_id");
CREATE INDEX "tenant_users_user_id_idx" ON "tenant_users"("user_id");
CREATE INDEX "artistas_tenant_id_idx" ON "artistas"("tenant_id");
CREATE INDEX "musicas_tenant_id_idx" ON "musicas"("tenant_id");
CREATE INDEX "tonalidades_tenant_id_idx" ON "tonalidades"("tenant_id");
CREATE INDEX "funcoes_tenant_id_idx" ON "funcoes"("tenant_id");
CREATE INDEX "categorias_tenant_id_idx" ON "categorias"("tenant_id");
CREATE INDEX "tipos_eventos_tenant_id_idx" ON "tipos_eventos"("tenant_id");
CREATE INDEX "eventos_tenant_id_idx" ON "eventos"("tenant_id");
CREATE INDEX "artistas_musicas_tenant_id_idx" ON "artistas_musicas"("tenant_id");
CREATE INDEX "musicas_funcoes_tenant_id_idx" ON "musicas_funcoes"("tenant_id");
CREATE INDEX "musicas_categorias_tenant_id_idx" ON "musicas_categorias"("tenant_id");
CREATE INDEX "eventos_musicas_tenant_id_idx" ON "eventos_musicas"("tenant_id");
CREATE INDEX "eventos_users_tenant_id_idx" ON "eventos_users"("tenant_id");
CREATE INDEX "eventos_users_funcoes_tenant_id_idx" ON "eventos_users_funcoes"("tenant_id");
CREATE INDEX "users_funcoes_tenant_id_idx" ON "users_funcoes"("tenant_id");
CREATE INDEX "users_roles_tenant_id_idx" ON "users_roles"("tenant_id");
CREATE INDEX "users_permissions_tenant_id_idx" ON "users_permissions"("tenant_id");

-- Add foreign key constraints for tenant_id
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "artistas" ADD CONSTRAINT "artistas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "artistas_musicas" ADD CONSTRAINT "artistas_musicas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "eventos_musicas" ADD CONSTRAINT "eventos_musicas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "funcoes" ADD CONSTRAINT "funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "musicas" ADD CONSTRAINT "musicas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "musicas_funcoes" ADD CONSTRAINT "musicas_funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "musicas_categorias" ADD CONSTRAINT "musicas_categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "eventos_users" ADD CONSTRAINT "eventos_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "eventos_users_funcoes" ADD CONSTRAINT "eventos_users_funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "users_funcoes" ADD CONSTRAINT "users_funcoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "tipos_eventos" ADD CONSTRAINT "tipos_eventos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "tonalidades" ADD CONSTRAINT "tonalidades_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
