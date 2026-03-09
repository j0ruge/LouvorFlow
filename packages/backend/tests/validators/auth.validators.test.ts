/**
 * Testes unitários dos schemas de validação de autenticação e RBAC.
 *
 * Verifica que os schemas Zod aceitam dados válidos e rejeitam
 * identificadores inválidos (não-UUID) em campos de IDs.
 */

import { userAclBodySchema } from '../../src/validators/auth.validators.js';

describe('userAclBodySchema', () => {
    it('deve aceitar UUIDs válidos em roles e permissions', () => {
        const result = userAclBodySchema.safeParse({
            roles: [crypto.randomUUID()],
            permissions: [crypto.randomUUID()],
        });

        expect(result.success).toBe(true);
    });

    it('deve aceitar arrays vazios para roles e permissions (usuário sem ACL atribuído)', () => {
        const result = userAclBodySchema.safeParse({
            roles: [],
            permissions: [],
        });

        expect(result.success).toBe(true);
    });

    it('deve rejeitar strings não-UUID em roles para impedir referências inválidas no banco', () => {
        const result = userAclBodySchema.safeParse({
            roles: ['not-a-uuid', 'also-invalid'],
            permissions: [],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toBe('ID deve ser um UUID válido');
        }
    });

    it('deve rejeitar strings não-UUID em permissions para impedir referências inválidas no banco', () => {
        const result = userAclBodySchema.safeParse({
            roles: [],
            permissions: ['invalid-permission-id'],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toBe('ID deve ser um UUID válido');
        }
    });

    it('deve rejeitar quando roles não é um array', () => {
        const result = userAclBodySchema.safeParse({
            roles: 'not-an-array',
            permissions: [],
        });

        expect(result.success).toBe(false);
    });

    it('deve rejeitar quando permissions não é um array', () => {
        const result = userAclBodySchema.safeParse({
            roles: [],
            permissions: 'not-an-array',
        });

        expect(result.success).toBe(false);
    });
});
