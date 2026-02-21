import { AppError } from '../errors/AppError.js';
import artistasRepository from '../repositories/artistas.repository.js';

class ArtistasService {
    async listAll() {
        return artistasRepository.findAll();
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de artista não enviado", 400);

        const artista = await artistasRepository.findById(id);
        if (!artista) throw new AppError("O artista não foi encontrado ou não existe", 404);

        return artista;
    }

    async create(nome?: string) {
        if (!nome) throw new AppError("Nome do artista é obrigatório", 400);

        const artistaExistente = await artistasRepository.findByNome(nome);
        if (artistaExistente) throw new AppError("Já existe um artista com esse nome", 409);

        const novoArtista = await artistasRepository.create(nome);
        return { id: novoArtista.id, nome: novoArtista.nome };
    }

    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de artista não enviado", 400);

        const existente = await artistasRepository.findByIdSimple(id);
        if (!existente) throw new AppError("Artista com esse ID não existe ou não foi encontrado", 404);

        if (!nome) throw new AppError("Nome do artista é obrigatório", 400);

        const duplicado = await artistasRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome do artista já existe", 409);

        const artista = await artistasRepository.update(id, nome);
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
