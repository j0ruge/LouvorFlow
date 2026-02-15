import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';

class tonalidadeController {
    async index(req: Request, res: Response): Promise<void> {
        try {
            const tonalidades = await prisma.tonalidades.findMany({
                select: { id: true, tom: true }
            });
            res.status(200).json(tonalidades);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tonalidades"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tonalidade não enviado"] });
                return;
            }

            const tonalidade = await prisma.tonalidades.findUnique({
                where: { id },
                select: { id: true, tom: true }
            });

            if (!tonalidade) {
                res.status(404).json({ errors: ["A tonalidade não foi encontrada ou não existe"] });
                return;
            }

            res.status(200).json(tonalidade);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tonalidade"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { tom } = req.body;

            if (!tom) {
                res.status(400).json({ errors: ["Tom da tonalidade é obrigatório"] });
                return;
            }

            const existente = await prisma.tonalidades.findUnique({ where: { tom } });

            if (existente) {
                res.status(409).json({ errors: ["Já existe uma tonalidade com esse tom"] });
                return;
            }

            const nova = await prisma.tonalidades.create({
                data: { tom },
                select: { id: true, tom: true }
            });

            res.status(201).json({
                msg: "Tonalidade criada com sucesso",
                tonalidade: nova
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar tonalidade"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tonalidade não enviado"] });
                return;
            }

            const existente = await prisma.tonalidades.findUnique({ where: { id } });

            if (!existente) {
                res.status(404).json({ errors: ["Tonalidade com esse ID não existe ou não foi encontrada"] });
                return;
            }

            const { tom } = req.body;

            if (!tom) {
                res.status(400).json({ errors: ["Tom da tonalidade é obrigatório"] });
                return;
            }

            const duplicado = await prisma.tonalidades.findFirst({ where: { tom, NOT: { id } } });
            if (duplicado) {
                res.status(409).json({ errors: ["Tom já existe"] });
                return;
            }

            const tonalidade = await prisma.tonalidades.update({
                where: { id },
                data: { tom },
                select: { id: true, tom: true }
            });

            res.status(200).json({
                msg: "Tonalidade editada com sucesso",
                tonalidade
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar tonalidade"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tonalidade não enviado"] });
                return;
            }

            const tonalidade = await prisma.tonalidades.findUnique({
                where: { id },
                select: { id: true, tom: true }
            });

            if (!tonalidade) {
                res.status(404).json({ errors: ["A tonalidade não foi encontrada ou não existe"] });
                return;
            }

            await prisma.tonalidades.delete({ where: { id } });
            res.status(200).json({
                msg: "Tonalidade deletada com sucesso",
                tonalidade
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar tonalidade"] });
        }
    }
}

export default new tonalidadeController();
