import prisma from '../../prisma/cliente.js';
import { INTEGRANTE_PUBLIC_SELECT } from '../types/index.js';

/**
 * Repositório de integrantes — opera sobre a tabela `users` após unificação.
 *
 * Consultas utilizam `prisma.users` com `INTEGRANTE_PUBLIC_SELECT` para excluir
 * campos sensíveis (`password`, `avatar`). Funções musicais são carregadas via
 * junction table `Users_Funcoes`.
 */
class IntegrantesRepository {
    /**
     * Lista todos os users com suas funções musicais associadas.
     *
     * @returns Lista de users com seleção pública e funções aninhadas
     */
    async findAll() {
        return prisma.users.findMany({
            select: {
                ...INTEGRANTE_PUBLIC_SELECT,
                Users_Funcoes: {
                    select: {
                        users_funcoes_funcao_id_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
    }

    /**
     * Busca um user pelo ID, incluindo funções musicais associadas.
     *
     * @param id - UUID do user
     * @returns User com funções ou `null` se não encontrado
     */
    async findById(id: string) {
        return prisma.users.findUnique({
            where: { id },
            select: {
                ...INTEGRANTE_PUBLIC_SELECT,
                Users_Funcoes: {
                    select: {
                        users_funcoes_funcao_id_fkey: {
                            select: { id: true, nome: true }
                        }
                    }
                }
            }
        });
    }

    /**
     * Busca um user pelo ID sem selecionar relações.
     *
     * @param id - UUID do user
     * @returns Registro do user ou `null`
     */
    async findByIdSimple(id: string) {
        return prisma.users.findUnique({ where: { id } });
    }

    /**
     * Busca um user pelo email.
     *
     * @param email - Email do user a buscar
     * @returns User encontrado ou `null`
     */
    async findByEmail(email: string) {
        return prisma.users.findUnique({ where: { email } });
    }

    /**
     * Busca um user pelo email, excluindo um ID específico.
     * Utilizado para validação de unicidade em operações de atualização.
     *
     * @param email - Email a verificar
     * @param excludeId - ID do user a excluir da busca
     * @returns User encontrado ou `null`
     */
    async findByEmailExcludingId(email: string, excludeId: string) {
        return prisma.users.findFirst({ where: { email, NOT: { id: excludeId } } });
    }

    /**
     * Cria um novo user no banco de dados.
     *
     * @param data - Dados de criação (campos do model Users: name, email, password, telefone)
     * @returns User criado com seleção pública (sem password)
     */
    async create(data: { name: string; email: string; password: string; telefone?: string | null }) {
        return prisma.users.create({
            data,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    /**
     * Atualiza os dados de um user existente.
     *
     * @param id - UUID do user a atualizar
     * @param data - Campos a atualizar (campos do model Users)
     * @returns User atualizado com seleção pública (sem password)
     */
    async update(id: string, data: { name?: string; email?: string; password?: string; telefone?: string | null }) {
        return prisma.users.update({
            where: { id },
            data,
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    /**
     * Remove um user pelo ID.
     *
     * @param id - UUID do user a remover
     * @returns Registro removido
     */
    async delete(id: string) {
        return prisma.users.delete({ where: { id } });
    }

    /**
     * Busca um user pelo ID com seleção pública (sem password).
     *
     * @param id - UUID do user
     * @returns User com campos públicos ou `null`
     */
    async findByIdPublic(id: string) {
        return prisma.users.findUnique({
            where: { id },
            select: INTEGRANTE_PUBLIC_SELECT
        });
    }

    /**
     * Retorna as funções musicais associadas a um user.
     *
     * @param userId - ID do user
     * @returns Array de registros de `Users_Funcoes` com a relação aninhada da função
     */
    async findFuncoesByIntegranteId(userId: string) {
        return prisma.users_Funcoes.findMany({
            where: { fk_user_id: userId },
            select: {
                users_funcoes_funcao_id_fkey: {
                    select: { id: true, nome: true }
                }
            }
        });
    }

    /**
     * Busca um vínculo específico entre user e função musical.
     *
     * @param fk_user_id - ID do user
     * @param funcao_id - ID da função
     * @returns Registro encontrado ou `null` se não existir
     */
    async findIntegranteFuncao(fk_user_id: string, funcao_id: string) {
        return prisma.users_Funcoes.findUnique({
            where: { fk_user_id_funcao_id: { fk_user_id, funcao_id } }
        });
    }

    /**
     * Cria a associação entre um user e uma função musical.
     *
     * @param fk_user_id - ID do user
     * @param funcao_id - ID da função a ser vinculada
     * @returns Registro criado na tabela Users_Funcoes
     */
    async createIntegranteFuncao(fk_user_id: string, funcao_id: string) {
        return prisma.users_Funcoes.create({
            data: { fk_user_id, funcao_id }
        });
    }

    /**
     * Remove a associação entre user e função musical pelo ID do registro.
     *
     * @param id - UUID do registro de associação
     * @returns Registro removido
     */
    async deleteIntegranteFuncao(id: string) {
        return prisma.users_Funcoes.delete({ where: { id } });
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
