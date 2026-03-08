import type { ITokenProvider, ITokenSignOptions } from '../../../src/types/auth.types.js';

/**
 * Provedor fake de tokens JWT para uso em testes unitários.
 *
 * Gera tokens no formato `"fake-token-{subject}"` e os decodifica
 * extraindo o subject da string, sem nenhuma criptografia real.
 */
class FakeTokenProvider implements ITokenProvider {
  /**
   * Gera um token fake no formato `"fake-token-{subject}"`.
   *
   * @param payload - Payload do token (ignorado no fake).
   * @param secret - Chave secreta (ignorada no fake).
   * @param options - Opções de assinatura contendo o subject.
   * @returns Token fake com o subject embutido.
   */
  sign(
    payload: Record<string, unknown>,
    secret: string,
    options: ITokenSignOptions,
  ): string {
    return `fake-token-${options.subject}`;
  }

  /**
   * Verifica e decodifica um token fake.
   *
   * Extrai o subject do formato `"fake-token-{subject}"`.
   * Lança erro se o token não estiver no formato esperado.
   *
   * @param token - Token fake a ser verificado.
   * @param secret - Chave secreta (ignorada no fake).
   * @returns Payload decodificado com o campo `sub`.
   * @throws Error se o formato do token for inválido.
   */
  verify(token: string, secret: string): Record<string, unknown> {
    if (!token.startsWith('fake-token-')) {
      throw new Error('Invalid token');
    }

    const subject = token.replace('fake-token-', '');
    return { sub: subject };
  }
}

export default new FakeTokenProvider();
