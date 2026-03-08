/**
 * Middleware genérico de validação de requisição usando Zod.
 *
 * Valida body e/ou params da requisição contra schemas Zod.
 * Em caso de erro, retorna 400 com as mensagens de validação.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Opções de schemas Zod para validar diferentes partes da requisição.
 */
interface ValidateOptions {
    /** Schema Zod para validar o body da requisição. */
    body?: ZodSchema;
    /** Schema Zod para validar os parâmetros de rota. */
    params?: ZodSchema;
}

/**
 * Cria um middleware Express que valida a requisição contra os schemas Zod fornecidos.
 *
 * @param options - Objeto contendo schemas opcionais para body e params.
 * @returns Middleware que valida a requisição e retorna 400 em caso de falha.
 */
export function validateRequest(options: ValidateOptions) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            if (options.body) {
                req.body = options.body.parse(req.body);
            }
            if (options.params) {
                req.params = options.params.parse(req.params);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => e.message);
                res.status(400).json({ erro: messages.join('; '), codigo: 400 });
                return;
            }
            next(error);
        }
    };
}
