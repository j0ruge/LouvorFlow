import { AppError } from '../errors/AppError.js';
import { comBarreiraDeDuplicidade } from '../utils/duplicidade.js';
import artistasRepository from '../repositories/artistas.repository.js';
import { compararNomesPtBr } from '../utils/ordenacao.js';

class ArtistasService {
    /**
     * Lista todos os artistas em ordem alfabética (pt-BR).
     * @returns Array de artistas (id e nome) ordenado por nome.
     */
    async listAll() {
        const artistas = await artistasRepository.findAll();
        return [...artistas].sort((a, b) => compararNomesPtBr(a.nome, b.nome));
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de artista não enviado", 400);

        const artista = await artistasRepository.findById(id);
        if (!artista) throw new AppError("O artista não foi encontrado ou não existe", 404);

        return artista;
    }

    /**
     * Cria um novo artista no tenant ativo.
     *
     * @param nome - Nome do artista.
     * @param tenantId - UUID do tenant ativo.
     * @returns Artista criado com id e nome.
     * @throws AppError 400 se nome ausente; 409 se nome duplicado no tenant.
     */
    async create(nome: string | undefined, tenantId: string) {
        if (!nome) throw new AppError("Nome do artista é obrigatório", 400);

        const artistaExistente = await artistasRepository.findByNome(nome);
        if (artistaExistente) throw new AppError("Já existe um artista com esse nome", 409);

        const novoArtista = await comBarreiraDeDuplicidade(
            "Já existe um artista com esse nome",
            () => artistasRepository.create(nome, tenantId),
        );
        return { id: novoArtista.id, nome: novoArtista.nome };
    }

    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de artista não enviado", 400);

        const existente = await artistasRepository.findByIdSimple(id);
        if (!existente) throw new AppError("Artista com esse ID não existe ou não foi encontrado", 404);

        if (!nome) throw new AppError("Nome do artista é obrigatório", 400);

        const duplicado = await artistasRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome do artista já existe", 409);

        const artista = await comBarreiraDeDuplicidade(
            "Nome do artista já existe",
            () => artistasRepository.update(id, nome),
        );
        return { id: artista.id, nome: artista.nome };
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de artista não enviado", 400);

        const artista = await artistasRepository.findByIdSimple(id);
        if (!artista) throw new AppError("O artista não foi encontrado ou não existe", 404);

        await artistasRepository.delete(id);
        return artista;
    }
}

export default new ArtistasService();
