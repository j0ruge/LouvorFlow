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

    async findByNome(nome: string) {
        return getPrisma().artistas.findFirst({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().artistas.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id é injetado pelo interceptor forTenant em runtime
        return getPrisma().artistas.create({ data: { nome, tenant_id: '' as any } });
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
