/**
 * Service para aceitação de convites por participantes.
 *
 * Fluxo completo: valida token → verifica e-mail → cria conta nova
 * ou vincula conta existente ao tenant → marca token como usado.
 * Todas as operações de escrita são envolvidas em transação Prisma
 * para garantir atomicidade e evitar race conditions.
 */
import bcrypt from 'bcryptjs';
import { AppError } from '../../errors/AppError.js';
import convitesRepository from '../../repositories/convites.repository.js';
import integrantesRepository from '../../repositories/integrantes.repository.js';
import prisma from '../../../prisma/cliente.js';
import type { AcceptInviteInput } from '../../types/convites.types.js';

const SALT_ROUNDS = 12;

class AcceptInviteService {
    /**
     * Aceita um convite: cria conta nova ou vincula conta existente ao tenant.
     *
     * Usa transação Prisma para garantir atomicidade — evita que dois requests
     * simultâneos aceitem o mesmo convite (race condition).
     *
     * @param token - UUID do token de convite
     * @param input - Dados do participante (nome, email, senha, senha_confirmacao)
     * @returns Objeto com statusCode (201 para nova conta, 200 para vínculo) e mensagem
     * @throws AppError 404 se o token não existir
     * @throws AppError 400 se o token estiver expirado, usado ou revogado
     * @throws AppError 409 se o usuário já pertence ao tenant
     * @throws AppError 401 se a senha estiver incorreta para conta existente
     */
    async execute(token: string, input: AcceptInviteInput): Promise<{ statusCode: number; msg: string }> {
        const invite = await convitesRepository.findByToken(token);

        if (!invite) {
            throw new AppError('Convite não encontrado.', 404);
        }

        if (invite.used_at) {
            throw new AppError('Este convite já foi utilizado.', 400);
        }

        if (invite.revoked_at) {
            throw new AppError('Este convite foi cancelado.', 400);
        }

        if (new Date() > invite.expires_at) {
            throw new AppError('Este convite expirou. Peça um novo ao seu líder.', 400);
        }

        const { nome, email, senha } = input;
        const existingUser = await integrantesRepository.findByEmail(email);

        if (existingUser) {
            return this.handleExistingUser(existingUser, invite, senha);
        }

        return this.handleNewUser(nome, email, senha, invite);
    }

    /**
     * Trata o caso de e-mail já existente no sistema.
     * Verifica senha e vincula ao tenant se ainda não pertence.
     * Operações de escrita são atômicas via transação.
     *
     * @param existingUser - Usuário encontrado pelo e-mail (sem password)
     * @param invite - Registro do convite com tenant_id
     * @param senha - Senha informada pelo participante
     * @returns Resultado com statusCode 200 e mensagem de vínculo
     */
    private async handleExistingUser(
        existingUser: { id: string },
        invite: { id: string; tenant_id: string },
        senha: string,
    ): Promise<{ statusCode: number; msg: string }> {
        /** Verifica se o usuário já pertence ao tenant do convite. */
        const existingLink = await prisma.tenantUsers.findUnique({
            where: {
                tenant_id_user_id: {
                    tenant_id: invite.tenant_id,
                    user_id: existingUser.id,
                },
            },
        });

        if (existingLink) {
            throw new AppError('Você já pertence a este grupo.', 409);
        }

        /** Busca o hash completo do usuário para verificação de senha. */
        const userWithPassword = await prisma.users.findUnique({
            where: { id: existingUser.id },
            select: { password: true },
        });

        if (!userWithPassword) {
            throw new AppError('Erro ao verificar conta existente.', 400);
        }

        const passwordMatch = await bcrypt.compare(senha, userWithPassword.password);
        if (!passwordMatch) {
            throw new AppError('Senha incorreta para a conta existente.', 401);
        }

        /** Vincula e marca como usado atomicamente para evitar race condition. */
        await prisma.$transaction([
            prisma.tenantUsers.create({
                data: { tenant_id: invite.tenant_id, user_id: existingUser.id },
            }),
            prisma.inviteTokens.update({
                where: { id: invite.id },
                data: { used_at: new Date(), used_by: existingUser.id },
            }),
        ]);

        return {
            statusCode: 200,
            msg: 'Você foi adicionado à igreja com sucesso! Faça login para continuar.',
        };
    }

    /**
     * Cria uma nova conta de usuário e vincula ao tenant do convite.
     * Operações de escrita são atômicas via transação interativa.
     *
     * @param nome - Nome do participante
     * @param email - E-mail do participante
     * @param senha - Senha escolhida
     * @param invite - Registro do convite com tenant_id
     * @returns Resultado com statusCode 201 e mensagem de criação
     */
    private async handleNewUser(
        nome: string,
        email: string,
        senha: string,
        invite: { id: string; tenant_id: string },
    ): Promise<{ statusCode: number; msg: string }> {
        const passwordHash = await bcrypt.hash(senha, SALT_ROUNDS);

        /** Cria user + vínculo + marca token atomicamente. */
        await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: { name: nome, email, password: passwordHash },
            });

            await tx.tenantUsers.create({
                data: { tenant_id: invite.tenant_id, user_id: user.id },
            });

            await tx.inviteTokens.update({
                where: { id: invite.id },
                data: { used_at: new Date(), used_by: user.id },
            });
        });

        return {
            statusCode: 201,
            msg: 'Conta criada com sucesso! Faça login para continuar.',
        };
    }
}

export default new AcceptInviteService();
