import { describe, it, expect, vi } from 'vitest';
import { comBarreiraDeDuplicidade } from '../../src/utils/duplicidade.js';
import { AppError } from '../../src/errors/AppError.js';

/**
 * Barreira de duplicidade das escritas dos domínios de suporte: traduz o
 * `P2002` do Prisma em 409 e deixa o resto passar intacto.
 */
describe('comBarreiraDeDuplicidade', () => {
  /** No caminho feliz a barreira é transparente: devolve o valor da escrita. */
  it('deve devolver o resultado da escrita quando não há erro', async () => {
    const escrita = vi.fn().mockResolvedValue({ id: 'abc', nome: 'Hillsong' });

    await expect(
      comBarreiraDeDuplicidade('Já existe um artista com esse nome', escrita),
    ).resolves.toEqual({ id: 'abc', nome: 'Hillsong' });
    expect(escrita).toHaveBeenCalledTimes(1);
  });

  /**
   * Corrida perdida no índice único: o `P2002` cru viraria um 500 vazando
   * `err.message` fora de produção — aqui vira o mesmo 409 que a checagem
   * prévia retornaria.
   */
  it('deve traduzir P2002 em AppError 409 com a mensagem da entidade', async () => {
    const p2002 = Object.assign(new Error('Unique constraint failed'), {
      code: 'P2002',
      meta: { target: ['tenant_id', 'nome'] },
    });

    await expect(
      comBarreiraDeDuplicidade('Já existe uma categoria com esse nome', () =>
        Promise.reject(p2002),
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Já existe uma categoria com esse nome',
    });
  });

  /** Outros códigos do Prisma não são engolidos — sobem para quem sabe tratá-los. */
  it('deve relançar erro Prisma de outro código sem traduzir', async () => {
    const p2003 = Object.assign(new Error('Foreign key constraint failed'), {
      code: 'P2003',
      meta: { constraint: 'musicas_fk_tonalidade_fkey' },
    });

    await expect(
      comBarreiraDeDuplicidade('Tom já existe', () => Promise.reject(p2003)),
    ).rejects.toBe(p2003);
  });

  /** Erro comum (sem `code`) também passa intacto, inclusive um `AppError`. */
  it('deve relançar erro sem código do Prisma sem traduzir', async () => {
    const erro = new AppError('Falha de rede', 503);

    await expect(
      comBarreiraDeDuplicidade('Já existe uma função com esse nome', () =>
        Promise.reject(erro),
      ),
    ).rejects.toBe(erro);
  });
});
