import { AppError } from '../errors/AppError.js';
import tiposEventosRepository from '../repositories/tipos-eventos.repository.js';

class TiposEventosService {
    async listAll() {
        return tiposEventosRepository.findAll();
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de tipo de evento não enviado", 400);

        const tipoEvento = await tiposEventosRepository.findById(id);
        if (!tipoEvento) throw new AppError("O tipo de evento não foi encontrado ou não existe", 404);

        return tipoEvento;
    }

    async create(nome?: string) {
        if (!nome) throw new AppError("Nome do tipo de evento é obrigatório", 400);

        const existente = await tiposEventosRepository.findByNome(nome);
        if (existente) throw new AppError("Já existe um tipo de evento com esse nome", 409);

        return tiposEventosRepository.create(nome);
    }

    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de tipo de evento não enviado", 400);

        const existente = await tiposEventosRepository.findById(id);
        if (!existente) throw new AppError("Tipo de evento com esse ID não existe ou não foi encontrado", 404);

        if (!nome) throw new AppError("Nome do tipo de evento é obrigatório", 400);

        const duplicado = await tiposEventosRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome do tipo de evento já existe", 409);

        return tiposEventosRepository.update(id, nome);
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de tipo de evento não enviado", 400);

        const tipoEvento = await tiposEventosRepository.findById(id);
        if (!tipoEvento) throw new AppError("O tipo de evento não foi encontrado ou não existe", 404);

        await tiposEventosRepository.delete(id);
        return tipoEvento;
    }
}

export default new TiposEventosService();
