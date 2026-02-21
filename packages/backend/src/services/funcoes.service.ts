import { AppError } from '../errors/AppError.js';
import funcoesRepository from '../repositories/funcoes.repository.js';

class FuncoesService {
    async listAll() {
        return funcoesRepository.findAll();
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de função não enviado", 400);

        const funcao = await funcoesRepository.findById(id);
        if (!funcao) throw new AppError("A função não foi encontrada ou não existe", 404);

        return funcao;
    }

    async create(nome?: string) {
        if (!nome) throw new AppError("Nome da função é obrigatório", 400);

        const existente = await funcoesRepository.findByNome(nome);
        if (existente) throw new AppError("Já existe uma função com esse nome", 409);

        return funcoesRepository.create(nome);
    }

    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de função não enviado", 400);

        const existente = await funcoesRepository.findById(id);
        if (!existente) throw new AppError("Função com esse ID não existe ou não foi encontrada", 404);

        if (!nome) throw new AppError("Nome da função é obrigatório", 400);

        const duplicado = await funcoesRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome de função já existe", 409);

        return funcoesRepository.update(id, nome);
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de função não enviado", 400);

        const funcao = await funcoesRepository.findById(id);
        if (!funcao) throw new AppError("A função não foi encontrada ou não existe", 404);

        await funcoesRepository.delete(id);
        return funcao;
    }
}

export default new FuncoesService();
