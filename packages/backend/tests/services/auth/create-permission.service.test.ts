/**
 * Testes unitários do serviço de criação de permissões.
 *
 * Valida a criação bem-sucedida de uma permissão e a rejeição
 * de nomes duplicados.
 */

import { AppError } from '../../../src/errors/AppError.js';

import fakePermissionsRepo from '../../fakes/auth/fake-permissions.repository.js';

/**
 * Substitui o repositório real de permissões pelo fake para isolamento de testes.
 * @returns Módulo com o export default apontando para o repositório fake.
 */
vi.mock('../../../src/repositories/auth/permissions.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-permissions.repository.js');
    return { default: fake.default };
});

const { default: createPermissionService } = await import(
    '../../../src/services/auth/create-permission.service.js'
);

/**
 * Suite de testes do serviço CreatePermissionService.
 * Cobre cenários de criação bem-sucedida e rejeição de nomes duplicados.
 */
describe('CreatePermissionService', () => {
    /** Reinicia o repositório fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakePermissionsRepo.reset();
    });

    /** Deve criar uma permissão com nome e descrição válidos. */
    it('deve criar uma permissão', async () => {
        const result = await createPermissionService.execute({
            name: 'create_user',
            description: 'Permite criar usuários',
        });

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name', 'create_user');
        expect(result).toHaveProperty('description', 'Permite criar usuários');
    });

    /** Deve lançar AppError 400 quando já existe uma permissão com o mesmo nome. */
    it('deve lançar erro para nome duplicado', async () => {
        await createPermissionService.execute({
            name: 'create_user',
            description: 'Permite criar usuários',
        });

        await expect(
            createPermissionService.execute({
                name: 'create_user',
                description: 'Outra descrição',
            }),
        ).rejects.toMatchObject({
            message: 'Permission already exists',
            statusCode: 400,
        });
    });
});
