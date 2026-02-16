import { AppError } from '../errors/AppError.js';
import tagsRepository from '../repositories/tags.repository.js';

class TagsService {
    async listAll() {
        return tagsRepository.findAll();
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de tag não enviado", 400);

        const tag = await tagsRepository.findById(id);
        if (!tag) throw new AppError("A tag não foi encontrada ou não existe", 404);

        return tag;
    }

    async create(nome?: string) {
        if (!nome) throw new AppError("Nome da tag é obrigatório", 400);

        const existente = await tagsRepository.findByNome(nome);
        if (existente) throw new AppError("Já existe uma tag com esse nome", 409);

        return tagsRepository.create(nome);
    }

    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de tag não enviado", 400);

        const existente = await tagsRepository.findById(id);
        if (!existente) throw new AppError("Tag com esse ID não existe ou não foi encontrada", 404);

        if (!nome) throw new AppError("Nome da tag é obrigatório", 400);

        const duplicado = await tagsRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome da tag já existe", 409);

        return tagsRepository.update(id, nome);
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de tag não enviado", 400);

        const tag = await tagsRepository.findById(id);
        if (!tag) throw new AppError("A tag não foi encontrada ou não existe", 404);

        await tagsRepository.delete(id);
        return tag;
    }
}

export default new TagsService();
