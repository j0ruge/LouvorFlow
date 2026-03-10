import type { ITokenProvider, ITokenSignOptions } from '../../../src/types/auth.types.js';

/**
 * Provedor fake de tokens JWT para uso em testes unitários.
 *
 * Gera tokens únicos no formato `"fake-token-{subject}-{counter}"` e os decodifica
 * extraindo o subject e o payload da string, sem nenhuma criptografia real.
 * Armazena os payloads em memória para retorná-los na verificação.
 */
class FakeTokenProvider implements ITokenProvider {
  /** Mapa de payloads armazenados indexados pelo token gerado. */
  private payloads: Map<string, Record<string, unknown>> = new Map();

  /** Contador incremental para garantir unicidade dos tokens gerados. */
  private counter = 0;

  /**
   * Gera um token fake único no formato `"fake-token-{subject}-{counter}"` e armazena o payload.
   *
   * @param payload - Payload do token a ser armazenado para uso na verificação.
   * @param secret - Chave secreta (ignorada no fake).
   * @param options - Opções de assinatura contendo o subject.
   * @returns Token fake único com o subject e contador embutidos.
   */
  sign(
    payload: Record<string, unknown>,
    secret: string,
    options: ITokenSignOptions,
  ): string {
    const token = `fake-token-${options.subject}-${++this.counter}`;
    this.payloads.set(token, { ...payload, sub: options.subject });
    return token;
  }

  /**
   * Verifica e decodifica um token fake.
   *
   * Extrai o subject do formato `"fake-token-{subject}"` e retorna
   * o payload original armazenado durante a assinatura.
   * Lança erro se o token não estiver no formato esperado.
   *
   * @param token - Token fake a ser verificado.
   * @param secret - Chave secreta (ignorada no fake).
   * @returns Payload decodificado com o campo `sub` e demais dados originais.
   * @throws Error se o formato do token for inválido.
   */
  verify(token: string, secret: string): Record<string, unknown> {
    if (!token.startsWith('fake-token-')) {
      throw new Error('Invalid token');
    }

    const stored = this.payloads.get(token);
    if (stored) return { ...stored };

    const subject = token.replace('fake-token-', '');
    return { sub: subject };
  }

  /**
   * Reinicia o armazenamento de payloads e o contador em memória.
   * Utilizado entre testes para garantir isolamento.
   */
  reset() {
    this.payloads.clear();
    this.counter = 0;
  }
}

export default new FakeTokenProvider();
