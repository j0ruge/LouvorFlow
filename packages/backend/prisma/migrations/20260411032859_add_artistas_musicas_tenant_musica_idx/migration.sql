-- Índice composto para buscas por (tenant_id, musica_id) em Artistas_Musicas.
-- Usado pelo endpoint de detalhe de evento (EVENTO_SHOW_SELECT) ao carregar
-- as versões disponíveis de cada música da escala.

-- CreateIndex
CREATE INDEX "artistas_musicas_tenant_id_musica_id_idx" ON "artistas_musicas"("tenant_id", "musica_id");
