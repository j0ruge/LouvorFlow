/**
 * Testes unitários do serviço de gestão de igrejas (tenants).
 *
 * Valida os cenários de criação com unicidade, busca por ID,
 * vinculação/desvinculação de usuários e desativação de tenants.
 */

import { createFakeTenantRepository } from '../fakes/fake-tenant.repository.js';
import {
  MOCK_TENANTS,
  MOCK_INTEGRANTES,
  TENANT_A_ID,
  NON_EXISTENT_ID,
  SYSTEM_TENANT_ID as MOCK_SYSTEM_TENANT_ID,
} from '../fakes/mock-data.js';

/** Fake repository de tenants com dados in-memory. */
const fakeTenantRepo = createFakeTenantRepository();

/** UUID do João (MOCK_INTEGRANTES[0]) — usado nos testes de vínculo. */
const USER_ID = MOCK_INTEGRANTES[0].id;

/**
 * Mock do repositório de igrejas delegando para o fake in-memory.
 * Adiciona os métodos `findTenantUser`, `addUser`, `removeUser` e `findUsers`
 * ausentes no `createFakeTenantRepository` básico.
 */
const fakeTenantUserBindings: Array<{ id: string; tenant_id: string; user_id: string }> = [];

const fakeIgrejasRepo = {
  /** Delega listagem ao fake repository. */
  findAll: () => fakeTenantRepo.findAll(),
  /** Delega busca por ID ao fake repository. */
  findById: (id: string) => fakeTenantRepo.findById(id),
  /** Delega busca por nome ao fake repository. */
  findByName: (name: string) => fakeTenantRepo.findByName(name),
  /** Delega criação ao fake repository. */
  create: (data: { name: string }) => fakeTenantRepo.create(data),
  /** Delega atualização ao fake repository. */
  update: (id: string, data: { name?: string; status?: string }) => fakeTenantRepo.update(id, data),
  /** Verifica a existência do vínculo user-tenant nos dados in-memory. */
  findTenantUser: async (tenantId: string, userId: string) =>
    fakeTenantUserBindings.find(b => b.tenant_id === tenantId && b.user_id === userId) ?? null,
  /** Cria um novo vínculo user-tenant. */
  addUser: async (tenantId: string, userId: string) => {
    const binding = { id: `binding-${tenantId}-${userId}`, tenant_id: tenantId, user_id: userId };
    fakeTenantUserBindings.push(binding);
    return binding;
  },
  /**
   * Remove o vínculo user-tenant e devolve quantas linhas saíram — mesmo
   * contrato do repositório real, que usa `deleteMany` para que uma remoção
   * concorrente seja detectável por `count === 0` em vez de lançar `P2025`.
   */
  removeUser: async (tenantId: string, userId: string) => {
    const idx = fakeTenantUserBindings.findIndex(b => b.tenant_id === tenantId && b.user_id === userId);
    if (idx === -1) return 0;
    fakeTenantUserBindings.splice(idx, 1);
    return 1;
  },
  /** Lista usuários de um tenant (retorna lista vazia para simplificação). */
  findUsers: async (_tenantId: string) => [],
  /** Simula invalidação de refresh tokens (no-op no fake). */
  invalidateRefreshTokens: async (_tenantId: string) => {},
};

vi.mock('../../src/repositories/igrejas.repository.js', () => ({
  default: fakeIgrejasRepo,
}));

/** ID fixo da role admin usada nos testes de atribuição automática. */
const ADMIN_ROLE_ID = 'role-admin-id';

/** Armazena os registros de UsersRoles criados durante os testes. */
const fakeUsersRoles: Array<{ user_id: string; role_id: string; tenant_id: string }> = [];

/**
 * Mock do Prisma para `users.findUnique`, `roles.findUnique` e `usersRoles.upsert`
 * — simula verificação de existência do usuário, busca da role admin e atribuição
 * de role ao vincular usuário ao tenant.
 */
/** Mock do seedTenantDefaults — no-op nos testes unitários. */
vi.mock('../../seeds/domain-defaults.js', () => ({
  seedTenantDefaults: vi.fn().mockResolvedValue(undefined),
}));

/** Mock do invalidateTenantCache para verificar chamada na desativação. */
const mockInvalidateTenantCache = vi.fn();
vi.mock('../../src/providers/tenant-cache.provider.js', () => ({
  invalidateTenantCache: (...args: unknown[]) => mockInvalidateTenantCache(...args),
}));

vi.mock('../../prisma/cliente.js', () => {
  /**
   * Cliente Prisma falso. `$transaction` executa o callback com o próprio
   * cliente, espelhando o comportamento real o suficiente para os testes:
   * o service escreve pelo `tx` recebido, e aqui ele é o mesmo objeto.
   */
  const client: Record<string, unknown> = {
    users: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        const found = MOCK_INTEGRANTES.find(u => u.id === where.id);
        return Promise.resolve(found ? { id: found.id } : null);
      }),
    },
    roles: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { name: string } }) => {
        if (where.name === 'admin') {
          return Promise.resolve({ id: ADMIN_ROLE_ID, name: 'admin' });
        }
        return Promise.resolve(null);
      }),
    },
    usersRoles: {
      upsert: vi.fn().mockImplementation(({ create }: { create: { user_id: string; role_id: string; tenant_id: string } }) => {
        fakeUsersRoles.push(create);
        return Promise.resolve(create);
      }),
    },
  };
  client.$transaction = vi.fn().mockImplementation(
    (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  );

  return {
    default: client,
    /** Mesma constante do módulo real — usada pela guarda do tenant sentinela. */
    SYSTEM_TENANT_ID: MOCK_SYSTEM_TENANT_ID,
  };
});

const { default: igrejasService } = await import('../../src/services/igrejas.service.js');

/** @group IgrejasService */
describe('IgrejasService', () => {
  /** Reseta os fakes antes de cada teste para garantir isolamento. */
  beforeEach(() => {
    fakeTenantRepo.reset();
    fakeTenantUserBindings.length = 0;
    fakeUsersRoles.length = 0;
    mockInvalidateTenantCache.mockClear();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  /** Agrupa os testes do método `create`. */
  describe('create', () => {
    /**
     * Deve criar um tenant com nome único e retornar o objeto criado.
     */
    it('deve criar um tenant com nome único', async () => {
      const result = await igrejasService.create('Nova Igreja');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'Nova Igreja');
    });

    /**
     * Deve lançar AppError 409 quando já existe um tenant com o mesmo nome.
     */
    it('deve lançar erro 409 para nome de igreja duplicado', async () => {
      const nomeExistente = MOCK_TENANTS[2].name; // 'Igreja Central'

      await expect(igrejasService.create(nomeExistente)).rejects.toMatchObject({
        message: 'Já existe uma igreja com esse nome',
        statusCode: 409,
      });
    });
  });

  // ─── getById ─────────────────────────────────────────────────────────────

  /** Agrupa os testes do método `getById`. */
  describe('getById', () => {
    /**
     * Deve lançar AppError 404 quando o tenant não existe.
     */
    it('deve lançar erro 404 para tenant inexistente', async () => {
      await expect(igrejasService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        message: 'Igreja não encontrada',
        statusCode: 404,
      });
    });

    /**
     * Deve retornar o tenant quando o ID for válido e existente.
     */
    it('deve retornar o tenant quando o ID existe', async () => {
      const result = await igrejasService.getById(TENANT_A_ID);

      expect(result).toHaveProperty('id', TENANT_A_ID);
    });
  });

  // ─── addUser ─────────────────────────────────────────────────────────────

  /** Agrupa os testes do método `addUser`. */
  describe('addUser', () => {
    /**
     * Deve criar o vínculo user-tenant com sucesso.
     */
    it('deve vincular usuário ao tenant com sucesso', async () => {
      const result = await igrejasService.addUser(TENANT_A_ID, USER_ID);

      expect(result).toHaveProperty('tenant_id', TENANT_A_ID);
      expect(result).toHaveProperty('user_id', USER_ID);
    });

    /**
     * Deve lançar AppError 404 quando o usuário não existe no sistema.
     */
    it('deve lançar erro 404 quando usuário não existe', async () => {
      await expect(igrejasService.addUser(TENANT_A_ID, NON_EXISTENT_ID)).rejects.toMatchObject({
        message: 'Usuário não encontrado',
        statusCode: 404,
      });
    });

    /**
     * Deve atribuir automaticamente a role admin ao usuário no novo tenant.
     */
    it('deve atribuir role admin ao usuário no tenant ao vincular', async () => {
      await igrejasService.addUser(TENANT_A_ID, USER_ID);

      expect(fakeUsersRoles).toHaveLength(1);
      expect(fakeUsersRoles[0]).toMatchObject({
        user_id: USER_ID,
        role_id: ADMIN_ROLE_ID,
        tenant_id: TENANT_A_ID,
      });
    });

    /**
     * Deve lançar AppError 409 quando o vínculo já existe.
     */
    it('deve lançar erro 409 quando usuário já está vinculado ao tenant', async () => {
      // Cria o vínculo pela primeira vez
      await igrejasService.addUser(TENANT_A_ID, USER_ID);

      // Tenta vincular novamente
      await expect(igrejasService.addUser(TENANT_A_ID, USER_ID)).rejects.toMatchObject({
        message: 'Usuário já vinculado a essa igreja',
        statusCode: 409,
      });
    });
  });

  // ─── removeUser ──────────────────────────────────────────────────────────

  /** Agrupa os testes do método `removeUser`. */
  describe('removeUser', () => {
    /**
     * Deve remover o vínculo user-tenant com sucesso sem lançar erros.
     */
    it('deve remover vínculo existente com sucesso', async () => {
      // Prepara o vínculo antes de remover
      fakeTenantUserBindings.push({ id: 'binding-1', tenant_id: TENANT_A_ID, user_id: USER_ID });

      await expect(igrejasService.removeUser(TENANT_A_ID, USER_ID)).resolves.toBeUndefined();
    });
  });

  // ─── deactivate ──────────────────────────────────────────────────────────

  /** Agrupa os testes do método `deactivate`. */
  describe('deactivate', () => {
    /**
     * Deve desativar um tenant existente alterando seu status para `inactive`.
     */
    it('deve desativar o tenant com sucesso', async () => {
      const result = await igrejasService.deactivate(TENANT_A_ID);

      expect(result).toHaveProperty('status', 'inactive');
    });

    /**
     * Deve invalidar o cache de status do tenant ao desativar,
     * garantindo efeito imediato no middleware de autenticação.
     */
    it('deve invalidar o cache de status do tenant ao desativar', async () => {
      await igrejasService.deactivate(TENANT_A_ID);

      expect(mockInvalidateTenantCache).toHaveBeenCalledWith(TENANT_A_ID);
      expect(mockInvalidateTenantCache).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Guarda do tenant sentinela ──────────────────────────────────────────

  /**
   * O tenant "Sistema" ancora as atribuições de `super-admin` de toda a
   * plataforma e seu UUID é uma constante pública. Nenhuma operação de gestão
   * pode alcançá-lo por ID direto: renomeá-lo ou sobrescrever seu
   * `status: 'system'` seria irreversível pela API.
   */
  describe('guarda do tenant de sistema', () => {
    /** Deve recusar leitura do tenant sentinela com 403. */
    it('deve recusar getById no tenant de sistema', async () => {
      await expect(igrejasService.getById(MOCK_SYSTEM_TENANT_ID)).rejects.toMatchObject({
        statusCode: 403,
        message: 'Operação não permitida no tenant de sistema',
      });
    });

    /** Deve recusar atualização do tenant sentinela com 403. */
    it('deve recusar update no tenant de sistema', async () => {
      await expect(
        igrejasService.update(MOCK_SYSTEM_TENANT_ID, { status: 'active' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    /** Deve recusar desativação do tenant sentinela com 403. */
    it('deve recusar deactivate no tenant de sistema', async () => {
      await expect(igrejasService.deactivate(MOCK_SYSTEM_TENANT_ID)).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(mockInvalidateTenantCache).not.toHaveBeenCalled();
    });

    /** Deve recusar vínculo de usuário ao tenant sentinela com 403. */
    it('deve recusar addUser no tenant de sistema', async () => {
      await expect(igrejasService.addUser(MOCK_SYSTEM_TENANT_ID, USER_ID)).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(fakeUsersRoles).toHaveLength(0);
      expect(fakeTenantUserBindings).toHaveLength(0);
    });

    /** Deve recusar desvínculo de usuário do tenant sentinela com 403. */
    it('deve recusar removeUser no tenant de sistema', async () => {
      await expect(igrejasService.removeUser(MOCK_SYSTEM_TENANT_ID, USER_ID)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    /** Deve recusar listagem de usuários do tenant sentinela com 403. */
    it('deve recusar listUsers no tenant de sistema', async () => {
      await expect(igrejasService.listUsers(MOCK_SYSTEM_TENANT_ID)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  /**
   * Corridas de concorrência: as checagens de leitura antes da escrita cobrem só
   * o caso sequencial. Estes testes exercitam o que sobra — o erro de constraint
   * do Prisma chegando à camada de service — e garantem que ele vira `AppError`
   * em vez de escapar cru como 500.
   */
  describe('tradução de erros de corrida (P2002 / count 0)', () => {
    /** Constrói um erro no formato do Prisma para violação de unicidade. */
    function erroP2002(): Error & { code: string } {
      const erro = new Error('Unique constraint failed') as Error & { code: string };
      erro.code = 'P2002';
      return erro;
    }

    /** Nome duplicado gravado por outra requisição vira 409, não 500. */
    it('create traduz P2002 de nome duplicado em 409', async () => {
      vi.spyOn(fakeIgrejasRepo, 'create').mockRejectedValueOnce(erroP2002());

      await expect(igrejasService.create('Igreja Nova Corrida')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma igreja com esse nome',
      });
    });

    /** Renomear para um nome tomado na corrida vira 409, não 500. */
    it('update traduz P2002 de nome duplicado em 409', async () => {
      vi.spyOn(fakeIgrejasRepo, 'update').mockRejectedValueOnce(erroP2002());

      await expect(
        igrejasService.update(TENANT_A_ID, { name: 'Nome Tomado Na Corrida' }),
      ).rejects.toMatchObject({ statusCode: 409, message: 'Já existe uma igreja com esse nome' });
    });

    /** Vínculo criado por outra requisição vira 409, não 500. */
    it('addUser traduz P2002 de vínculo duplicado em 409', async () => {
      vi.spyOn(fakeIgrejasRepo, 'addUser').mockRejectedValueOnce(erroP2002());

      await expect(igrejasService.addUser(TENANT_A_ID, USER_ID)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Usuário já vinculado a essa igreja',
      });
    });

    /** Vínculo removido por outra requisição no meio da operação vira 404. */
    it('removeUser traduz remoção de zero linhas em 404', async () => {
      fakeTenantUserBindings.push({
        id: `binding-${TENANT_A_ID}-${USER_ID}`,
        tenant_id: TENANT_A_ID,
        user_id: USER_ID,
      });
      /** Simula o vínculo sumindo entre o `findTenantUser` e o delete. */
      vi.spyOn(fakeIgrejasRepo, 'removeUser').mockResolvedValueOnce(0);

      await expect(igrejasService.removeUser(TENANT_A_ID, USER_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Vínculo entre usuário e igreja não encontrado',
      });

      fakeTenantUserBindings.length = 0;
    });

    /** Erros que não são de unicidade seguem propagando sem mascaramento. */
    it('não mascara erros que não são P2002', async () => {
      const outro = new Error('falha de conexão') as Error & { code: string };
      outro.code = 'P1001';
      vi.spyOn(fakeIgrejasRepo, 'create').mockRejectedValueOnce(outro);

      await expect(igrejasService.create('Igreja Erro Generico')).rejects.toThrow('falha de conexão');
    });
  });
});
