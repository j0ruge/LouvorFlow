-- AlterTable
ALTER TABLE "categorias" RENAME CONSTRAINT "tags_pkey" TO "categorias_pkey";

-- AlterTable
ALTER TABLE "musicas_categorias" RENAME CONSTRAINT "musicas_tags_pkey" TO "musicas_categorias_pkey";

-- RenameForeignKey
ALTER TABLE "musicas_categorias" RENAME CONSTRAINT "musicas_tags_musica_id_fkey" TO "musicas_categorias_musica_id_fkey";

-- RenameForeignKey
ALTER TABLE "musicas_categorias" RENAME CONSTRAINT "musicas_tags_tag_id_fkey" TO "musicas_categorias_categoria_id_fkey";
