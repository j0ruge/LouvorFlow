import prisma from '../../prisma/cliente.js';

class funcaoController {
    async index(req, res) {
        try {
            const funcoes = await prisma.funcoes.findMany({
                select: { id: true, nome: true }
            });
            return res.status(200).json(funcoes);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar funções"] });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de função não enviado"] });
            }

            const funcao = await prisma.funcoes.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!funcao) {
                return res.status(404).json({ errors: ["A função não foi encontrada ou não existe"] });
            }

            return res.status(200).json(funcao);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar função"] });
        }
    }

    async create(req, res) {
        try {
            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ errors: ["Nome da função é obrigatório"] });
            }

            const existente = await prisma.funcoes.findUnique({ where: { nome } });

            if (existente) {
                return res.status(409).json({ errors: ["Já existe uma função com esse nome"] });
            }

            const nova = await prisma.funcoes.create({
                data: { nome },
                select: { id: true, nome: true }
            });

            return res.status(201).json({
                msg: "Função criada com sucesso",
                funcao: nova
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao criar função"] });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de função não enviado"] });
            }

            const existente = await prisma.funcoes.findUnique({ where: { id } });

            if (!existente) {
                return res.status(404).json({ errors: ["Função com esse ID não existe ou não foi encontrada"] });
            }

            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ errors: ["Nome da função é obrigatório"] });
            }

            const funcao = await prisma.funcoes.update({
                where: { id },
                data: { nome },
                select: { id: true, nome: true }
            });

            return res.status(200).json({
                msg: "Função editada com sucesso",
                funcao
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao editar função"] });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de função não enviado"] });
            }

            const funcao = await prisma.funcoes.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!funcao) {
                return res.status(404).json({ errors: ["A função não foi encontrada ou não existe"] });
            }

            await prisma.funcoes.delete({ where: { id } });
            return res.status(200).json({
                msg: "Função deletada com sucesso",
                funcao
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao deletar função"] });
        }
    }
}

export default new funcaoController();
