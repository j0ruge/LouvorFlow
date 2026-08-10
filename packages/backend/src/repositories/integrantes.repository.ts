import prisma, { getPrisma } from '../../prisma/cliente.js';
import { INTEGRANTE_PUBLIC_SELECT } from '../types/index.js';

/**
 * Repositório de integrantes — opera sobre a tabela `users` após unificação.
 *
 * Consultas utilizam `prisma.users` com `INTEGRANTE_PUBLIC_SELECT` para excluir
 * campos sensíveis (`password`, `avatar`). Funções musicais são carregadas via
 * junction table `Users_Funcoes`.
 *
 * Operações sobre `users` usam o client base (global), pois `users` não é
 * filtrada por tenant. Operações sobre `users_Funcoes` e `funcoes` usam
 * `getPrisma()` para filtro automático de tenant.
 */
class IntegrantesRepository {
    /**
     * Lista todos os users com suas funções musicais associadas.
     *
     * A relação aninhada `Users_Funcoes` é explicitamente filtrada por `tenant_id`
     * quando `tenantId` é fornecido. Como a query roda no client base (`users` é
     * global), o `$extends` de tenant NÃO é aplicado às relações aninhadas — sem
     * este filtro, funções de OUTROS tenants vazariam para usuários compartilhados
     * entre igrejas.
     *
     * @param tenantId - UUID do tenant ativo para escopar usuários e funções.
     * @returns Lista de users com seleção pública e funções aninhadas do tenant
     */
    async findAll(tenantId?: string) {
        /** Filtra por tenant quando tenantId é fornecido. */
        const where = tenantId
            ? { tenant_users: { some: { tenant_id: tenantId } } }
            : {};

        return prisma.users.findMany({
            where,
            select: {
                ...INTEGRANTE_PUBLIC_SELECT,
                Users_Funcoes: {
                    where: tenantId ? { tenant_id: tenantId } : undefined,
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
     * A relação aninhada `Users_Funcoes` é filtrada por `tenant_id` quando
     * `tenantId` é fornecido, evitando vazamento de funções de outros tenants para
     * usuários compartilhados entre igrejas (ver explicação em {@link findAll}).
     *
     * @param id - UUID do user
     * @param tenantId - UUID do tenant ativo para escopar as funções aninhadas.
     * @returns User com funções do tenant ou `null` se não encontrado
     */
    async findById(id: string, tenantId?: string) {
        return prisma.users.findUnique({
            where: { id },
            select: {
                ...INTEGRANTE_PUBLIC_SELECT,
                Users_Funcoes: {
                    where: tenantId ? { tenant_id: tenantId } : undefined,
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
     * Busca um user pelo email, ignorando diferenças de caixa.
     *
     * A comparação precisa ser case-insensitive para casar com
     * `auth/users.repository.findByEmail` (usada no login): se esta busca fosse
     * case-sensitive, `Bob@x.com` não encontraria o `bob@x.com` já cadastrado e
     * o aceite de convite criaria uma segunda conta para a mesma pessoa —
     * a constraint `@unique` de `Users.email` é case-sensitive e não barraria.
     *
     * @param email - Email do user a buscar
     * @returns User encontrado ou `null`
     */
    async findByEmail(email: string) {
        return prisma.users.findFirst({
            orderBy: { created_at: 'asc' },
            where: { email: { equals: email, mode: 'insensitive' } },
        });
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
        return prisma.users.findFirst({
            orderBy: { created_at: 'asc' },
            where: {
                email: { equals: email, mode: 'insensitive' },
                NOT: { id: excludeId },
            },
        });
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
        return prisma.users.delete({ where: { id }, select: INTEGRANTE_PUBLIC_SELECT });
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
     * Usa `getPrisma()` pois `users_Funcoes` é uma tabela de domínio filtrada por tenant.
     *
     * @param userId - ID do user
     * @returns Array de registros de `Users_Funcoes` com a relação aninhada da função
     */
    async findFuncoesByIntegranteId(userId: string) {
        return getPrisma().users_Funcoes.findMany({
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
     * Usa `getPrisma()` pois `users_Funcoes` é uma tabela de domínio filtrada por tenant.
     *
     * @param fk_user_id - ID do user
     * @param funcao_id - ID da função
     * @returns Registro encontrado ou `null` se não existir
     */
    async findIntegranteFuncao(fk_user_id: string, funcao_id: string) {
        return getPrisma().users_Funcoes.findFirst({
            where: { fk_user_id, funcao_id }
        });
    }

    /**
     * Cria a associação entre um user e uma função musical.
     * Usa `getPrisma()` pois `users_Funcoes` é uma tabela de domínio filtrada por tenant.
     *
     * @param fk_user_id - ID do user
     * @param funcao_id - ID da função a ser vinculada
     * @param tenantId - ID do tenant ao qual o vínculo pertence
     * @returns Registro criado na tabela Users_Funcoes
     */
    async createIntegranteFuncao(fk_user_id: string, funcao_id: string, tenantId: string) {
        return getPrisma().users_Funcoes.create({
            data: { fk_user_id, funcao_id, tenant_id: tenantId }
        });
    }

    /**
     * Remove a associação entre user e função musical pelo ID do registro.
     * Usa `getPrisma()` pois `users_Funcoes` é uma tabela de domínio filtrada por tenant.
     *
     * @param id - UUID do registro de associação
     * @returns Registro removido
     */
    async deleteIntegranteFuncao(id: string) {
        return getPrisma().users_Funcoes.delete({ where: { id } });
    }

    /**
     * Busca uma função pelo ID.
     * Usa `getPrisma()` pois `funcoes` é uma tabela de domínio filtrada por tenant.
     *
     * @param funcao_id - UUID da função
     * @returns Função encontrada ou `null`
     */
    async findFuncaoById(funcao_id: string) {
        return getPrisma().funcoes.findUnique({ where: { id: funcao_id } });
    }
}

export default new IntegrantesRepository();
