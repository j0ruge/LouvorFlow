import { AppError } from '../errors/AppError.js';
import categoriasRepository from '../repositories/categorias.repository.js';

class CategoriasService {
    async listAll() {
        return categoriasRepository.findAll();
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de categoria não enviado", 400);

        const categoria = await categoriasRepository.findById(id);
        if (!categoria) throw new AppError("A categoria não foi encontrada ou não existe", 404);

        return categoria;
    }

    async create(nome?: string) {
        if (!nome) throw new AppError("Nome da categoria é obrigatório", 400);

        const existente = await categoriasRepository.findByNome(nome);
        if (existente) throw new AppError("Já existe uma categoria com esse nome", 409);

        return categoriasRepository.create(nome);
    }

    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de categoria não enviado", 400);

        const existente = await categoriasRepository.findById(id);
        if (!existente) throw new AppError("Categoria com esse ID não existe ou não foi encontrada", 404);

        if (!nome) throw new AppError("Nome da categoria é obrigatório", 400);

        const duplicado = await categoriasRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome da categoria já existe", 409);

        return categoriasRepository.update(id, nome);
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de categoria não enviado", 400);

        const categoria = await categoriasRepository.findById(id);
        if (!categoria) throw new AppError("A categoria não foi encontrada ou não existe", 404);

        await categoriasRepository.delete(id);
        return categoria;
    }
}

export default new CategoriasService();
