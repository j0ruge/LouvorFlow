-- Renomeia tabelas e colunas de "tags" para "categorias" preservando dados existentes.

-- Renomeia tabela principal
ALTER TABLE "tags" RENAME TO "categorias";

-- Renomeia tabela de junção
ALTER TABLE "musicas_tags" RENAME TO "musicas_categorias";

-- Renomeia coluna na tabela de junção
ALTER TABLE "musicas_categorias" RENAME COLUMN "tag_id" TO "categoria_id";

-- Renomeia índices
ALTER INDEX "tags_nome_unico" RENAME TO "categorias_nome_unico";
ALTER INDEX "musicas_tags_musica_id_tag_id_key" RENAME TO "musicas_categorias_musica_id_categoria_id_key";

-- Renomeia constraints (PKs e FKs)
ALTER TABLE "categorias" RENAME CONSTRAINT "tags_pkey" TO "categorias_pkey";
ALTER TABLE "musicas_categorias" RENAME CONSTRAINT "musicas_tags_pkey" TO "musicas_categorias_pkey";
ALTER TABLE "musicas_categorias" RENAME CONSTRAINT "musicas_tags_musica_id_fkey" TO "musicas_categorias_musica_id_fkey";
ALTER TABLE "musicas_categorias" RENAME CONSTRAINT "musicas_tags_tag_id_fkey" TO "musicas_categorias_categoria_id_fkey";
