/**
 * Testes unitários do serviço de criação de roles.
 *
 * Valida a criação bem-sucedida de uma role e a rejeição
 * de nomes duplicados.
 */

import { AppError } from '../../../src/errors/AppError.js';

import fakeRolesRepo from '../../fakes/auth/fake-roles.repository.js';

vi.mock('../../../src/repositories/auth/roles.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-roles.repository.js');
    return { default: fake.default };
});

const { default: createRoleService } = await import(
    '../../../src/services/auth/create-role.service.js'
);

/** @group CreateRoleService */
describe('CreateRoleService', () => {
    /** Reinicia o repositório fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeRolesRepo.reset();
    });

    /** Deve criar uma role com nome e descrição válidos. */
    it('deve criar uma role', async () => {
        const result = await createRoleService.execute({
            name: 'admin',
            description: 'Administrador do sistema',
        });

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name', 'admin');
        expect(result).toHaveProperty('description', 'Administrador do sistema');
    });

    /** Deve lançar AppError 400 quando já existe uma role com o mesmo nome. */
    it('deve lançar erro para nome duplicado', async () => {
        await createRoleService.execute({
            name: 'admin',
            description: 'Administrador do sistema',
        });

        await expect(
            createRoleService.execute({
                name: 'admin',
                description: 'Outra descrição',
            }),
        ).rejects.toMatchObject({
            message: 'Role already exists',
            statusCode: 400,
        });
    });
});
