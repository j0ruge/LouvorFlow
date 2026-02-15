import prisma from '../../prisma/cliente.js';

class tonalidadeController {
    async index(req, res) {
        try {
            const tonalidades = await prisma.tonalidades.findMany({
                select: { id: true, tom: true }
            });
            return res.status(200).json(tonalidades);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar tonalidades"] });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de tonalidade não enviado"] });
            }

            const tonalidade = await prisma.tonalidades.findUnique({
                where: { id },
                select: { id: true, tom: true }
            });

            if (!tonalidade) {
                return res.status(404).json({ errors: ["A tonalidade não foi encontrada ou não existe"] });
            }

            return res.status(200).json(tonalidade);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar tonalidade"] });
        }
    }

    async create(req, res) {
        try {
            const { tom } = req.body;

            if (!tom) {
                return res.status(400).json({ errors: ["Tom da tonalidade é obrigatório"] });
            }

            const existente = await prisma.tonalidades.findUnique({ where: { tom } });

            if (existente) {
                return res.status(409).json({ errors: ["Já existe uma tonalidade com esse tom"] });
            }

            const nova = await prisma.tonalidades.create({
                data: { tom },
                select: { id: true, tom: true }
            });

            return res.status(201).json({
                msg: "Tonalidade criada com sucesso",
                tonalidade: nova
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao criar tonalidade"] });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de tonalidade não enviado"] });
            }

            const existente = await prisma.tonalidades.findUnique({ where: { id } });

            if (!existente) {
                return res.status(404).json({ errors: ["Tonalidade com esse ID não existe ou não foi encontrada"] });
            }

            const { tom } = req.body;

            if (!tom) {
                return res.status(400).json({ errors: ["Tom da tonalidade é obrigatório"] });
            }

            const tonalidade = await prisma.tonalidades.update({
                where: { id },
                data: { tom },
                select: { id: true, tom: true }
            });

            return res.status(200).json({
                msg: "Tonalidade editada com sucesso",
                tonalidade
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao editar tonalidade"] });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de tonalidade não enviado"] });
            }

            const tonalidade = await prisma.tonalidades.findUnique({
                where: { id },
                select: { id: true, tom: true }
            });

            if (!tonalidade) {
                return res.status(404).json({ errors: ["A tonalidade não foi encontrada ou não existe"] });
            }

            await prisma.tonalidades.delete({ where: { id } });
            return res.status(200).json({
                msg: "Tonalidade deletada com sucesso",
                tonalidade
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao deletar tonalidade"] });
        }
    }
}

export default new tonalidadeController();
