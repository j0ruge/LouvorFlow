import prisma from '../../prisma/cliente.js';

class FuncoesRepository {
    async findAll() {
        return prisma.funcoes.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return prisma.funcoes.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async findByNome(nome: string) {
        return prisma.funcoes.findFirst({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return prisma.funcoes.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string) {
        return prisma.funcoes.create({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tenant_id é injetado pelo interceptor forTenant em runtime
            data: { nome, tenant_id: '' as any },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string) {
        return prisma.funcoes.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string) {
        return prisma.funcoes.delete({ where: { id } });
    }
}

export default new FuncoesRepository();
