/**
 * Serviço de autenticação de usuários com suporte a multi-tenant.
 *
 * Valida credenciais (email + senha), consulta os tenants ativos do usuário
 * e retorna o fluxo adequado:
 * - 0 tenants ativos: lança AppError 401.
 * - 1 tenant ativo: gera access token + refresh token com tenantId no payload.
 * - 2+ tenants ativos: retorna selection_token e lista de tenants para seleção.
 */

import { AppError } from '../../errors/AppError.js';
import usersRepository from '../../repositories/auth/users.repository.js';
import hashProvider from '../../providers/hash.provider.js';
import tokenProvider from '../../providers/token.provider.js';
import refreshTokensRepository from '../../repositories/auth/refresh-tokens.repository.js';
import dateProvider from '../../providers/date.provider.js';
import { authConfig } from '../../config/auth.js';
import { flattenUserRelations } from '../../types/auth.types.js';
import type { ILoginDTO, IResponseDTO, ITenantSelectionDTO } from '../../types/auth.types.js';
import prisma, { SYSTEM_TENANT_ID } from '../../../prisma/cliente.js';

/** Usuário com roles e permissões carregadas via Prisma include (com campo password). */
interface IUserWithRelations {
    id: string;
    email: string;
    password: string;
    avatar: string | null;
    name: string;
    roles: Array<{
        role: {
            id: string;
            name: string;
            description: string;
            created_at: Date;
            updated_at: Date;
            permissions: Array<{
                permission: {
                    id: string;
                    name: string;
                    description: string;
                    created_at: Date;
                    updated_at: Date;
                };
            }>;
        };
    }>;
    permissions: Array<{
        permission: {
            id: string;
            name: string;
            description: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    created_at: Date;
    updated_at: Date;
}

class AuthenticateUserService {
    /**
     * Autentica um usuário com email e senha aplicando lógica multi-tenant.
     *
     * Após validar as credenciais, consulta os tenants ativos vinculados ao usuário.
     * Se houver apenas um tenant ativo, emite tokens com tenantId no payload.
     * Se houver múltiplos tenants ativos, emite um selection_token de curta duração
     * para que o frontend exiba a tela de seleção de tenant.
     *
     * @param dto - Objeto contendo email e senha do usuário.
     * @returns Objeto com sessão completa (único tenant) ou dados de seleção (múltiplos tenants).
     * @throws AppError 401 se o email não existir, a senha não corresponder, ou o usuário não tiver tenants ativos.
     */
    async execute({ email, password }: ILoginDTO): Promise<IResponseDTO | ITenantSelectionDTO> {
        const user = await usersRepository.findByEmail(email);

        if (!user) {
            throw new AppError('Incorrect email/password combination', 401);
        }

        const passwordMatched = await hashProvider.compareHash(
            password,
            user.password,
        );

        if (!passwordMatched) {
            throw new AppError('Incorrect email/password combination', 401);
        }

        // Consulta os tenants ativos vinculados ao usuário (exclui tenants do sistema)
        const tenantLinks = await prisma.tenantUsers.findMany({
            where: {
                user_id: user.id,
                tenant: {
                    status: 'active',
                },
            },
            select: {
                tenant: {
                    select: { id: true, name: true, status: true },
                },
            },
        });

        const activeTenants = tenantLinks.map((link) => link.tenant);

        if (activeTenants.length === 0) {
            throw new AppError('Usuário não vinculado a nenhuma igreja ativa', 401);
        }

        // Fluxo de múltiplos tenants: emite selection_token para seleção no frontend
        if (activeTenants.length > 1) {
            const selection_token = tokenProvider.sign(
                { purpose: 'tenant_selection' },
                authConfig.selectionToken.secret,
                {
                    subject: user.id,
                    expiresIn: authConfig.selectionToken.expiresIn,
                },
            );

            return {
                requires_tenant_selection: true,
                tenants: activeTenants.map((t) => ({ id: t.id, name: t.name })),
                selection_token,
            };
        }

        // Fluxo de tenant único: emite tokens com tenantId no payload
        const tenant = activeTenants[0];

        // Recarrega o usuário com roles e permissões filtradas pelo tenant selecionado
        const userWithTenantRoles = await prisma.users.findUnique({
            where: { id: user.id },
            include: {
                roles: {
                    where: { tenant_id: { in: [tenant.id, SYSTEM_TENANT_ID] } },
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                created_at: true,
                                updated_at: true,
                                permissions: {
                                    select: {
                                        permission: {
                                            select: {
                                                id: true,
                                                name: true,
                                                description: true,
                                                created_at: true,
                                                updated_at: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                permissions: {
                    where: { tenant_id: { in: [tenant.id, SYSTEM_TENANT_ID] } },
                    select: {
                        permission: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                created_at: true,
                                updated_at: true,
                            },
                        },
                    },
                },
            },
        });

        return this._generateSession(userWithTenantRoles!, tenant);
    }

    /**
     * Gera os tokens de sessão e formata a resposta de login para um tenant específico.
     *
     * Cria o access token e o refresh token com o tenantId embutido no payload JWT,
     * persiste o refresh token no banco e retorna a resposta de sessão completa.
     *
     * @param user - Usuário autenticado com roles e permissões carregadas (com campo password).
     * @param tenant - Tenant selecionado com id e name.
     * @returns Resposta de sessão com usuário sanitizado, tokens e dados do tenant.
     */
    async _generateSession(
        user: IUserWithRelations,
        tenant: { id: string; name: string },
    ): Promise<IResponseDTO> {
        const token = tokenProvider.sign(
            { tenantId: tenant.id },
            authConfig.accessToken.secret,
            {
                subject: user.id,
                expiresIn: authConfig.accessToken.expiresIn,
            },
        );

        const refresh_token = tokenProvider.sign(
            { email: user.email, tenantId: tenant.id },
            authConfig.refreshToken.secret,
            {
                subject: user.id,
                expiresIn: authConfig.refreshToken.expiresIn,
            },
        );

        const expires_date = dateProvider.addDays(
            authConfig.refreshToken.expiresDays,
        );

        /**
         * Invalida TODOS os refresh tokens do usuário (todos os dispositivos/sessões).
         * Comportamento intencional: ao logar, selecionar tenant ou trocar tenant,
         * todas as sessões anteriores são encerradas por segurança.
         */
        await refreshTokensRepository.deleteAllByUserId(user.id);

        await refreshTokensRepository.create({
            user_id: user.id,
            refresh_token,
            expires_date,
        });

        const { password: _password, ...userWithoutPassword } = user;
        const appApiUrl = process.env.APP_API_URL ?? 'http://localhost:3000';
        const flattened = flattenUserRelations(userWithoutPassword);
        const sanitizedUser = {
            ...flattened,
            avatar_url: userWithoutPassword.avatar
                ? `${appApiUrl}/files/${userWithoutPassword.avatar}`
                : null,
            tenant: { id: tenant.id, name: tenant.name },
        };

        return {
            user: sanitizedUser,
            token,
            refresh_token,
        };
    }
}

export default new AuthenticateUserService();
