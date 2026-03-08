import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

import type { ITokenProvider, ITokenSignOptions } from '../types/auth.types.js';

/**
 * Provedor de tokens JWT usando `jsonwebtoken`.
 *
 * Abstrai a assinatura e verificação de JSON Web Tokens,
 * permitindo troca da biblioteca subjacente sem impacto nas camadas superiores.
 */
class TokenProvider implements ITokenProvider {
  /**
   * Assina um payload e retorna o token JWT como string.
   *
   * @param payload - Dados a serem incluídos no token.
   * @param secret - Chave secreta para assinatura.
   * @param options - Opções de assinatura (subject e expiresIn).
   * @returns Token JWT assinado.
   */
  sign(
    payload: Record<string, unknown>,
    secret: string,
    options: ITokenSignOptions,
  ): string {
    return jwt.sign(payload, secret, {
      subject: options.subject,
      expiresIn: options.expiresIn as StringValue,
    });
  }

  /**
   * Verifica e decodifica um token JWT.
   *
   * @param token - Token JWT a ser verificado.
   * @param secret - Chave secreta usada na assinatura original.
   * @returns Payload decodificado do token.
   * @throws Erro se o token for inválido ou expirado.
   */
  verify(token: string, secret: string): Record<string, unknown> {
    return jwt.verify(token, secret) as Record<string, unknown>;
  }
}

export default new TokenProvider();
