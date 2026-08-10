/**
 * Testes de segurança contra escalação de privilégios no serviço de ACL.
 *
 * Valida que:
 * - Admins regulares NÃO podem atribuir roles protegidas (super-admin)
 * - Admins regulares NÃO podem atribuir permissions protegidas (super_admin_access)
 * - Admins regulares NÃO podem editar suas próprias permissões (anti-self-elevation)
 * - Super-admins PODEM atribuir qualquer role/permission
 * - Super-admins PODEM editar próprias permissões
 */

import { AppError } from '../../../src/errors/AppError.js';

/** Mock de roles do sistema. */
const MOCK_ADMIN_ROLE = { id: 'role-admin-id', name: 'admin', description: 'Tenant administrator' };
const MOCK_SUPER_ADMIN_ROLE = { id: 'role-superadmin-id', name: 'super-admin', description: 'Platform super administrator' };
const MOCK_DOMAIN_PERM = { id: 'perm-config-id', name: 'configuracoes.write', description: 'Config write' };
const MOCK_PROTECTED_PERM = { id: 'perm-superadmin-id', name: 'super_admin_access', description: 'Platform super admin access' };

const MOCK_USER = { id: 'user-target-id', name: 'Jorge', email: 'jorge@test.com', avatar: null, created_at: new Date(), updated_at: new Date() };
const CALLER_ID = 'user-caller-id';

/** Mock do repositório de usuários. */
vi.mock('../../../src/repositories/auth/users.repository.js', () => ({
    default: {
        findById: vi.fn().mockImplementation((id: string) =>
            id === MOCK_USER.id ? Promise.resolve(MOCK_USER) : Promise.resolve(null),
        ),
        save: vi.fn().mockImplementation((_id: string, _data: any) =>
            Promise.resolve({ ...MOCK_USER, roles: [], permissions: [] }),
        ),
    },
}));

/** Mock do repositório de roles. */
vi.mock('../../../src/repositories/auth/roles.repository.js', () => ({
    default: {
        findByIds: vi.fn().mockImplementation((ids: string[]) => {
            const allRoles = [MOCK_ADMIN_ROLE, MOCK_SUPER_ADMIN_ROLE];
            return Promise.resolve(allRoles.filter((r) => ids.includes(r.id)));
        }),
    },
}));

/** Mock do repositório de permissões. */
vi.mock('../../../src/repositories/auth/permissions.repository.js', () => ({
    default: {
        findByIds: vi.fn().mockImplementation((ids: string[]) => {
            const allPerms = [MOCK_DOMAIN_PERM, MOCK_PROTECTED_PERM];
            return Promise.resolve(allPerms.filter((p) => ids.includes(p.id)));
        }),
    },
}));

/**
 * Mock do Prisma: o usuário-alvo sempre pertence ao tenant nestes testes, para que
 * a verificação de isolamento de tenant passe e o fluxo alcance as regras de
 * escalação de privilégios sob teste.
 */
vi.mock('../../../prisma/cliente.js', () => ({
    default: {
        tenantUsers: {
            findFirst: vi.fn().mockResolvedValue({ id: 'link-id' }),
        },
    },
}));

const { default: createUserAclService } = await import(
    '../../../src/services/auth/create-user-acl.service.js'
);

/** @group Segurança — Escalação de Privilégios */
describe('CreateUserAclService — Segurança', () => {
    /** Admin regular NÃO pode atribuir role super-admin a outro usuário. */
    it('deve rejeitar atribuição de role super-admin por admin regular', async () => {
        await expect(
            createUserAclService.execute({
                userId: MOCK_USER.id,
                roles: [MOCK_SUPER_ADMIN_ROLE.id],
                permissions: [],
                tenantId: 'tenant-test-id',
                callerId: CALLER_ID,
                callerIsSuperAdmin: false,
            }),
        ).rejects.toMatchObject({
            message: expect.stringContaining('super-admin'),
            statusCode: 403,
        });
    });

    /** Admin regular NÃO pode atribuir permission super_admin_access. */
    it('deve rejeitar atribuição de permission protegida por admin regular', async () => {
        await expect(
            createUserAclService.execute({
                userId: MOCK_USER.id,
                roles: [],
                permissions: [MOCK_PROTECTED_PERM.id],
                tenantId: 'tenant-test-id',
                callerId: CALLER_ID,
                callerIsSuperAdmin: false,
            }),
        ).rejects.toMatchObject({
            message: expect.stringContaining('super_admin_access'),
            statusCode: 403,
        });
    });

    /** Admin regular NÃO pode editar suas próprias permissões (anti-self-elevation). */
    it('deve rejeitar auto-edição de permissões por admin regular', async () => {
        await expect(
            createUserAclService.execute({
                userId: MOCK_USER.id,
                roles: [MOCK_ADMIN_ROLE.id],
                permissions: [],
                callerId: MOCK_USER.id,
                callerIsSuperAdmin: false,
            }),
        ).rejects.toMatchObject({
            message: expect.stringContaining('próprias permissões'),
            statusCode: 403,
        });
    });

    /** Super-admin PODE atribuir role super-admin a outro usuário. */
    it('deve permitir atribuição de role super-admin por super-admin', async () => {
        const result = await createUserAclService.execute({
            userId: MOCK_USER.id,
            roles: [MOCK_SUPER_ADMIN_ROLE.id],
            permissions: [],
            tenantId: 'tenant-test-id',
            callerId: CALLER_ID,
            callerIsSuperAdmin: true,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(MOCK_USER.id);
    });

    /** Super-admin PODE atribuir permission super_admin_access. */
    it('deve permitir atribuição de permission protegida por super-admin', async () => {
        const result = await createUserAclService.execute({
            userId: MOCK_USER.id,
            roles: [],
            permissions: [MOCK_PROTECTED_PERM.id],
            tenantId: 'tenant-test-id',
            callerId: CALLER_ID,
            callerIsSuperAdmin: true,
        });

        expect(result).toBeDefined();
    });

    /** Super-admin PODE editar suas próprias permissões. */
    it('deve permitir auto-edição de permissões por super-admin', async () => {
        const result = await createUserAclService.execute({
            userId: MOCK_USER.id,
            roles: [MOCK_ADMIN_ROLE.id],
            permissions: [],
            tenantId: 'tenant-test-id',
            callerId: MOCK_USER.id,
            callerIsSuperAdmin: true,
        });

        expect(result).toBeDefined();
    });

    /** Admin regular PODE atribuir roles não-protegidas normalmente. */
    it('deve permitir atribuição de role admin por admin regular', async () => {
        const result = await createUserAclService.execute({
            userId: MOCK_USER.id,
            roles: [MOCK_ADMIN_ROLE.id],
            permissions: [],
            callerId: CALLER_ID,
            callerIsSuperAdmin: false,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(MOCK_USER.id);
    });
});
