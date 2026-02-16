import prisma from '../../prisma/cliente.js';
import { INTEGRANTE_PUBLIC_SELECT } from '../types/index.js';

class IntegrantesRepository {
    async findAll() {
        return prisma.integrantes.findMany({
            select: {
                ...INTEGRANTE_PUBLIC_SELECT,
                Integrantes_Funcoes: {
                    select: {
                        integrantes_funcoes_funcao_id_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
    }

    async findById(id: string) {
        return prisma.integrantes.findUnique({
            where: { id },
            select: {
                ...INTEGRANTE_PUBLIC_SELECT,
                Integrantes_Funcoes: {
                    select: {
                        integrantes_funcoes_funcao_id_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
    }

    async findByIdSimple(id: string) {
        return prisma.integrantes.findUnique({ where: { id } });
    }

    async findByDocId(doc_id: string) {
        return prisma.integrantes.findUnique({ where: { doc_id } });
    }

    async findByDocIdExcludingId(doc_id: string, excludeId: string) {
        return prisma.integrantes.findFirst({ where: { doc_id, NOT: { id: excludeId } } });
    }

    async create(data: Record<string, unknown>) {
        return prisma.integrantes.create({
            data: data as any,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    async update(id: string, data: Record<string, unknown>) {
        return prisma.integrantes.update({
            where: { id },
            data: data as any,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    async delete(id: string) {
        return prisma.integrantes.delete({ where: { id } });
    }

    async findByIdPublic(id: string) {
        return prisma.integrantes.findUnique({
            where: { id },
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    async findFuncoesByIntegranteId(integranteId: string) {
        return prisma.integrantes_Funcoes.findMany({
            where: { musico_id: integranteId },
            select: {
                integrantes_funcoes_funcao_id_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    async findIntegranteFuncao(musico_id: string, funcao_id: string) {
        return prisma.integrantes_Funcoes.findUnique({
            where: { musico_id_funcao_id: { musico_id, funcao_id } }
        });
    }

    async createIntegranteFuncao(musico_id: string, funcao_id: string) {
        return prisma.integrantes_Funcoes.create({
            data: { musico_id, funcao_id }
        });
    }

    async deleteIntegranteFuncao(id: string) {
        return prisma.integrantes_Funcoes.delete({ where: { id } });
    }

    async findFuncaoById(funcao_id: string) {
        return prisma.funcoes.findUnique({ where: { id: funcao_id } });
    }

    async findIntegranteSimple(id: string) {
        return prisma.integrantes.findUnique({ where: { id } });
    }
}

export default new IntegrantesRepository();
