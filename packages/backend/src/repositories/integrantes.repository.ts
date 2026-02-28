import { Prisma } from '@prisma/client';
import prisma from '../../prisma/cliente.js';
import { INTEGRANTE_PUBLIC_SELECT } from '../types/index.js';

class IntegrantesRepository {
    /**
     * Lista todos os integrantes com suas funções associadas.
     *
     * @returns Lista de integrantes com seleção pública e funções aninhadas
     */
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

    /**
     * Busca um integrante pelo ID, incluindo funções associadas.
     *
     * @param id - UUID do integrante
     * @returns Integrante com funções ou `null` se não encontrado
     */
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

    /**
     * Busca um integrante pelo ID sem selecionar relações.
     *
     * @param id - UUID do integrante
     * @returns Registro completo do integrante ou `null`
     */
    async findByIdSimple(id: string) {
        return prisma.integrantes.findUnique({ where: { id } });
    }

    /**
     * Busca um integrante pelo email.
     *
     * @param email - Email do integrante a buscar
     * @returns Integrante encontrado ou `null`
     */
    async findByEmail(email: string) {
        return prisma.integrantes.findUnique({ where: { email } });
    }

    /**
     * Busca um integrante pelo email, excluindo um ID específico.
     * Utilizado para validação de unicidade em operações de atualização.
     *
     * @param email - Email a verificar
     * @param excludeId - ID do integrante a excluir da busca
     * @returns Integrante encontrado ou `null`
     */
    async findByEmailExcludingId(email: string, excludeId: string) {
        return prisma.integrantes.findFirst({ where: { email, NOT: { id: excludeId } } });
    }

    /**
     * Cria um novo integrante no banco de dados.
     *
     * @param data - Dados de criação conforme Prisma
     * @returns Integrante criado com seleção pública (sem senha)
     */
    async create(data: Prisma.IntegrantesCreateInput) {
        return prisma.integrantes.create({
            data,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    /**
     * Atualiza os dados de um integrante existente.
     *
     * @param id - UUID do integrante a atualizar
     * @param data - Campos a atualizar conforme Prisma
     * @returns Integrante atualizado com seleção pública (sem senha)
     */
    async update(id: string, data: Prisma.IntegrantesUpdateInput) {
        return prisma.integrantes.update({
            where: { id },
            data,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    /**
     * Remove um integrante pelo ID.
     *
     * @param id - UUID do integrante a remover
     * @returns Registro removido
     */
    async delete(id: string) {
        return prisma.integrantes.delete({ where: { id } });
    }

    /**
     * Busca um integrante pelo ID com seleção pública (sem senha).
     *
     * @param id - UUID do integrante
     * @returns Integrante com campos públicos ou `null`
     */
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

    /**
     * Remove a associação entre integrante e função pelo ID do registro.
     *
     * @param id - UUID do registro de associação
     * @returns Registro removido
     */
    async deleteIntegranteFuncao(id: string) {
        return prisma.integrantes_Funcoes.delete({ where: { id } });
    }

    /**
     * Busca uma função pelo ID.
     *
     * @param funcao_id - UUID da função
     * @returns Função encontrada ou `null`
     */
    async findFuncaoById(funcao_id: string) {
        return prisma.funcoes.findUnique({ where: { id: funcao_id } });
    }

}

export default new IntegrantesRepository();
