/**
 * Tipos e DTOs do módulo de autenticação, sessão e RBAC.
 *
 * Define contratos de entrada/saída entre controllers e services,
 * mantendo as camadas desacopladas conforme AR-026/AR-027.
 */

/** Dados de entrada para criação de usuário. */
export interface ICreateUserDTO {
    name: string;
    email: string;
    password: string;
}

/** Dados de entrada para criação de role. */
export interface ICreateRoleDTO {
    name: string;
    description: string;
}

/** Dados de entrada para criação de permissão. */
export interface ICreatePermissionDTO {
    name: string;
    description: string;
}

/** Dados de entrada para atribuição de permissões a uma role. */
export interface ICreateRolePermissionsDTO {
    roleId: string;
    permissions: string[];
}

/** Dados de entrada para atribuição de ACL (roles + permissões diretas) a um usuário. */
export interface ICreateUserAccessControlListDTO {
    userId: string;
    roles: string[];
    permissions: string[];
}

/** Dados de entrada para criação de refresh token no banco. */
export interface ICreateUserRefreshTokenDTO {
    user_id: string;
    expires_date: Date;
    refresh_token: string;
}

/** Dados de entrada para login (email + senha). */
export interface ILoginDTO {
    email: string;
    password: string;
}

/** Permissão achatada retornada ao frontend. */
export interface IFlatPermission {
    id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

/** Role achatada com permissões retornada ao frontend. */
export interface IFlatRole {
    id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
    permissions: IFlatPermission[];
}

/** Usuário sanitizado sem campo de senha. */
export interface SanitizedUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    avatar_url: string | null;
    roles: IFlatRole[];
    permissions: IFlatPermission[];
    created_at: Date;
    updated_at: Date;
}

/** Dados de resposta do login (usuário + tokens). */
export interface IResponseDTO {
    user: SanitizedUser;
    token: string;
    refresh_token: string;
}

/** Dados de entrada para logout. */
export interface ILogoutDTO {
    user_id: string;
}

/** Dados de entrada para visualização de perfil. */
export interface IShowProfileDTO {
    user_id: string;
}

/** Dados de entrada para atualização de perfil. */
export interface IUpdateProfileDTO {
    user_id: string;
    name?: string;
    email?: string;
    old_password?: string;
    password?: string;
}

/** Dados de retorno da ACL completa de um usuário. */
export interface IUserACLsDTO {
    userId: string;
    name: string;
    roles: Array<{ id: string; name: string; description: string }>;
    permissions: Array<{ id: string; name: string; description: string }>;
}

/**
 * Interface do provedor de hashing de senhas.
 * Abstrai o algoritmo de hash para permitir troca (bcrypt, argon2, etc.).
 */
export interface IHashProvider {
    /** Gera um hash a partir do payload em texto plano. */
    generateHash(payload: string): Promise<string>;
    /** Compara um payload em texto plano com um hash existente. */
    compareHash(payload: string, hashed: string): Promise<boolean>;
}

/**
 * Opções para assinatura de token.
 */
export interface ITokenSignOptions {
    subject: string;
    expiresIn: string;
}

/**
 * Interface do provedor de tokens JWT.
 * Abstrai a biblioteca de JWT para permitir troca.
 */
export interface ITokenProvider {
    /** Assina um payload e retorna o token como string. */
    sign(payload: Record<string, unknown>, secret: string, options: ITokenSignOptions): string;
    /** Verifica e decodifica um token, retornando o payload. Lança erro se inválido. */
    verify(token: string, secret: string): Record<string, unknown>;
}

/**
 * Interface do provedor de operações com datas.
 * Abstrai a biblioteca de datas para permitir troca (dayjs, date-fns, etc.).
 */
export interface IDateProvider {
    /** Compara duas datas retornando a diferença em horas (positivo se end > start). */
    compareInHours(start: Date, end: Date): number;
    /** Converte uma data para string ISO-8601 em UTC. */
    convertToUTC(date: Date): string;
    /** Retorna a data/hora atual em UTC. */
    dateNow(): Date;
    /** Compara duas datas retornando a diferença em dias (positivo se end > start). */
    compareInDays(start: Date, end: Date): number;
    /** Adiciona N dias à data atual e retorna a nova data. */
    addDays(days: number): Date;
}

/**
 * Dados do template para envio de email.
 */
export interface IMailTemplateData {
    variables: Record<string, string>;
    template: string;
}

/**
 * Interface do provedor de envio de emails.
 * Abstrai o serviço de email para permitir troca (nodemailer, SES, SendGrid, etc.).
 */
export interface IMailProvider {
    /** Envia um email com o destinatário, assunto e dados de template fornecidos. */
    sendMail(params: { to: string; subject: string; templateData: IMailTemplateData }): Promise<void>;
}

/**
 * Payload decodificado de um access token JWT.
 */
export interface ITokenPayload {
    sub: string;
    iat: number;
    exp: number;
}

/** Representação de uma permissão retornada pelo repositório. */
export interface IPermissionRef {
    id: string;
    name: string;
    description: string;
}

/** Representação de uma role com permissões retornada pelo repositório. */
export interface IRoleRef {
    id: string;
    name: string;
    description: string;
    permissions: IPermissionRef[];
}

/**
 * Extensão do Request do Express para incluir dados do usuário autenticado.
 * Os campos `roles` e `permissions` são preenchidos sob demanda pelos
 * middlewares `is()` e `can()` e ficam cacheados no request.
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                roles?: IRoleRef[];
                permissions?: IPermissionRef[];
            };
        }
    }
}

/**
 * Seleção pública de campos do usuário (exclui senha).
 * Utilizado em queries Prisma para nunca retornar o hash da senha.
 */
export const USER_PUBLIC_SELECT = {
    id: true,
    name: true,
    email: true,
    avatar: true,
    created_at: true,
    updated_at: true,
    roles: {
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
                                select: { id: true, name: true, description: true, created_at: true, updated_at: true }
                            }
                        }
                    }
                }
            }
        }
    },
    permissions: {
        select: {
            permission: {
                select: { id: true, name: true, description: true, created_at: true, updated_at: true }
            }
        }
    }
} as const;

/**
 * Achata as relações de junction table do Prisma para o formato
 * plano esperado pelo frontend (roles e permissions como arrays diretos).
 *
 * @param user - Usuário com relações em formato junction table do Prisma.
 * @returns Usuário com roles e permissions achatados.
 */
export function flattenUserRelations<T extends { roles: { role: any }[]; permissions: { permission: any }[] }>(
    user: T,
) {
    return {
        ...user,
        roles: user.roles.map((ur: { role: any }) => ({
            ...ur.role,
            permissions: ur.role.permissions?.map((rp: { permission: any }) => rp.permission) ?? [],
        })),
        permissions: user.permissions.map((up: { permission: any }) => up.permission),
    };
}

/**
 * Achata as permissões de junction table do Prisma para formato plano
 * esperado pelo frontend (permissions como array direto de objetos).
 *
 * @param role - Role com permissões em formato junction table do Prisma.
 * @returns Role com permissions achatadas.
 */
export function flattenRolePermissions<T extends { permissions: { permission: any }[] }>(
    role: T,
) {
    return {
        ...role,
        permissions: role.permissions.map((rp: { permission: any }) => rp.permission),
    };
}
