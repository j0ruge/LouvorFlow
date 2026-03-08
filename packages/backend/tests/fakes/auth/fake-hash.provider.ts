import type { IHashProvider } from '../../../src/types/auth.types.js';

/**
 * Provedor fake de hashing para uso em testes unitários.
 *
 * Não aplica nenhum algoritmo de hash real — retorna o payload
 * como está e compara strings diretamente, eliminando a latência
 * do BCrypt nos testes.
 */
class FakeHashProvider implements IHashProvider {
  /**
   * Retorna o payload sem aplicar hash.
   *
   * @param payload - Texto plano recebido.
   * @returns O próprio payload sem alteração.
   */
  async generateHash(payload: string): Promise<string> {
    return payload;
  }

  /**
   * Compara dois textos por igualdade direta.
   *
   * @param payload - Texto plano a ser comparado.
   * @param hashed - Texto previamente "hasheado" (no fake, é o próprio texto original).
   * @returns `true` se os textos forem idênticos, `false` caso contrário.
   */
  async compareHash(payload: string, hashed: string): Promise<boolean> {
    return payload === hashed;
  }
}

export default new FakeHashProvider();
