import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';

class ArtistaController {
    async index(req: Request, res: Response): Promise<void> {
        try {
            const artistas = await prisma.artistas.findMany({
                select: { id: true, nome: true }
            });
            res.status(200).json(artistas);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar artistas"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de artista não enviado"] });
                return;
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
                res.status(404).json({ errors: ["O artista não foi encontrado ou não existe"] });
                return;
            }

            res.status(200).json(artista);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar artista"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome do artista é obrigatório"] });
                return;
            }

            const artistaExistente = await prisma.artistas.findUnique({ where: { nome } });

            if (artistaExistente) {
                res.status(409).json({ errors: ["Já existe um artista com esse nome"] });
                return;
            }

            const novoArtista = await prisma.artistas.create({ data: { nome } });
            res.status(201).json({
                msg: "Artista criado com sucesso",
                artista: { id: novoArtista.id, nome: novoArtista.nome }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar artista"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de artista não enviado"] });
                return;
            }

            const artistaExistente = await prisma.artistas.findUnique({ where: { id } });

            if (!artistaExistente) {
                res.status(404).json({ errors: ["Artista com esse ID não existe ou não foi encontrado"] });
                return;
            }

            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome do artista é obrigatório"] });
                return;
            }

            const duplicado = await prisma.artistas.findFirst({ where: { nome, NOT: { id } } });
            if (duplicado) {
                res.status(409).json({ errors: ["Nome do artista já existe"] });
                return;
            }

            const artista = await prisma.artistas.update({
                where: { id },
                data: { nome }
            });
            res.status(200).json({
                msg: "Artista editado com sucesso",
                artista: { id: artista.id, nome: artista.nome }
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar artista"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de artista não enviado"] });
                return;
            }

            const artista = await prisma.artistas.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!artista) {
                res.status(404).json({ errors: ["O artista não foi encontrado ou não existe"] });
                return;
            }

            await prisma.artistas.delete({ where: { id } });
            res.status(200).json({
                msg: "Artista deletado com sucesso",
                artista
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar artista"] });
        }
    }
}

export default new ArtistaController();
