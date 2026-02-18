import type { Categorias } from '@prisma/client';
import prisma from '../../prisma/cliente.js';

type CategoriaSummary = Pick<Categorias, 'id' | 'nome'>;

class CategoriasRepository {
    async findAll(): Promise<CategoriaSummary[]> {
        return prisma.categorias.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string): Promise<CategoriaSummary | null> {
        return prisma.categorias.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async findByNome(nome: string): Promise<Categorias | null> {
        return prisma.categorias.findUnique({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string): Promise<Categorias | null> {
        return prisma.categorias.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string): Promise<CategoriaSummary> {
        return prisma.categorias.create({
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string): Promise<CategoriaSummary> {
        return prisma.categorias.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string): Promise<Categorias> {
        return prisma.categorias.delete({ where: { id } });
    }
}

export default new CategoriasRepository();
