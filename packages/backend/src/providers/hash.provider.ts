import { hash, compare } from 'bcryptjs';

import type { IHashProvider } from '../types/auth.types.js';

/**
 * Provedor de hashing de senhas usando BCrypt.
 *
 * Utiliza a biblioteca `bcryptjs` com fator de custo (salt rounds) de 12
 * para gerar e comparar hashes de forma segura.
 */
class HashProvider implements IHashProvider {
  /**
   * Gera um hash BCrypt a partir de um texto plano.
   *
   * @param payload - Texto plano a ser hasheado.
   * @returns Hash BCrypt gerado com salt rounds 12.
   */
  async generateHash(payload: string): Promise<string> {
    return hash(payload, 12);
  }

  /**
   * Compara um texto plano com um hash BCrypt existente.
   *
   * @param payload - Texto plano a ser comparado.
   * @param hashed - Hash BCrypt previamente gerado.
   * @returns `true` se o payload corresponde ao hash, `false` caso contrário.
   */
  async compareHash(payload: string, hashed: string): Promise<boolean> {
    return compare(payload, hashed);
  }
}

export default new HashProvider();
