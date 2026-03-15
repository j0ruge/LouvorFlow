-- Migration: unify_users_integrantes
-- Unifica as tabelas integrantes e users, preservando dados existentes.
-- Integrantes com email já presente em users: merge (absorve telefone).
-- Integrantes sem correspondência: cria novo user com senha aleatória.
-- Junction tables renomeadas: eventos_integrantes → eventos_users, integrantes_funcoes → users_funcoes.

-- 1. Adicionar coluna telefone a users
ALTER TABLE "users" ADD COLUMN "telefone" VARCHAR(20);

-- 2. Criar novas junction tables
CREATE TABLE "eventos_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evento_id" UUID NOT NULL,
    "fk_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "eventos_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users_funcoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_user_id" UUID NOT NULL,
    "funcao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "users_funcoes_pkey" PRIMARY KEY ("id")
);

-- 3. Migrar dados: integrantes com email existente em users → merge (telefone)
UPDATE "users" u
SET "telefone" = i."telefone"
FROM "integrantes" i
WHERE u."email" = i."email" AND u."telefone" IS NULL AND i."telefone" IS NOT NULL;

-- 4. Migrar dados: integrantes sem email em users → criar user com senha placeholder
-- Usuários migrados sem conta existente precisarão usar "Esqueci minha senha"
INSERT INTO "users" ("id", "name", "email", "password", "telefone", "created_at", "updated_at")
SELECT i."id", i."nome", i."email",
       '$2a$12$MigrationPlaceholder000000000000000000000000000000', -- bcrypt hash placeholder
       i."telefone", i."created_at", i."updated_at"
FROM "integrantes" i
WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."email" = i."email");

-- 5. Copiar eventos_integrantes → eventos_users (vinculando ao user pelo email)
INSERT INTO "eventos_users" ("id", "evento_id", "fk_user_id", "created_at", "updated_at")
SELECT gen_random_uuid(), ei."evento_id", u."id", ei."created_at", ei."updated_at"
FROM "eventos_integrantes" ei
JOIN "integrantes" i ON ei."fk_integrante_id" = i."id"
JOIN "users" u ON u."email" = i."email"
ON CONFLICT DO NOTHING;

-- 6. Copiar integrantes_funcoes → users_funcoes
INSERT INTO "users_funcoes" ("id", "fk_user_id", "funcao_id", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", inf."funcao_id", inf."created_at", inf."updated_at"
FROM "integrantes_funcoes" inf
JOIN "integrantes" i ON inf."fk_integrante_id" = i."id"
JOIN "users" u ON u."email" = i."email"
ON CONFLICT DO NOTHING;

-- 7. Constraints e índices nas novas junctions
CREATE UNIQUE INDEX "eventos_users_evento_id_fk_user_id_key" ON "eventos_users"("evento_id", "fk_user_id");
CREATE UNIQUE INDEX "users_funcoes_fk_user_id_funcao_id_key" ON "users_funcoes"("fk_user_id", "funcao_id");

ALTER TABLE "eventos_users" ADD CONSTRAINT "eventos_users_evento_id_fkey"
  FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "eventos_users" ADD CONSTRAINT "eventos_users_fk_user_id_fkey"
  FOREIGN KEY ("fk_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "users_funcoes" ADD CONSTRAINT "users_funcoes_funcao_id_fkey"
  FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "users_funcoes" ADD CONSTRAINT "users_funcoes_fk_user_id_fkey"
  FOREIGN KEY ("fk_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- 8. Dropar tabelas antigas
DROP TABLE "eventos_integrantes";
DROP TABLE "integrantes_funcoes";
DROP TABLE "integrantes";
