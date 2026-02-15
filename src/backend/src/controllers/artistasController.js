import prisma from '../../prisma/cliente.js';

class artistaController {
    async index(req, res) {
        try {
            const artistas = await prisma.artistas.findMany({
                select: { id: true, nome: true }
            });
            return res.status(200).json(artistas);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar artistas"] });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de artista não enviado"] });
            }

            const artista = await prisma.artistas.findUnique({
                where: { id },
                select: {
                    id: true,
                    nome: true,
                    musicas: {
                        select: {
                            id: true,
                            musica_id: true,
                            bpm: true,
                            cifras: true,
                            lyrics: true,
                            link_versao: true,
                            artistas_musicas_musica_id_fkey: {
                                select: { id: true, nome: true }
                            }
                        }
                    }
                }
            });

            if (!artista) {
                return res.status(404).json({ errors: ["O artista não foi encontrado ou não existe"] });
            }

            return res.status(200).json(artista);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar artista"] });
        }
    }

    async create(req, res) {
        try {
            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ errors: ["Nome do artista é obrigatório"] });
            }

            const artistaExistente = await prisma.artistas.findUnique({ where: { nome } });

            if (artistaExistente) {
                return res.status(409).json({ errors: ["Já existe um artista com esse nome"] });
            }

            const novoArtista = await prisma.artistas.create({ data: { nome } });
            return res.status(201).json({
                msg: "Artista criado com sucesso",
                artista: { id: novoArtista.id, nome: novoArtista.nome }
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao criar artista"] });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de artista não enviado"] });
            }

            const artistaExistente = await prisma.artistas.findUnique({ where: { id } });

            if (!artistaExistente) {
                return res.status(404).json({ errors: ["Artista com esse ID não existe ou não foi encontrado"] });
            }

            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ errors: ["Nome do artista é obrigatório"] });
            }

            const artista = await prisma.artistas.update({
                where: { id },
                data: { nome }
            });
            return res.status(200).json({
                msg: "Artista editado com sucesso",
                artista: { id: artista.id, nome: artista.nome }
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao editar artista"] });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de artista não enviado"] });
            }

            const artista = await prisma.artistas.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!artista) {
                return res.status(404).json({ errors: ["O artista não foi encontrado ou não existe"] });
            }

            await prisma.artistas.delete({ where: { id } });
            return res.status(200).json({
                msg: "Artista deletado com sucesso",
                artista
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao deletar artista"] });
        }
    }
}

export default new artistaController();
