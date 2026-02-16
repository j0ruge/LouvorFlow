import prisma from '../../prisma/cliente.js';

class ArtistasRepository {
    async findAll() {
        return prisma.artistas.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return prisma.artistas.findUnique({
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
        return prisma.artistas.findUnique({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return prisma.artistas.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string) {
        return prisma.artistas.create({ data: { nome } });
    }

    async update(id: string, nome: string) {
        return prisma.artistas.update({ where: { id }, data: { nome } });
    }

    async delete(id: string) {
        return prisma.artistas.delete({ where: { id } });
    }

    async findByIdSimple(id: string) {
        return prisma.artistas.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }
}

export default new ArtistasRepository();
