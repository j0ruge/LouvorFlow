import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';

class funcaoController {
    async index(req: Request, res: Response): Promise<void> {
        try {
            const funcoes = await prisma.funcoes.findMany({
                select: { id: true, nome: true }
            });
            res.status(200).json(funcoes);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar funções"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de função não enviado"] });
                return;
            }

            const funcao = await prisma.funcoes.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!funcao) {
                res.status(404).json({ errors: ["A função não foi encontrada ou não existe"] });
                return;
            }

            res.status(200).json(funcao);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar função"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome da função é obrigatório"] });
                return;
            }

            const existente = await prisma.funcoes.findUnique({ where: { nome } });

            if (existente) {
                res.status(409).json({ errors: ["Já existe uma função com esse nome"] });
                return;
            }

            const nova = await prisma.funcoes.create({
                data: { nome },
                select: { id: true, nome: true }
            });

            res.status(201).json({
                msg: "Função criada com sucesso",
                funcao: nova
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar função"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de função não enviado"] });
                return;
            }

            const existente = await prisma.funcoes.findUnique({ where: { id } });

            if (!existente) {
                res.status(404).json({ errors: ["Função com esse ID não existe ou não foi encontrada"] });
                return;
            }

            const { nome } = req.body;

            if (!nome) {
                res.status(400).json({ errors: ["Nome da função é obrigatório"] });
                return;
            }

            const duplicado = await prisma.funcoes.findFirst({ where: { nome, NOT: { id } } });
            if (duplicado) {
                res.status(409).json({ errors: ["Nome de função já existe"] });
                return;
            }

            const funcao = await prisma.funcoes.update({
                where: { id },
                data: { nome },
                select: { id: true, nome: true }
            });

            res.status(200).json({
                msg: "Função editada com sucesso",
                funcao
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar função"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de função não enviado"] });
                return;
            }

            const funcao = await prisma.funcoes.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!funcao) {
                res.status(404).json({ errors: ["A função não foi encontrada ou não existe"] });
                return;
            }

            await prisma.funcoes.delete({ where: { id } });
            res.status(200).json({
                msg: "Função deletada com sucesso",
                funcao
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar função"] });
        }
    }
}

export default new funcaoController();
