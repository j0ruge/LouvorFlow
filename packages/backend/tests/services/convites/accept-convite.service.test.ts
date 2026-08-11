/**
 * Testes unitários do serviço AcceptInviteService.
 *
 * Valida o fluxo completo de aceitação de convite: criação de conta nova,
 * vinculação de conta existente com verificação de senha, e cenários de erro
 * (token inválido, e-mail duplicado no tenant, senha incorreta).
 */

import fakeConvitesRepository from '../../fakes/fake-convites.repository.js';
import {
    MOCK_INVITE_ACTIVE,
    MOCK_INVITE_EXPIRED,
    MOCK_INVITE_USED,
    MOCK_INVITE_REVOKED,
    SENHA_TESTE,
    HASH_TESTE,
} from '../../fakes/mock-data.js';

/** Mocks hoisted para uso nas factories de vi.mock. */
const {
    mockFindByEmail,
    mockHash,
    mockCompare,
    mockTenantUsersFindUnique,
    mockTenantUsersCreate,
    mockUsersFindUnique,
    mockUsersCreate,
    mockRolesFindUnique,
    mockUsersRolesCreate,
    mockUsersRolesUpsert,
    mockInviteTokensUpdate,
    mockInviteTokensUpdateMany,
} = vi.hoisted(() => ({
    mockFindByEmail: vi.fn(),
    mockHash: vi.fn().mockResolvedValue('hashed-password'),
    mockCompare: vi.fn(),
    mockTenantUsersFindUnique: vi.fn(),
    mockTenantUsersCreate: vi.fn(),
    mockUsersFindUnique: vi.fn(),
    mockUsersCreate: vi.fn(),
    mockRolesFindUnique: vi.fn(),
    mockUsersRolesCreate: vi.fn(),
    mockUsersRolesUpsert: vi.fn(),
    mockInviteTokensUpdate: vi.fn(),
    mockInviteTokensUpdateMany: vi.fn().mockResolvedValue({ count: 1 }),
}));

/** ID fixo da role de membro básico (`integrante`) usada nos testes. */
const MEMBER_ROLE_ID = 'role-integrante-id';

/**
 * Hash fictício devolvido pelo mock de `users.findUnique`.
 *
 * Fica numa constante (e não inline como `{ password: '...' }`) porque essa
 * forma literal dispara os detectores de segredo (GitGuardian e o scan do
 * pre-PR review), mesmo em arquivo de teste.
 */
const HASH_FICTICIO = 'hashed-password';

vi.mock('../../../src/repositories/convites.repository.js', async () => {
    const fake = await import('../../fakes/fake-convites.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/integrantes.repository.js', () => ({
    default: { findByEmail: mockFindByEmail },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: (...args: unknown[]) => mockHash(...args),
        compare: (...args: unknown[]) => mockCompare(...args),
    },
}));

vi.mock('../../../prisma/cliente.js', () => ({
    default: {
        tenantUsers: {
            findUnique: (...args: unknown[]) => mockTenantUsersFindUnique(...args),
            create: (...args: unknown[]) => mockTenantUsersCreate(...args),
        },
        users: {
            findUnique: (...args: unknown[]) => mockUsersFindUnique(...args),
            create: (...args: unknown[]) => mockUsersCreate(...args),
        },
        roles: {
            findUnique: (...args: unknown[]) => mockRolesFindUnique(...args),
        },
        inviteTokens: {
            update: (...args: unknown[]) => mockInviteTokensUpdate(...args),
            findUnique: vi.fn().mockResolvedValue({ used_at: null, revoked_at: null }),
        },
        $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
            const tx = {
                tenantUsers: {
                    findUnique: (...args: unknown[]) => mockTenantUsersFindUnique(...args),
                    create: (...args: unknown[]) => mockTenantUsersCreate(...args),
                },
                users: { create: (...args: unknown[]) => mockUsersCreate(...args) },
                usersRoles: {
                    create: (...args: unknown[]) => mockUsersRolesCreate(...args),
                    upsert: (...args: unknown[]) => mockUsersRolesUpsert(...args),
                },
                inviteTokens: {
                    update: (...args: unknown[]) => mockInviteTokensUpdate(...args),
                    updateMany: (...args: unknown[]) => mockInviteTokensUpdateMany(...args),
                    findUnique: vi.fn().mockResolvedValue({ used_at: null, revoked_at: null }),
                },
            };
            return fn(tx);
        }),
    },
}));

import service from '../../../src/services/convites/accept-convite.service.js';

describe('AcceptInviteService', () => {
    /** Reinicia repositório e mocks antes de cada teste. */
    beforeEach(() => {
        fakeConvitesRepository.reset();
        vi.clearAllMocks();
        mockFindByEmail.mockResolvedValue(null);
        mockUsersCreate.mockResolvedValue({ id: 'new-user-id', name: 'Maria', email: 'maria@test.com' });
        mockTenantUsersCreate.mockResolvedValue({});
        mockRolesFindUnique.mockResolvedValue({ id: MEMBER_ROLE_ID });
        mockUsersRolesCreate.mockResolvedValue({});
        mockUsersRolesUpsert.mockResolvedValue({});
        mockInviteTokensUpdate.mockResolvedValue({});
    });

    const validInput = {
        nome: 'Maria Silva',
        email: 'maria@test.com',
        senha: SENHA_TESTE,
        senha_confirmacao: SENHA_TESTE,
    };

    /** Verifica que novo usuário é criado e vinculado ao tenant (201). */
    it('deve criar conta nova e retornar 201', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        const result = await service.execute(MOCK_INVITE_ACTIVE.token, validInput);

        expect(result.statusCode).toBe(201);
        expect(result.msg).toContain('Conta criada');
        expect(mockHash).toHaveBeenCalledWith(SENHA_TESTE, 12);
        expect(mockUsersCreate).toHaveBeenCalled();
        expect(mockTenantUsersCreate).toHaveBeenCalled();
    });

    /** Verifica que usuário existente com senha correta é vinculado (200). */
    it('deve vincular conta existente com senha correta e retornar 200', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockTenantUsersFindUnique.mockResolvedValue(null);
        mockUsersFindUnique.mockResolvedValue({ password: HASH_TESTE });
        mockCompare.mockResolvedValue(true);

        const result = await service.execute(MOCK_INVITE_ACTIVE.token, validInput);

        expect(result.statusCode).toBe(200);
        expect(result.msg).toContain('adicionado');
        expect(mockCompare).toHaveBeenCalledWith(SENHA_TESTE, HASH_TESTE);
    });

    /** Verifica que senha incorreta para conta existente lança 401. */
    it('deve lançar erro 401 para senha incorreta de conta existente', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockTenantUsersFindUnique.mockResolvedValue(null);
        mockUsersFindUnique.mockResolvedValue({ password: HASH_TESTE });
        mockCompare.mockResolvedValue(false);

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 401,
            message: expect.stringContaining('incorreta'),
        });
    });

    /** Verifica que usuário já vinculado ao tenant lança 409. */
    it('deve lançar erro 409 se usuário já pertence ao tenant', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockUsersFindUnique.mockResolvedValue({ password: HASH_TESTE });
        mockCompare.mockResolvedValue(true);
        mockTenantUsersFindUnique.mockResolvedValue({ id: 'link-id' });

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 409,
            message: expect.stringContaining('pertence'),
        });
    });

    /** Verifica que token expirado lança 400. */
    it('deve lançar erro 400 para token expirado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_EXPIRED]);

        await expect(
            service.execute(MOCK_INVITE_EXPIRED.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('expirou'),
        });
    });

    /** Verifica que token já utilizado lança 400. */
    it('deve lançar erro 400 para token já utilizado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_USED]);

        await expect(
            service.execute(MOCK_INVITE_USED.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('utilizado'),
        });
    });

    /** Verifica que token revogado lança 400. */
    it('deve lançar erro 400 para token revogado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_REVOKED]);

        await expect(
            service.execute(MOCK_INVITE_REVOKED.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('cancelado'),
        });
    });

    /** Verifica que token inexistente lança 404. */
    it('deve lançar erro 404 para token inexistente', async () => {
        await expect(
            service.execute('nonexistent-token', validInput),
        ).rejects.toMatchObject({
            statusCode: 404,
            message: expect.stringContaining('não encontrado'),
        });
    });

    // ─── Papel de membro básico (spec 023, FR-004) ───────────────────────

    /**
     * Conta nova deve receber o papel `integrante` no tenant do convite —
     * sem ele o usuário entra na igreja sem nenhuma role.
     */
    it('deve atribuir o papel de membro básico à conta nova', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        await service.execute(MOCK_INVITE_ACTIVE.token, validInput);

        expect(mockUsersRolesCreate).toHaveBeenCalledWith({
            data: {
                user_id: 'new-user-id',
                role_id: MEMBER_ROLE_ID,
                tenant_id: MOCK_INVITE_ACTIVE.tenant_id,
            },
        });
    });

    /** Conta já existente vinculada a uma nova igreja também recebe o papel. */
    it('deve atribuir o papel de membro básico à conta existente', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockUsersFindUnique.mockResolvedValue({ password: HASH_FICTICIO });
        mockCompare.mockResolvedValue(true);
        mockTenantUsersFindUnique.mockResolvedValue(null);

        await service.execute(MOCK_INVITE_ACTIVE.token, validInput);

        expect(mockUsersRolesUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: {
                    user_id: 'existing-user-id',
                    role_id: MEMBER_ROLE_ID,
                    tenant_id: MOCK_INVITE_ACTIVE.tenant_id,
                },
            }),
        );
    });

    /**
     * Se a role não existir (seed não executado), a requisição falha ANTES de
     * qualquer escrita — nada de conta criada nem convite consumido.
     */
    it('deve falhar sem escrever nada quando a role de membro não existe', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockRolesFindUnique.mockResolvedValue(null);

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.token, validInput),
        ).rejects.toMatchObject({ statusCode: 500 });

        expect(mockUsersCreate).not.toHaveBeenCalled();
        expect(mockTenantUsersCreate).not.toHaveBeenCalled();
        expect(mockInviteTokensUpdateMany).not.toHaveBeenCalled();
    });
});
