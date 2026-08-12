import { AppError } from '../errors/AppError.js';
import { comBarreiraDeDuplicidade } from '../utils/duplicidade.js';
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

    /**
     * Cria uma nova tonalidade no tenant ativo.
     *
     * @param tom - Tom da tonalidade.
     * @param tenantId - UUID do tenant ativo.
     * @returns Tonalidade criada.
     * @throws AppError 400 se tom ausente; 409 se tom duplicado no tenant.
     */
    async create(tom: string | undefined, tenantId: string) {
        if (!tom) throw new AppError("Tom da tonalidade é obrigatório", 400);

        const existente = await tonalidadesRepository.findByTom(tom);
        if (existente) throw new AppError("Já existe uma tonalidade com esse tom", 409);

        return comBarreiraDeDuplicidade(
            "Já existe uma tonalidade com esse tom",
            () => tonalidadesRepository.create(tom, tenantId),
        );
    }

    async update(id: string, tom?: string) {
        if (!id) throw new AppError("ID de tonalidade não enviado", 400);

        const existente = await tonalidadesRepository.findById(id);
        if (!existente) throw new AppError("Tonalidade com esse ID não existe ou não foi encontrada", 404);

        if (!tom) throw new AppError("Tom da tonalidade é obrigatório", 400);

        const duplicado = await tonalidadesRepository.findByTomExcludingId(tom, id);
        if (duplicado) throw new AppError("Tom já existe", 409);

        return comBarreiraDeDuplicidade(
            "Tom já existe",
            () => tonalidadesRepository.update(id, tom),
        );
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
