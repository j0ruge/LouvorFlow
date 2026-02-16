import prisma from '../../prisma/cliente.js';

class TonalidadesRepository {
    async findAll() {
        return prisma.tonalidades.findMany({
            select: { id: true, tom: true }
        });
    }

    async findById(id: string) {
        return prisma.tonalidades.findUnique({
            where: { id },
            select: { id: true, tom: true }
        });
    }

    async findByTom(tom: string) {
        return prisma.tonalidades.findUnique({ where: { tom } });
    }

    async findByTomExcludingId(tom: string, excludeId: string) {
        return prisma.tonalidades.findFirst({ where: { tom, NOT: { id: excludeId } } });
    }

    async create(tom: string) {
        return prisma.tonalidades.create({
            data: { tom },
            select: { id: true, tom: true }
        });
    }

    async update(id: string, tom: string) {
        return prisma.tonalidades.update({
            where: { id },
            data: { tom },
            select: { id: true, tom: true }
        });
    }

    async delete(id: string) {
        return prisma.tonalidades.delete({ where: { id } });
    }
}

export default new TonalidadesRepository();
