/**
 * Service de igrejas (tenants) — lógica de negócio para gestão de tenants.
 *
 * Executa validações de existência e unicidade antes de delegar ao
 * repositório. Todas as operações são exclusivas ao super-admin e
 * operam de forma cross-tenant (sem filtro de tenant ativo).
 */
import { AppError } from '../errors/AppError.js';
import igrejasRepository from '../repositories/igrejas.repository.js';
import prisma from '../../prisma/cliente.js';

/**
 * Service responsável pela gestão de tenants (igrejas) na plataforma.
 *
 * Implementa as regras de negócio: unicidade de nome, existência de
 * tenant e de usuário, prevenção de vínculos duplicados e remoção
 * segura com limpeza de RBAC associado.
 */
class IgrejasService {
  /**
   * Lista todos os tenants ativos ou inativos (exclui o tenant de sistema).
   *
   * @returns Lista de tenants com contagem de usuários
   */
  async listAll() {
    return igrejasRepository.findAll();
  }

  /**
   * Busca um tenant pelo ID.
   *
   * @param id - UUID do tenant
   * @returns Dados do tenant com contagem de usuários
   * @throws AppError 404 se o tenant não existir
   */
  async getById(id: string) {
    const tenant = await igrejasRepository.findById(id);
    if (!tenant) {
      throw new AppError('Igreja não encontrada', 404);
    }
    return tenant;
  }

  /**
   * Cria um novo tenant com o nome fornecido.
   *
   * @param name - Nome da igreja a criar
   * @returns Tenant recém-criado
   * @throws AppError 409 se já existir um tenant com o mesmo nome
   */
  async create(name: string) {
    const existente = await igrejasRepository.findByName(name);
    if (existente) {
      throw new AppError('Já existe uma igreja com esse nome', 409);
    }
    return igrejasRepository.create({ name });
  }

  /**
   * Atualiza os dados de um tenant existente.
   *
   * Verifica unicidade do nome em relação aos demais tenants (ignora o próprio).
   *
   * @param id - UUID do tenant a atualizar
   * @param data - Campos a atualizar (nome e/ou status)
   * @returns Tenant atualizado
   * @throws AppError 404 se o tenant não existir
   * @throws AppError 409 se o nome já pertencer a outro tenant
   */
  async update(id: string, data: { name?: string; status?: 'active' | 'inactive' }) {
    const existente = await igrejasRepository.findById(id);
    if (!existente) {
      throw new AppError('Igreja não encontrada', 404);
    }

    if (data.name !== undefined) {
      const duplicado = await igrejasRepository.findByName(data.name);
      if (duplicado && duplicado.id !== id) {
        throw new AppError('Já existe uma igreja com esse nome', 409);
      }
    }

    return igrejasRepository.update(id, data);
  }

  /**
   * Desativa um tenant alterando seu status para `inactive`.
   *
   * @param id - UUID do tenant a desativar
   * @returns Tenant atualizado com status `inactive`
   * @throws AppError 404 se o tenant não existir
   */
  async deactivate(id: string) {
    const existente = await igrejasRepository.findById(id);
    if (!existente) {
      throw new AppError('Igreja não encontrada', 404);
    }
    const resultado = await igrejasRepository.update(id, { status: 'inactive' });

    /**
     * Invalida todos os refresh tokens dos usuários vinculados ao tenant desativado.
     * Isso força re-autenticação e impede que usuários continuem renovando sessões
     * em um tenant que foi desativado pelo super-admin.
     */
    await igrejasRepository.invalidateRefreshTokens(id);

    return resultado;
  }

  /**
   * Vincula um usuário a um tenant.
   *
   * Valida que o tenant existe, que o usuário existe no sistema e que
   * ainda não há vínculo entre os dois.
   *
   * @param tenantId - UUID do tenant
   * @param userId - UUID do usuário a vincular
   * @returns Registro de vínculo criado
   * @throws AppError 404 se o tenant não existir
   * @throws AppError 404 se o usuário não existir
   * @throws AppError 409 se o vínculo já existir
   */
  async addUser(tenantId: string, userId: string) {
    const tenant = await igrejasRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError('Igreja não encontrada', 404);
    }

    const usuario = await prisma.users.findUnique({ where: { id: userId }, select: { id: true } });
    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const vinculoExistente = await igrejasRepository.findTenantUser(tenantId, userId);
    if (vinculoExistente) {
      throw new AppError('Usuário já vinculado a essa igreja', 409);
    }

    return igrejasRepository.addUser(tenantId, userId);
  }

  /**
   * Remove o vínculo entre um usuário e um tenant, limpando também
   * as roles e permissões diretas do usuário naquele tenant.
   *
   * @param tenantId - UUID do tenant
   * @param userId - UUID do usuário a desvincular
   * @throws AppError 404 se o tenant não existir
   * @throws AppError 404 se o vínculo não existir
   */
  async removeUser(tenantId: string, userId: string) {
    const tenant = await igrejasRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError('Igreja não encontrada', 404);
    }

    const vinculo = await igrejasRepository.findTenantUser(tenantId, userId);
    if (!vinculo) {
      throw new AppError('Vínculo entre usuário e igreja não encontrado', 404);
    }

    await igrejasRepository.removeUser(tenantId, userId);
  }

  /**
   * Lista os usuários vinculados a um tenant.
   *
   * @param tenantId - UUID do tenant
   * @returns Lista de usuários com campos públicos
   * @throws AppError 404 se o tenant não existir
   */
  async listUsers(tenantId: string) {
    const tenant = await igrejasRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError('Igreja não encontrada', 404);
    }
    return igrejasRepository.findUsers(tenantId);
  }
}

export default new IgrejasService();
