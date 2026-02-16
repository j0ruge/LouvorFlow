import type { Tags } from '@prisma/client';
import prisma from '../../prisma/cliente.js';

type TagSummary = Pick<Tags, 'id' | 'nome'>;

class TagsRepository {
    async findAll(): Promise<TagSummary[]> {
        return prisma.tags.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string): Promise<TagSummary | null> {
        return prisma.tags.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async findByNome(nome: string): Promise<Tags | null> {
        return prisma.tags.findUnique({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string): Promise<Tags | null> {
        return prisma.tags.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    async create(nome: string): Promise<TagSummary> {
        return prisma.tags.create({
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string): Promise<TagSummary> {
        return prisma.tags.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string): Promise<Tags> {
        return prisma.tags.delete({ where: { id } });
    }
}

export default new TagsRepository();
