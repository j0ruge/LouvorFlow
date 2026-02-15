import prisma from '../../prisma/cliente.js';

class tagController {
    async index(req, res) {
        try {
            const tags = await prisma.tags.findMany({
                select: { id: true, nome: true }
            });
            return res.status(200).json(tags);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar tags"] });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de tag não enviado"] });
            }

            const tag = await prisma.tags.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!tag) {
                return res.status(404).json({ errors: ["A tag não foi encontrada ou não existe"] });
            }

            return res.status(200).json(tag);
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar tag"] });
        }
    }

    async create(req, res) {
        try {
            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ errors: ["Nome da tag é obrigatório"] });
            }

            const existente = await prisma.tags.findUnique({ where: { nome } });

            if (existente) {
                return res.status(409).json({ errors: ["Já existe uma tag com esse nome"] });
            }

            const nova = await prisma.tags.create({
                data: { nome },
                select: { id: true, nome: true }
            });

            return res.status(201).json({
                msg: "Tag criada com sucesso",
                tag: nova
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao criar tag"] });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de tag não enviado"] });
            }

            const existente = await prisma.tags.findUnique({ where: { id } });

            if (!existente) {
                return res.status(404).json({ errors: ["Tag com esse ID não existe ou não foi encontrada"] });
            }

            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ errors: ["Nome da tag é obrigatório"] });
            }

            const tag = await prisma.tags.update({
                where: { id },
                data: { nome },
                select: { id: true, nome: true }
            });

            return res.status(200).json({
                msg: "Tag editada com sucesso",
                tag
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao editar tag"] });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de tag não enviado"] });
            }

            const tag = await prisma.tags.findUnique({
                where: { id },
                select: { id: true, nome: true }
            });

            if (!tag) {
                return res.status(404).json({ errors: ["A tag não foi encontrada ou não existe"] });
            }

            await prisma.tags.delete({ where: { id } });
            return res.status(200).json({
                msg: "Tag deletada com sucesso",
                tag
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao deletar tag"] });
        }
    }
}

export default new tagController();
