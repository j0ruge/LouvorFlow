import prisma from '../../prisma/cliente.js';

class TiposEventosRepository {
    async findAll() {
        return prisma.tipos_Eventos.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return prisma.tipos_Eventos.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async findByNome(nome: string) {
        return prisma.tipos_Eventos.findUnique({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return prisma.tipos_Eventos.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string) {
        return prisma.tipos_Eventos.create({
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string) {
        return prisma.tipos_Eventos.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string) {
        return prisma.tipos_Eventos.delete({ where: { id } });
    }
}

export default new TiposEventosRepository();
