/**
 * Service de igrejas (tenants) — lógica de negócio para gestão de tenants.
 *
 * Executa validações de existência e unicidade antes de delegar ao
 * repositório. Todas as operações são exclusivas ao super-admin e
 * operam de forma cross-tenant (sem filtro de tenant ativo).
 */
import { AppError } from '../errors/AppError.js';
import igrejasRepository from '../repositories/igrejas.repository.js';
import prisma, { SYSTEM_TENANT_ID } from '../../prisma/cliente.js';
import { seedTenantDefaults } from '../../seeds/domain-defaults.js';
import { invalidateTenantCache } from '../providers/tenant-cache.provider.js';

/**
 * Recusa operações sobre o tenant sentinela "Sistema".
 *
 * `SYSTEM_TENANT_ID` é uma constante fixa e pública, e é nele que vivem as
 * atribuições de `super-admin` de toda a plataforma. `findAll` já o esconde da
 * listagem (`status: { not: 'system' }`), mas sem esta guarda um super-admin
 * poderia alcançá-lo por ID direto e renomeá-lo, desativá-lo ou sobrescrever
 * seu `status: 'system'` — o validator só aceita `active`/`inactive`, então não
 * haveria caminho de volta pela API.
 *
 * @param id - UUID do tenant alvo da operação
 * @throws AppError 403 se o alvo for o tenant de sistema
 */
function recusarTenantDeSistema(id: string): void {
  if (id === SYSTEM_TENANT_ID) {
    throw new AppError('Operação não permitida no tenant de sistema', 403);
  }
}

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
   * @throws AppError 403 se o alvo for o tenant de sistema
   * @throws AppError 404 se o tenant não existir
   */
  async getById(id: string) {
    recusarTenantDeSistema(id);
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

    /**
     * Criação e seed correm na mesma transação: se o seed falhar no meio, a
     * igreja também é desfeita. Sem isso, uma falha parcial deixaria a igreja
     * gravada e meio-semeada, e a tentativa seguinte com o mesmo nome bateria
     * no 409 acima — sem caminho de recuperação pela API.
     */
    return prisma.$transaction(async (tx) => {
      const tenant = await igrejasRepository.create({ name }, tx);

      /** Semeia dados padrão de domínio (funções, tipos de evento, categorias) na nova igreja. */
      await seedTenantDefaults(tx, tenant.id);

      return tenant;
    });
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
    recusarTenantDeSistema(id);
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

    const atualizado = await igrejasRepository.update(id, data);

    /**
     * Invalida o cache de status APÓS a escrita no banco. Invalidar antes da escrita
     * abriria uma janela TOCTOU: uma requisição concorrente que leu o status antigo
     * poderia re-popular o cache logo após a invalidação, deixando o status obsoleto
     * em cache até o TTL expirar. (Mesma ordem usada em `deactivate`.)
     */
    if (data.status !== undefined) {
      invalidateTenantCache(id);
    }

    return atualizado;
  }

  /**
   * Desativa um tenant alterando seu status para `inactive`.
   *
   * @param id - UUID do tenant a desativar
   * @returns Tenant atualizado com status `inactive`
   * @throws AppError 404 se o tenant não existir
   */
  async deactivate(id: string) {
    recusarTenantDeSistema(id);
    const existente = await igrejasRepository.findById(id);
    if (!existente) {
      throw new AppError('Igreja não encontrada', 404);
    }
    const resultado = await igrejasRepository.update(id, { status: 'inactive' });

    /** Invalida cache de status do tenant para efeito imediato no middleware de auth. */
    invalidateTenantCache(id);

    /**
     * Invalida todos os refresh tokens dos usuários vinculados ao tenant desativado.
     * Isso força re-autenticação e impede que usuários continuem renovando sessões
     * em um tenant que foi desativado pelo super-admin.
     */
    await igrejasRepository.invalidateRefreshTokens(id);

    return resultado;
  }

  /**
   * Vincula um usuário a um tenant e atribui a role `admin` naquele tenant.
   *
   * Este método é exclusivo do super-admin e pressupõe que o usuário
   * vinculado será o administrador da igreja. A role `admin` é atribuída
   * automaticamente para que o usuário tenha permissões de escrita
   * (integrantes.write, configuracoes.write, etc.) no novo tenant.
   *
   * @param tenantId - UUID do tenant
   * @param userId - UUID do usuário a vincular
   * @returns Registro de vínculo criado
   * @throws AppError 403 se o alvo for o tenant de sistema
   * @throws AppError 404 se o tenant não existir
   * @throws AppError 404 se o usuário não existir
   * @throws AppError 409 se o vínculo já existir
   * @throws AppError 500 se a role `admin` não existir (seed não executado)
   */
  async addUser(tenantId: string, userId: string) {
    recusarTenantDeSistema(tenantId);

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

    /**
     * A role é resolvida ANTES de qualquer escrita: se ela não existir, a
     * requisição falha sem ter criado o vínculo. Fazer o contrário deixaria o
     * usuário vinculado porém sem role, e o retry bateria no 409 acima — o
     * vínculo ficaria permanentemente sem permissões, só recuperável por SQL.
     */
    const adminRole = await prisma.roles.findUnique({ where: { name: 'admin' } });
    if (!adminRole) {
      throw new AppError('Role "admin" não encontrada. Execute o seed de admin antes de vincular usuários.', 500);
    }

    /** Vínculo e atribuição de role são atômicos: nunca um sem o outro. */
    return prisma.$transaction(async (tx) => {
      const vinculo = await igrejasRepository.addUser(tenantId, userId, tx);

      /** Atribui role admin ao usuário no novo tenant (super-admin delegando gestão). */
      await tx.usersRoles.upsert({
        where: {
          user_id_role_id_tenant_id: {
            user_id: userId,
            role_id: adminRole.id,
            tenant_id: tenantId,
          },
        },
        update: {},
        create: {
          user_id: userId,
          role_id: adminRole.id,
          tenant_id: tenantId,
        },
      });

      return vinculo;
    });
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
    recusarTenantDeSistema(tenantId);
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
    recusarTenantDeSistema(tenantId);
    const tenant = await igrejasRepository.findById(tenantId);
    if (!tenant) {
      throw new AppError('Igreja não encontrada', 404);
    }
    return igrejasRepository.findUsers(tenantId);
  }
}

export default new IgrejasService();
