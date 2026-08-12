import { AppError } from '../errors/AppError.js';

/**
 * Executa uma escrita traduzindo o `P2002` do Prisma em `AppError` 409.
 *
 * A checagem prévia por nome (`findByNome`/`findByTom`) resolve o caso comum,
 * mas não é uma trava: duas requisições concorrentes passam juntas por ela e a
 * perdedora bate no índice único do banco. Sem esta tradução o `P2002` sobe cru
 * até o handler genérico de `app.ts`, que ecoa `err.message` fora de produção —
 * um 500 vazando detalhe interno onde o correto é o mesmo 409 que a checagem
 * prévia já retornaria.
 *
 * Mora num helper, e não repetido em cada service, porque os seis domínios de
 * suporte (artistas, categorias, funções, grupos de funções, tipos de evento e
 * tonalidades) têm a mesma barreira variando só a mensagem.
 *
 * @param mensagem - Texto do 409, específico da entidade
 * @param escrita - Operação de escrita a proteger
 * @returns O resultado da escrita
 * @throws {AppError} 409 quando o índice único do banco recusa a gravação
 */
export async function comBarreiraDeDuplicidade<T>(
    mensagem: string,
    escrita: () => Promise<T>,
): Promise<T> {
    try {
        return await escrita();
    } catch (error) {
        const prismaError = error as { code?: string };
        if (error instanceof Error && 'code' in error && prismaError.code === 'P2002') {
            throw new AppError(mensagem, 409);
        }
        throw error;
    }
}
