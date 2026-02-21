import type { Categorias } from '@prisma/client';
import prisma from '../../prisma/cliente.js';

type CategoriaSummary = Pick<Categorias, 'id' | 'nome'>;

/**
 * Repositório de acesso a dados de categorias via Prisma.
 */
class CategoriasRepository {
    /**
     * Retorna todas as categorias (id e nome).
     * @returns Lista de categorias resumidas.
     */
    async findAll(): Promise<CategoriaSummary[]> {
        return prisma.categorias.findMany({
            select: { id: true, nome: true }
        });
    }

    /**
     * Busca uma categoria pelo ID.
     * @param id - Identificador da categoria.
     * @returns Categoria encontrada ou null se inexistente.
     */
    async findById(id: string): Promise<CategoriaSummary | null> {
        return prisma.categorias.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    /**
     * Busca uma categoria pelo nome exato.
     * @param nome - Nome da categoria.
     * @returns Categoria encontrada ou null.
     */
    async findByNome(nome: string): Promise<Categorias | null> {
        return prisma.categorias.findUnique({ where: { nome } });
    }

    /**
     * Busca uma categoria pelo nome, excluindo um ID específico (para validação de duplicatas em update).
     * @param nome - Nome a ser buscado.
     * @param excludeId - ID da categoria a ser excluída da busca.
     * @returns Categoria encontrada ou null.
     */
    async findByNomeExcludingId(nome: string, excludeId: string): Promise<Categorias | null> {
        return prisma.categorias.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    /**
     * Cria uma nova categoria.
     * @param nome - Nome da categoria.
     * @returns Categoria criada com id e nome.
     */
    async create(nome: string): Promise<CategoriaSummary> {
        return prisma.categorias.create({
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    /**
     * Atualiza o nome de uma categoria existente.
     * @param id - Identificador da categoria.
     * @param nome - Novo nome.
     * @returns Categoria atualizada com id e nome.
     */
    async update(id: string, nome: string): Promise<CategoriaSummary> {
        return prisma.categorias.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    /**
     * Remove uma categoria pelo ID.
     * @param id - Identificador da categoria.
     * @returns Categoria removida (registro completo).
     */
    async delete(id: string): Promise<Categorias> {
        return prisma.categorias.delete({ where: { id } });
    }
}

export default new CategoriasRepository();
