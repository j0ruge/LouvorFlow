import { getPrisma } from '../../prisma/cliente.js';

class ArtistasRepository {
    async findAll() {
        return getPrisma().artistas.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return getPrisma().artistas.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                musicas: {
                    select: {
                        id: true,
                        musica_id: true,
                        bpm: true,
                        cifras: true,
                        lyrics: true,
                        link_versao: true,
                        artistas_musicas_musica_id_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
    }

    /**
     * Busca um artista pelo nome, ignorando caixa (maiúsculas/minúsculas).
     *
     * Usa `mode: 'insensitive'` do Prisma (decisão D7) como barreira de
     * duplicidade na aplicação — o índice único do banco
     * (`@@unique([tenant_id, nome])`) é case-sensitive no Postgres, então
     * "Hillsong" e "hillsong" não colidiriam por conta própria. Acentos
     * continuam distintos: `mode: 'insensitive'` normaliza caixa, não
     * diacríticos (ex.: "Ávine" ≠ "Avine").
     *
     * @param nome - Nome do artista a buscar.
     * @returns Artista encontrado (case-insensitive) ou null.
     */
    async findByNome(nome: string) {
        return getPrisma().artistas.findFirst({ where: { nome: { equals: nome, mode: 'insensitive' } } });
    }

    /**
     * Busca um artista pelo nome (case-insensitive), excluindo um ID
     * específico — usado para validar duplicidade em updates.
     *
     * @param nome - Nome a ser buscado.
     * @param excludeId - ID do artista a ser excluído da busca.
     * @returns Artista encontrado ou null.
     */
    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().artistas.findFirst({
            where: { nome: { equals: nome, mode: 'insensitive' }, NOT: { id: excludeId } },
        });
    }

    /**
     * Cria um novo artista vinculado ao tenant.
     *
     * @param nome - Nome do artista.
     * @param tenantId - UUID do tenant ativo.
     * @returns Artista criado.
     */
    async create(nome: string, tenantId: string) {
        return getPrisma().artistas.create({ data: { nome, tenant_id: tenantId } });
    }

    async update(id: string, nome: string) {
        return getPrisma().artistas.update({ where: { id }, data: { nome } });
    }

    async delete(id: string) {
        return getPrisma().artistas.delete({ where: { id } });
    }

    async findByIdSimple(id: string) {
        return getPrisma().artistas.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }
}

export default new ArtistasRepository();
