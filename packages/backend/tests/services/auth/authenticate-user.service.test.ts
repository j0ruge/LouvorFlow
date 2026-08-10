/**
 * Testes unitários do serviço de autenticação de usuários com suporte multi-tenant.
 *
 * Valida os cenários de login com credenciais válidas para tenant único,
 * fluxo de seleção para múltiplos tenants, email inexistente, senha incorreta
 * e usuário sem tenant ativo vinculado.
 */

import { AppError } from '../../../src/errors/AppError.js';
import { TENANT_A_ID, TENANT_B_ID, SENHA_TESTE } from '../../fakes/mock-data.js';

import fakeUsersRepo from '../../fakes/auth/fake-users.repository.js';
import fakeHashProvider from '../../fakes/auth/fake-hash.provider.js';
import fakeTokenProvider from '../../fakes/auth/fake-token.provider.js';
import fakeRefreshTokensRepo from '../../fakes/auth/fake-refresh-tokens.repository.js';
import fakeDateProvider from '../../fakes/auth/fake-date.provider.js';

/** Tenants ativos retornados pelo mock do Prisma por padrão (tenant único). */
let mockActiveTenants: Array<{ tenant: { id: string; name: string; status: string } }> = [];

/** Email do usuário criado no teste — usado pelo mock de prisma.users.findUnique. */
let lastCreatedEmail: string | null = null;

/**
 * Mock do módulo Prisma para simular as consultas de autenticação multi-tenant.
 * `mockActiveTenants` controla o cenário de tenants por teste.
 * `users.findUnique` busca via fakeUsersRepo.findByEmail para retornar usuário completo.
 */
vi.mock('../../../prisma/cliente.js', () => ({
    SYSTEM_TENANT_ID: '00000000-0000-0000-0000-000000000000',
    default: {
        tenantUsers: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockActiveTenants)),
        },
        users: {
            findUnique: vi.fn().mockImplementation(async () => {
                if (!lastCreatedEmail) return null;
                const user = await fakeUsersRepo.findByEmail(lastCreatedEmail);
                if (!user) return null;
                return { ...user, roles: [], permissions: [] };
            }),
        },
    },
}));

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/hash.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-hash.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/token.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-token.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/refresh-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-refresh-tokens.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/date.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-date.provider.js');
    return { default: fake.default };
});

const { default: authenticateUserService } = await import(
    '../../../src/services/auth/authenticate-user.service.js'
);

/** @group AuthenticateUserService */
describe('AuthenticateUserService', () => {
    /** Reinicia os repositórios fake e o mock de tenants antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepo.reset();
        fakeRefreshTokensRepo.reset();
        fakeTokenProvider.reset();
        mockActiveTenants = [];
        lastCreatedEmail = null;
    });

    /** Deve autenticar com credenciais válidas e tenant único retornando usuário, token e refresh token. */
    it('deve autenticar com credenciais válidas (tenant único)', async () => {
        mockActiveTenants = [
            { tenant: { id: TENANT_A_ID, name: 'Igreja Central', status: 'active' } },
        ];

        await fakeUsersRepo.create({
            name: 'Test',
            email: 'test@test.com',
            password: SENHA_TESTE,
        });
        lastCreatedEmail = 'test@test.com';

        const result = await authenticateUserService.execute({
            email: 'test@test.com',
            password: SENHA_TESTE,
        });

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('refresh_token');
        expect((result as any).user.email).toBe('test@test.com');
        expect((result as any).user.tenant).toMatchObject({ id: TENANT_A_ID, name: 'Igreja Central' });
    });

    /** Deve retornar dados de seleção de tenant quando o usuário pertence a múltiplos tenants. */
    it('deve retornar requires_tenant_selection para múltiplos tenants', async () => {
        mockActiveTenants = [
            { tenant: { id: TENANT_A_ID, name: 'Igreja Central', status: 'active' } },
            { tenant: { id: TENANT_B_ID, name: 'Igreja Norte', status: 'active' } },
        ];

        await fakeUsersRepo.create({
            name: 'Multi',
            email: 'multi@test.com',
            password: SENHA_TESTE,
        });

        const result = await authenticateUserService.execute({
            email: 'multi@test.com',
            password: SENHA_TESTE,
        });

        expect(result).toMatchObject({
            requires_tenant_selection: true,
            tenants: expect.arrayContaining([
                { id: TENANT_A_ID, name: 'Igreja Central' },
                { id: TENANT_B_ID, name: 'Igreja Norte' },
            ]),
            selection_token: expect.any(String),
        });
        expect((result as any).token).toBeUndefined();
    });

    /** Deve lançar AppError 401 quando o usuário não possui nenhum tenant ativo vinculado. */
    it('deve lançar erro 401 quando usuário não tem tenants ativos', async () => {
        mockActiveTenants = [];

        await fakeUsersRepo.create({
            name: 'Sem Tenant',
            email: 'semtenant@test.com',
            password: SENHA_TESTE,
        });

        await expect(
            authenticateUserService.execute({
                email: 'semtenant@test.com',
                password: SENHA_TESTE,
            }),
        ).rejects.toMatchObject({
            message: 'Usuário não vinculado a nenhuma igreja ativa',
            statusCode: 401,
        });
    });

    /** Deve lançar AppError 401 quando o email fornecido não existe no repositório. */
    it('deve lançar erro para email inexistente', async () => {
        await fakeUsersRepo.create({
            name: 'Test',
            email: 'test@test.com',
            password: SENHA_TESTE,
        });

        await expect(
            authenticateUserService.execute({
                email: 'wrong@test.com',
                password: 'any',
            }),
        ).rejects.toMatchObject({
            message: 'Incorrect email/password combination',
            statusCode: 401,
        });
    });

    /**
     * Mitigação de enumeração por tempo: com e-mail inexistente o serviço ainda
     * executa uma comparação de hash descartável, para que a resposta não seja
     * visivelmente mais rápida que a de uma senha errada (que gasta o bcrypt).
     */
    it('deve comparar hash mesmo quando o email não existe (tempo constante)', async () => {
        const spy = vi.spyOn(fakeHashProvider, 'compareHash');

        await expect(
            authenticateUserService.execute({
                email: 'ninguem@test.com',
                password: 'any',
            }),
        ).rejects.toBeInstanceOf(AppError);

        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    /** Deve lançar AppError 401 quando a senha fornecida não corresponde ao hash armazenado. */
    it('deve lançar erro para senha incorreta', async () => {
        await fakeUsersRepo.create({
            name: 'Test',
            email: 'test@test.com',
            password: SENHA_TESTE,
        });

        await expect(
            authenticateUserService.execute({
                email: 'test@test.com',
                password: 'wrong',
            }),
        ).rejects.toMatchObject({
            message: 'Incorrect email/password combination',
            statusCode: 401,
        });
    });
});
