import prisma from '../../prisma/cliente.js';

class TagsRepository {
    async findAll() {
        return prisma.tags.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return prisma.tags.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async findByNome(nome: string) {
        return prisma.tags.findUnique({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return prisma.tags.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string) {
        return prisma.tags.create({
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string) {
        return prisma.tags.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string) {
        return prisma.tags.delete({ where: { id } });
    }
}

export default new TagsRepository();
