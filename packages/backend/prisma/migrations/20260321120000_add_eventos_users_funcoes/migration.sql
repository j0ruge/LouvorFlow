-- CreateTable
CREATE TABLE "eventos_users_funcoes" (
    "id" UUID NOT NULL,
    "evento_user_id" UUID NOT NULL,
    "funcao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "eventos_users_funcoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eventos_users_funcoes_evento_user_id_funcao_id_key" ON "eventos_users_funcoes"("evento_user_id", "funcao_id");

-- AddForeignKey
ALTER TABLE "eventos_users_funcoes" ADD CONSTRAINT "eventos_users_funcoes_evento_user_id_fkey" FOREIGN KEY ("evento_user_id") REFERENCES "eventos_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_users_funcoes" ADD CONSTRAINT "eventos_users_funcoes_funcao_id_fkey" FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
