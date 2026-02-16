import { AppError } from '../errors/AppError.js';
import tonalidadesRepository from '../repositories/tonalidades.repository.js';

class TonalidadesService {
    async listAll() {
        return tonalidadesRepository.findAll();
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de tonalidade não enviado", 400);

        const tonalidade = await tonalidadesRepository.findById(id);
        if (!tonalidade) throw new AppError("A tonalidade não foi encontrada ou não existe", 404);

        return tonalidade;
    }

    async create(tom?: string) {
        if (!tom) throw new AppError("Tom da tonalidade é obrigatório", 400);

        const existente = await tonalidadesRepository.findByTom(tom);
        if (existente) throw new AppError("Já existe uma tonalidade com esse tom", 409);

        return tonalidadesRepository.create(tom);
    }

    async update(id: string, tom?: string) {
        if (!id) throw new AppError("ID de tonalidade não enviado", 400);

        const existente = await tonalidadesRepository.findById(id);
        if (!existente) throw new AppError("Tonalidade com esse ID não existe ou não foi encontrada", 404);

        if (!tom) throw new AppError("Tom da tonalidade é obrigatório", 400);

        const duplicado = await tonalidadesRepository.findByTomExcludingId(tom, id);
        if (duplicado) throw new AppError("Tom já existe", 409);

        return tonalidadesRepository.update(id, tom);
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de tonalidade não enviado", 400);

        const tonalidade = await tonalidadesRepository.findById(id);
        if (!tonalidade) throw new AppError("A tonalidade não foi encontrada ou não existe", 404);

        await tonalidadesRepository.delete(id);
        return tonalidade;
    }
}

export default new TonalidadesService();
