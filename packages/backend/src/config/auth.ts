/**
 * Configuração centralizada de autenticação JWT.
 *
 * Carrega segredos e tempos de expiração a partir de variáveis de ambiente,
 * fornecendo valores padrão seguros para desenvolvimento.
 * Em produção, exige que as variáveis de ambiente estejam definidas.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Obtém um segredo de variável de ambiente.
 * Em produção, lança erro se a variável não estiver definida.
 *
 * @param envVar - Nome da variável de ambiente
 * @param devFallback - Valor padrão para ambientes de desenvolvimento
 * @returns Valor do segredo
 * @throws Error se em produção e a variável não estiver definida
 */
function requireSecret(envVar: string, devFallback: string): string {
    const value = process.env[envVar];
    if (value) return value;

    if (isProduction) {
        throw new Error(`${envVar} é obrigatória em ambiente de produção.`);
    }

    return devFallback;
}

export const authConfig = {
    /** Configuração do access token (curta duração). */
    accessToken: {
        secret: requireSecret('APP_SECRET', 'default-dev-secret'),
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '1h',
    },
    /** Configuração do refresh token (longa duração). */
    refreshToken: {
        secret: requireSecret('APP_SECRET_REFRESH_TOKEN', 'default-dev-refresh-secret'),
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
        expiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30),
    },
};
