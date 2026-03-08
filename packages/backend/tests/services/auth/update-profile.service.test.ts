/**
 * Testes unitarios do servico UpdateProfileService.
 *
 * Valida a atualizacao de perfil (nome, email e senha) de um usuario,
 * incluindo cenarios de email duplicado, senha antiga ausente ou incorreta,
 * e usuario inexistente.
 */

import fakeUsersRepository from '../../fakes/auth/fake-users.repository.js';
import { AppError } from '../../../src/errors/AppError.js';

vi.mock('../../../src/repositories/auth/users.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-users.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/hash.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-hash.provider.js');
    return { default: fake.default };
});

import service from '../../../src/services/auth/update-profile.service.js';

describe('UpdateProfileService', () => {
    /** Reinicia o repositorio fake antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeUsersRepository.reset();
    });

    /** Verifica que nome e email do usuario sao atualizados com sucesso. */
    it('deve atualizar nome e email', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'old-password',
        });

        const result = await service.execute({
            user_id: user.id,
            name: 'New Name',
            email: 'new@test.com',
        });

        expect(result).toHaveProperty('name', 'New Name');
        expect(result).toHaveProperty('email', 'new@test.com');
    });

    /** Verifica que um AppError e lancado ao tentar usar um email ja registrado por outro usuario. */
    it('deve lancar erro para email ja usado', async () => {
        const user1 = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'old-password',
        });

        await fakeUsersRepository.create({
            name: 'Maria Souza',
            email: 'maria@test.com',
            password: 'old-password',
        });

        await expect(
            service.execute({
                user_id: user1.id,
                name: 'Joao Silva',
                email: 'maria@test.com',
            }),
        ).rejects.toThrow('Email address already used');
    });

    /** Verifica que um AppError e lancado ao definir nova senha sem informar a senha antiga. */
    it('deve lancar erro ao mudar senha sem senha antiga', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'old-password',
        });

        await expect(
            service.execute({
                user_id: user.id,
                name: 'Joao Silva',
                email: 'joao@test.com',
                password: 'new-password',
                old_password: undefined,
            }),
        ).rejects.toThrow('Old password is required to set a new password');
    });

    /** Verifica que um AppError e lancado quando a senha antiga informada nao confere. */
    it('deve lancar erro para senha antiga incorreta', async () => {
        const user = await fakeUsersRepository.create({
            name: 'Joao Silva',
            email: 'joao@test.com',
            password: 'old-password',
        });

        await expect(
            service.execute({
                user_id: user.id,
                name: 'Joao Silva',
                email: 'joao@test.com',
                password: 'new-password',
                old_password: 'wrong-password',
            }),
        ).rejects.toThrow('Old password does not match');
    });

    /** Verifica que um AppError e lancado quando o usuario nao existe. */
    it('deve lancar erro para usuario inexistente', async () => {
        await expect(
            service.execute({
                user_id: 'bad-id',
                name: 'Any Name',
                email: 'any@test.com',
            }),
        ).rejects.toThrow('User not found');
    });
});
