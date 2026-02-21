import { AppError } from '../errors/AppError.js';
import categoriasRepository from '../repositories/categorias.repository.js';

/**
 * Serviço com regras de negócio para categorias.
 * Valida dados e delega persistência ao CategoriasRepository.
 */
class CategoriasService {
    /**
     * Lista todas as categorias.
     * @returns Array de categorias (id e nome).
     */
    async listAll() {
        return categoriasRepository.findAll();
    }

    /**
     * Busca uma categoria pelo ID.
     * @param id - Identificador da categoria.
     * @returns Categoria encontrada.
     * @throws AppError 400 se ID vazio; 404 se não encontrada.
     */
    async getById(id: string) {
        if (!id) throw new AppError("ID de categoria não enviado", 400);

        const categoria = await categoriasRepository.findById(id);
        if (!categoria) throw new AppError("A categoria não foi encontrada ou não existe", 404);

        return categoria;
    }

    /**
     * Cria uma nova categoria.
     * @param nome - Nome da categoria.
     * @returns Categoria criada.
     * @throws AppError 400 se nome ausente; 409 se nome duplicado.
     */
    async create(nome?: string) {
        if (!nome) throw new AppError("Nome da categoria é obrigatório", 400);

        const existente = await categoriasRepository.findByNome(nome);
        if (existente) throw new AppError("Já existe uma categoria com esse nome", 409);

        return categoriasRepository.create(nome);
    }

    /**
     * Atualiza o nome de uma categoria existente.
     * @param id - Identificador da categoria.
     * @param nome - Novo nome.
     * @returns Categoria atualizada.
     * @throws AppError 400 se ID ou nome ausente; 404 se não encontrada; 409 se nome duplicado.
     */
    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de categoria não enviado", 400);

        const existente = await categoriasRepository.findById(id);
        if (!existente) throw new AppError("Categoria com esse ID não existe ou não foi encontrada", 404);

        if (!nome) throw new AppError("Nome da categoria é obrigatório", 400);

        const duplicado = await categoriasRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome da categoria já existe", 409);

        return categoriasRepository.update(id, nome);
    }

    /**
     * Remove uma categoria pelo ID.
     * @param id - Identificador da categoria.
     * @returns Categoria removida.
     * @throws AppError 400 se ID vazio; 404 se não encontrada.
     */
    async delete(id: string) {
        if (!id) throw new AppError("ID de categoria não enviado", 400);

        const categoria = await categoriasRepository.findById(id);
        if (!categoria) throw new AppError("A categoria não foi encontrada ou não existe", 404);

        await categoriasRepository.delete(id);
        return categoria;
    }
}

export default new CategoriasService();
