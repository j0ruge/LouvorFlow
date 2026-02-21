import { Prisma } from '@prisma/client';
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

    async create(data: Prisma.IntegrantesCreateInput) {
        return prisma.integrantes.create({
            data,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    async update(id: string, data: Prisma.IntegrantesUpdateInput) {
        return prisma.integrantes.update({
            where: { id },
            data,
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

    /**
     * Retorna as funções associadas a um integrante.
     *
     * Cada registro retornado possui a relação aninhada do Prisma:
     * `integrantes_funcoes_funcao_id_fkey` → `{ id, nome }`.
     * O chamador deve acessar `resultado.integrantes_funcoes_funcao_id_fkey`
     * para obter os dados da função.
     *
     * @param integranteId - ID do integrante
     * @returns Array de registros de `Integrantes_Funcoes` com a relação aninhada da função
     */
    async findFuncoesByIntegranteId(integranteId: string) {
        return prisma.integrantes_Funcoes.findMany({
            where: { fk_integrante_id: integranteId },
            select: {
                integrantes_funcoes_funcao_id_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    /**
     * Busca um vínculo específico entre integrante e função.
     *
     * @param fk_integrante_id - ID do integrante
     * @param funcao_id - ID da função
     * @returns Registro encontrado ou `null` se não existir
     */
    async findIntegranteFuncao(fk_integrante_id: string, funcao_id: string) {
        return prisma.integrantes_Funcoes.findUnique({
            where: { fk_integrante_id_funcao_id: { fk_integrante_id, funcao_id } }
        });
    }

    /**
     * Cria a associação entre um integrante e uma função.
     *
     * @param fk_integrante_id - ID do integrante
     * @param funcao_id - ID da função a ser vinculada
     * @returns Registro criado na tabela Integrantes_Funcoes
     */
    async createIntegranteFuncao(fk_integrante_id: string, funcao_id: string) {
        return prisma.integrantes_Funcoes.create({
            data: { fk_integrante_id, funcao_id }
        });
    }

    async deleteIntegranteFuncao(id: string) {
        return prisma.integrantes_Funcoes.delete({ where: { id } });
    }

    async findFuncaoById(funcao_id: string) {
        return prisma.funcoes.findUnique({ where: { id: funcao_id } });
    }

}

export default new IntegrantesRepository();
