import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';

class TagController {
    async index(req: Request, res: Response): Promise<void> {
        try {
            const tags = await prisma.tags.findMany({
                select: { id: true, nome: true }
            });
            res.status(200).json(tags);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tags"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tag não enviado"] });
                return;
            }

            const tag = await prisma.tags.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!tag) {
                res.status(404).json({ errors: ["A tag não foi encontrada ou não existe"] });
                return;
            }

            res.status(200).json(tag);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tag"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome da tag é obrigatório"] });
                return;
            }

            const existente = await prisma.tags.findUnique({ where: { nome } });

            if (existente) {
                res.status(409).json({ errors: ["Já existe uma tag com esse nome"] });
                return;
            }

            const nova = await prisma.tags.create({
                data: { nome },
                select: { id: true, nome: true }
            });

            res.status(201).json({
                msg: "Tag criada com sucesso",
                tag: nova
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar tag"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tag não enviado"] });
                return;
            }

            const existente = await prisma.tags.findUnique({ where: { id } });

            if (!existente) {
                res.status(404).json({ errors: ["Tag com esse ID não existe ou não foi encontrada"] });
                return;
            }

            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome da tag é obrigatório"] });
                return;
            }

            const duplicado = await prisma.tags.findFirst({ where: { nome, NOT: { id } } });
            if (duplicado) {
                res.status(409).json({ errors: ["Nome da tag já existe"] });
                return;
            }

            const tag = await prisma.tags.update({
                where: { id },
                data: { nome },
                select: { id: true, nome: true }
            });

            res.status(200).json({
                msg: "Tag editada com sucesso",
                tag
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar tag"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tag não enviado"] });
                return;
            }

            const tag = await prisma.tags.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!tag) {
                res.status(404).json({ errors: ["A tag não foi encontrada ou não existe"] });
                return;
            }

            await prisma.tags.delete({ where: { id } });
            res.status(200).json({
                msg: "Tag deletada com sucesso",
                tag
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar tag"] });
        }
    }
}

export default new TagController();
