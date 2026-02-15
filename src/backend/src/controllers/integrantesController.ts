import { Request, Response } from 'express';
import prisma from '../../prisma/cliente.js';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

const INTEGRANTE_PUBLIC_SELECT = {
    id: true,
    nome: true,
    doc_id: true,
    email: true,
    telefone: true
} as const;

interface IdNome {
    id: string;
    nome: string;
}

interface IntegranteWithFuncoes {
    id: string;
    nome: string;
    doc_id: string;
    email: string;
    telefone: string | null;
    Integrantes_Funcoes: {
        integrantes_funcoes_funcao_id_fkey: IdNome;
    }[];
}

class integranteController {
    async index(req: Request, res: Response): Promise<void> {
        try {
            const integrantes = await prisma.integrantes.findMany({
                select: {
                    ...INTEGRANTE_PUBLIC_SELECT,
                    Integrantes_Funcoes: {
                        select: {
                            integrantes_funcoes_funcao_id_fkey: {
                                select: { id: true, nome: true }
                            }
                        }
                    }
                }
            });

            const result = integrantes.map((i: IntegranteWithFuncoes) => ({
                ...i,
                funcoes: i.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey),
                Integrantes_Funcoes: undefined
            }));

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar integrantes"] });
        }
    }

    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de integrante não enviado"] });
                return;
            }

            const integrante = await prisma.integrantes.findUnique({
                where: { id },
                select: {
                    ...INTEGRANTE_PUBLIC_SELECT,
                    Integrantes_Funcoes: {
                        select: {
                            integrantes_funcoes_funcao_id_fkey: {
                                select: { id: true, nome: true }
                            }
                        }
                    }
                }
            });

            if (!integrante) {
                res.status(404).json({ errors: ["O integrante não foi encontrado ou não existe"] });
                return;
            }

            const result = {
                ...integrante,
                funcoes: integrante.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey),
                Integrantes_Funcoes: undefined
            };

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar integrante"] });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { nome, doc_id, email, senha, telefone } = req.body;

            if (!nome || !doc_id || !email || !senha) {
                res.status(400).json({ errors: ["Dados não enviados"] });
                return;
            }

            const integranteExistente = await prisma.integrantes.findUnique({ where: { doc_id } });

            if (integranteExistente) {
                res.status(409).json({ errors: ["Já existe um integrante com esse doc_id"] });
                return;
            }

            const randomSalt = randomInt(10, 16);
            const passwordHash = await bcrypt.hash(senha, randomSalt);

            const novoIntegrante = await prisma.integrantes.create({
                data: { nome, doc_id, email, senha: passwordHash, telefone: telefone || null },
                select: INTEGRANTE_PUBLIC_SELECT
            });

            res.status(201).json({
                msg: "Integrante criado com sucesso",
                integrante: novoIntegrante
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao criar integrante"] });
        }
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de integrante não enviado"] });
                return;
            }

            const integranteExistente = await prisma.integrantes.findUnique({ where: { id } });

            if (!integranteExistente) {
                res.status(404).json({ errors: ["Integrante com esse ID não existe ou não foi encontrado"] });
                return;
            }

            if (Object.keys(req.body).length === 0) {
                res.status(400).json({ errors: ["Nenhum dado enviado"] });
                return;
            }

            const { nome, doc_id, email, senha, telefone } = req.body;
            const updateData: Record<string, unknown> = {};
            if (nome !== undefined) updateData.nome = nome;
            if (doc_id !== undefined) updateData.doc_id = doc_id;
            if (email !== undefined) updateData.email = email;
            if (telefone !== undefined) updateData.telefone = telefone;

            if (senha) {
                const randomSalt = randomInt(10, 16);
                updateData.senha = await bcrypt.hash(senha, randomSalt);
            }

            const integrante = await prisma.integrantes.update({
                where: { id },
                data: updateData,
                select: INTEGRANTE_PUBLIC_SELECT
            });

            res.status(200).json({
                msg: "Integrante editado com sucesso",
                integrante
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao editar integrante"] });
        }
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ errors: ["ID de integrante não enviado"] });
                return;
            }

            const integrante = await prisma.integrantes.findUnique({
                where: { id },
                select: INTEGRANTE_PUBLIC_SELECT
            });

            if (!integrante) {
                res.status(404).json({ errors: ["O integrante não foi encontrado ou não existe"] });
                return;
            }

            await prisma.integrantes.delete({ where: { id } });
            res.status(200).json({
                msg: "Integrante deletado com sucesso",
                integrante
            });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao deletar integrante"] });
        }
    }

    // --- Junction: Funcoes (integrantes_funcoes) ---

    async listFuncoes(req: Request<{ integranteId: string }>, res: Response): Promise<void> {
        try {
            const { integranteId } = req.params;

            const funcoes = await prisma.integrantes_Funcoes.findMany({
                where: { musico_id: integranteId },
                select: {
                    integrantes_funcoes_funcao_id_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            res.status(200).json(funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey));
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao buscar funções do integrante"] });
        }
    }

    async addFuncao(req: Request<{ integranteId: string }>, res: Response): Promise<void> {
        try {
            const { integranteId } = req.params;
            const { funcao_id } = req.body;

            if (!funcao_id) {
                res.status(400).json({ errors: ["ID da função é obrigatório"] });
                return;
            }

            const existente = await prisma.integrantes_Funcoes.findUnique({
                where: { musico_id_funcao_id: { musico_id: integranteId, funcao_id } }
            });

            if (existente) {
                res.status(409).json({ errors: ["Registro duplicado"] });
                return;
            }

            await prisma.integrantes_Funcoes.create({
                data: { musico_id: integranteId, funcao_id }
            });

            res.status(201).json({ msg: "Função adicionada ao integrante com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao adicionar função ao integrante"] });
        }
    }

    async removeFuncao(req: Request<{ integranteId: string; funcaoId: string }>, res: Response): Promise<void> {
        try {
            const { integranteId, funcaoId } = req.params;

            const registro = await prisma.integrantes_Funcoes.findUnique({
                where: { musico_id_funcao_id: { musico_id: integranteId, funcao_id: funcaoId } }
            });

            if (!registro) {
                res.status(404).json({ errors: ["Registro não encontrado"] });
                return;
            }

            await prisma.integrantes_Funcoes.delete({ where: { id: registro.id } });
            res.status(200).json({ msg: "Função removida do integrante com sucesso" });
        } catch (error) {
            res.status(500).json({ errors: ["Erro ao remover função do integrante"] });
        }
    }
}

export default new integranteController();
