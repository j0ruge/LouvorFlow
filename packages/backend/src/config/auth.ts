/**
 * Configuração centralizada de autenticação JWT.
 *
 * Carrega segredos e tempos de expiração a partir de variáveis de ambiente,
 * fornecendo valores padrão seguros para desenvolvimento.
 * Em produção, exige que as variáveis de ambiente estejam definidas.
 */

import { randomBytes } from 'node:crypto';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Obtém um segredo a partir de variável de ambiente.
 *
 * Em produção, lança erro se a variável não estiver definida. Em desenvolvimento,
 * quando ausente, gera um segredo ALEATÓRIO e efêmero (por processo) em vez de um
 * valor fixo previsível — um fallback constante no código-fonte permitiria forjar
 * tokens em qualquer ambiente não-produtivo. Como o segredo gerado muda a cada
 * reinício, os tokens emitidos são invalidados ao reiniciar o servidor de dev.
 *
 * @param envVar - Nome da variável de ambiente.
 * @returns Valor do segredo (da env ou gerado aleatoriamente em dev).
 * @throws Error se em produção e a variável não estiver definida.
 */
function requireSecret(envVar: string): string {
    const value = process.env[envVar];
    if (value) return value;

    if (isProduction) {
        throw new Error(`${envVar} é obrigatória em ambiente de produção.`);
    }

    console.warn(
        `[Auth] ${envVar} não definida — gerando segredo aleatório efêmero para desenvolvimento. ` +
        'Os tokens serão invalidados a cada reinício. NÃO usar em produção.',
    );

    return randomBytes(32).toString('hex');
}

export const authConfig = {
    /** Configuração do access token (curta duração). */
    accessToken: {
        secret: requireSecret('APP_SECRET'),
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '1h',
    },
    /**
     * Configuração do refresh token (longa duração).
     * - expiresIn: string passada ao jwt.sign (ex: "30d"). Controla a expiração do JWT.
     * - expiresDays: número inteiro de dias usado por dateProvider.addDays para calcular expires_date no banco.
     * Ambos devem representar o mesmo período para evitar divergência entre expiração JWT e DB.
     */
    refreshToken: {
        secret: requireSecret('APP_SECRET_REFRESH_TOKEN'),
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
        expiresDays: (() => {
            const raw = process.env.REFRESH_TOKEN_EXPIRES_DAYS;
            if (!raw) return 30;
            const parsed = parseInt(raw, 10);
            return Number.isFinite(parsed) ? parsed : 30;
        })(),
    },
    /**
     * Configuração do selection token (curta duração, usado no fluxo de seleção de tenant).
     * Emitido quando o usuário multi-tenant faz login — expira em 5 minutos.
     */
    selectionToken: {
        secret: requireSecret('APP_SECRET_SELECTION_TOKEN'),
        expiresIn: process.env.SELECTION_TOKEN_EXPIRES_IN ?? '5m',
    },
};
