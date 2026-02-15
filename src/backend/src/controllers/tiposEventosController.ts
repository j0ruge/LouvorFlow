import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';

class tipoEventoController {
    async index(req: Request, res: Response): Promise<void> {
        try {
            const tiposEventos = await prisma.tipos_Eventos.findMany({
                select: { id: true, nome: true }
            });
            res.status(200).json(tiposEventos);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tipos de eventos"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tipo de evento não enviado"] });
                return;
            }

            const tipoEvento = await prisma.tipos_Eventos.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!tipoEvento) {
                res.status(404).json({ errors: ["O tipo de evento não foi encontrado ou não existe"] });
                return;
            }

            res.status(200).json(tipoEvento);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar tipo de evento"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome do tipo de evento é obrigatório"] });
                return;
            }

            const existente = await prisma.tipos_Eventos.findUnique({ where: { nome } });

            if (existente) {
                res.status(409).json({ errors: ["Já existe um tipo de evento com esse nome"] });
                return;
            }

            const novo = await prisma.tipos_Eventos.create({
                data: { nome },
                select: { id: true, nome: true }
            });

            res.status(201).json({
                msg: "Tipo de evento criado com sucesso",
                tipoEvento: novo
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar tipo de evento"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tipo de evento não enviado"] });
                return;
            }

            const existente = await prisma.tipos_Eventos.findUnique({ where: { id } });

            if (!existente) {
                res.status(404).json({ errors: ["Tipo de evento com esse ID não existe ou não foi encontrado"] });
                return;
            }

            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome do tipo de evento é obrigatório"] });
                return;
            }

            const tipoEvento = await prisma.tipos_Eventos.update({
                where: { id },
                data: { nome },
                select: { id: true, nome: true }
            });

            res.status(200).json({
                msg: "Tipo de evento editado com sucesso",
                tipoEvento
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar tipo de evento"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de tipo de evento não enviado"] });
                return;
            }

            const tipoEvento = await prisma.tipos_Eventos.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!tipoEvento) {
                res.status(404).json({ errors: ["O tipo de evento não foi encontrado ou não existe"] });
                return;
            }

            await prisma.tipos_Eventos.delete({ where: { id } });
            res.status(200).json({
                msg: "Tipo de evento deletado com sucesso",
                tipoEvento
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar tipo de evento"] });
        }
    }
}

export default new tipoEventoController();
