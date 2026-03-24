/**
 * Testes unitários do middleware `ensureTenantContext`.
 *
 * Valida os cenários em que a requisição possui ou não o `tenantId`
 * no objeto `req.user`, garantindo que o middleware rejeita corretamente
 * requisições sem contexto de tenant.
 */

import { ensureTenantContext } from '../../src/middlewares/ensureTenantContext.js';
import { AppError } from '../../src/errors/AppError.js';
import type { Request, Response, NextFunction } from 'express';

/**
 * Cria um objeto de requisição Express simulado com campos opcionais.
 *
 * @param user - Objeto parcial de usuário autenticado (opcional)
 * @returns Objeto de requisição simulado com tipagem parcial
 */
function criarReqMock(user?: Partial<{ id: string; tenantId: string }>) {
  return { user } as unknown as Request;
}

/** Resposta Express simulada (não utilizada neste middleware). */
const resMock = {} as Response;

/** @group EnsureTenantContext */
describe('ensureTenantContext', () => {
  /** Função `next` simulada para verificar se o fluxo foi encaminhado. */
  let nextMock: NextFunction;

  /** Reinicia o spy de `next` antes de cada teste para isolamento. */
  beforeEach(() => {
    nextMock = vi.fn();
  });

  /**
   * Deve prosseguir ao próximo middleware quando `req.user.tenantId` está presente.
   */
  it('deve chamar next() quando req.user.tenantId está presente', () => {
    const req = criarReqMock({ id: 'usuario-1', tenantId: 'tenant-abc' });

    ensureTenantContext(req, resMock, nextMock);

    expect(nextMock).toHaveBeenCalledOnce();
  });

  /**
   * Deve lançar AppError 403 quando `req.user` existe mas sem `tenantId`.
   */
  it('deve lançar AppError 403 quando req.user existe mas tenantId está ausente', () => {
    const req = criarReqMock({ id: 'usuario-1' });

    expect(() => ensureTenantContext(req, resMock, nextMock)).toThrow(AppError);
    expect(() => ensureTenantContext(req, resMock, nextMock)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
    expect(nextMock).not.toHaveBeenCalled();
  });

  /**
   * Deve lançar AppError 403 quando `req.user` está completamente ausente.
   */
  it('deve lançar AppError 403 quando req.user está ausente', () => {
    const req = criarReqMock(undefined);

    expect(() => ensureTenantContext(req, resMock, nextMock)).toThrow(AppError);
    expect(() => ensureTenantContext(req, resMock, nextMock)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
    expect(nextMock).not.toHaveBeenCalled();
  });
});
