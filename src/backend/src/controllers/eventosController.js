import prisma from '../../prisma/cliente.js';

const EVENTO_INDEX_SELECT = {
    id: true,
    data: true,
    descricao: true,
    eventos_fk_tipo_evento_fkey: {
        select: { id: true, nome: true }
    },
    Eventos_Musicas: {
        select: {
            eventos_musicas_musicas_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    },
    Eventos_Integrantes: {
        select: {
            eventos_integrantes_musico_id_fkey: {
                select: { id: true, nome: true }
            }
        }
    }
};

const EVENTO_SHOW_SELECT = {
    id: true,
    data: true,
    descricao: true,
    eventos_fk_tipo_evento_fkey: {
        select: { id: true, nome: true }
    },
    Eventos_Musicas: {
        select: {
            eventos_musicas_musicas_id_fkey: {
                select: {
                    id: true,
                    nome: true,
                    musicas_fk_tonalidade_fkey: {
                        select: { id: true, tom: true }
                    }
                }
            }
        }
    },
    Eventos_Integrantes: {
        select: {
            eventos_integrantes_musico_id_fkey: {
                select: {
                    id: true,
                    nome: true,
                    Integrantes_Funcoes: {
                        select: {
                            integrantes_funcoes_funcao_id_fkey: {
                                select: { id: true, nome: true }
                            }
                        }
                    }
                }
            }
        }
    }
};

function formatEventoIndex(e) {
    return {
        id: e.id,
        data: e.data,
        descricao: e.descricao,
        tipoEvento: e.eventos_fk_tipo_evento_fkey,
        musicas: e.Eventos_Musicas.map(m => m.eventos_musicas_musicas_id_fkey),
        integrantes: e.Eventos_Integrantes.map(i => i.eventos_integrantes_musico_id_fkey)
    };
}

function formatEventoShow(e) {
    return {
        id: e.id,
        data: e.data,
        descricao: e.descricao,
        tipoEvento: e.eventos_fk_tipo_evento_fkey,
        musicas: e.Eventos_Musicas.map(m => {
            const musica = m.eventos_musicas_musicas_id_fkey;
            return {
                id: musica.id,
                nome: musica.nome,
                tonalidade: musica.musicas_fk_tonalidade_fkey
            };
        }),
        integrantes: e.Eventos_Integrantes.map(i => {
            const integrante = i.eventos_integrantes_musico_id_fkey;
            return {
                id: integrante.id,
                nome: integrante.nome,
                funcoes: integrante.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey)
            };
        })
    };
}

class eventoController {
    // --- Base CRUD ---

    async index(req, res) {
        try {
            const eventos = await prisma.eventos.findMany({
                select: EVENTO_INDEX_SELECT,
                orderBy: { data: 'desc' }
            });

            return res.status(200).json(eventos.map(formatEventoIndex));
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar eventos"] });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de evento não enviado"] });
            }

            const evento = await prisma.eventos.findUnique({
                where: { id },
                select: EVENTO_SHOW_SELECT
            });

            if (!evento) {
                return res.status(404).json({ errors: ["O evento não foi encontrado ou não existe"] });
            }

            return res.status(200).json(formatEventoShow(evento));
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar evento"] });
        }
    }

    async create(req, res) {
        try {
            const { data, fk_tipo_evento, descricao } = req.body;
            const errors = [];

            if (!data) errors.push("Data do evento é obrigatória");
            if (!fk_tipo_evento) errors.push("Tipo de evento é obrigatório");
            if (!descricao) errors.push("Descrição do evento é obrigatória");

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            const evento = await prisma.eventos.create({
                data: { data: new Date(data), fk_tipo_evento, descricao },
                select: {
                    id: true,
                    data: true,
                    descricao: true,
                    eventos_fk_tipo_evento_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            return res.status(201).json({
                msg: "Evento criado com sucesso",
                evento: {
                    id: evento.id,
                    data: evento.data,
                    descricao: evento.descricao,
                    tipoEvento: evento.eventos_fk_tipo_evento_fkey
                }
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao criar evento"] });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de evento não enviado"] });
            }

            const existente = await prisma.eventos.findUnique({ where: { id } });

            if (!existente) {
                return res.status(404).json({ errors: ["O evento não foi encontrado ou não existe"] });
            }

            const { data, fk_tipo_evento, descricao } = req.body;
            const updateData = {};
            if (data !== undefined) updateData.data = new Date(data);
            if (fk_tipo_evento !== undefined) updateData.fk_tipo_evento = fk_tipo_evento;
            if (descricao !== undefined) updateData.descricao = descricao;

            const evento = await prisma.eventos.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    data: true,
                    descricao: true,
                    eventos_fk_tipo_evento_fkey: {
                        select: { id: true, nome: true }
                    }
                }
            });

            return res.status(200).json({
                msg: "Evento editado com sucesso",
                evento: {
                    id: evento.id,
                    data: evento.data,
                    descricao: evento.descricao,
                    tipoEvento: evento.eventos_fk_tipo_evento_fkey
                }
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao editar evento"] });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ errors: ["ID de evento não enviado"] });
            }

            const evento = await prisma.eventos.findUnique({
                where: { id },
                select: { id: true, data: true, descricao: true }
            });

            if (!evento) {
                return res.status(404).json({ errors: ["O evento não foi encontrado ou não existe"] });
            }

            await prisma.eventos.delete({ where: { id } });
            return res.status(200).json({
                msg: "Evento deletado com sucesso",
                evento
            });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao deletar evento"] });
        }
    }

    // --- Junction: Musicas (eventos_musicas) ---

    async listMusicas(req, res) {
        try {
            const { eventoId } = req.params;

            const musicas = await prisma.eventos_Musicas.findMany({
                where: { evento_id: eventoId },
                select: {
                    eventos_musicas_musicas_id_fkey: {
                        select: {
                            id: true,
                            nome: true,
                            musicas_fk_tonalidade_fkey: {
                                select: { id: true, tom: true }
                            }
                        }
                    }
                }
            });

            return res.status(200).json(musicas.map(m => {
                const musica = m.eventos_musicas_musicas_id_fkey;
                return {
                    id: musica.id,
                    nome: musica.nome,
                    tonalidade: musica.musicas_fk_tonalidade_fkey
                };
            }));
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar músicas do evento"] });
        }
    }

    async addMusica(req, res) {
        try {
            const { eventoId } = req.params;
            const { musicas_id } = req.body;

            if (!musicas_id) {
                return res.status(400).json({ errors: ["ID da música é obrigatório"] });
            }

            const existente = await prisma.eventos_Musicas.findUnique({
                where: { evento_id_musicas_id: { evento_id: eventoId, musicas_id } }
            });

            if (existente) {
                return res.status(409).json({ errors: ["Registro duplicado"] });
            }

            await prisma.eventos_Musicas.create({
                data: { evento_id: eventoId, musicas_id }
            });

            return res.status(201).json({ msg: "Música adicionada ao evento com sucesso" });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao adicionar música ao evento"] });
        }
    }

    async removeMusica(req, res) {
        try {
            const { eventoId, musicaId } = req.params;

            const registro = await prisma.eventos_Musicas.findUnique({
                where: { evento_id_musicas_id: { evento_id: eventoId, musicas_id: musicaId } }
            });

            if (!registro) {
                return res.status(404).json({ errors: ["Registro não encontrado"] });
            }

            await prisma.eventos_Musicas.delete({ where: { id: registro.id } });
            return res.status(200).json({ msg: "Música removida do evento com sucesso" });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao remover música do evento"] });
        }
    }

    // --- Junction: Integrantes (eventos_integrantes) ---

    async listIntegrantes(req, res) {
        try {
            const { eventoId } = req.params;

            const integrantes = await prisma.eventos_Integrantes.findMany({
                where: { evento_id: eventoId },
                select: {
                    eventos_integrantes_musico_id_fkey: {
                        select: {
                            id: true,
                            nome: true,
                            Integrantes_Funcoes: {
                                select: {
                                    integrantes_funcoes_funcao_id_fkey: {
                                        select: { id: true, nome: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return res.status(200).json(integrantes.map(i => {
                const integrante = i.eventos_integrantes_musico_id_fkey;
                return {
                    id: integrante.id,
                    nome: integrante.nome,
                    funcoes: integrante.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey)
                };
            }));
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao buscar integrantes do evento"] });
        }
    }

    async addIntegrante(req, res) {
        try {
            const { eventoId } = req.params;
            const { musico_id } = req.body;

            if (!musico_id) {
                return res.status(400).json({ errors: ["ID do integrante é obrigatório"] });
            }

            const existente = await prisma.eventos_Integrantes.findUnique({
                where: { evento_id_musico_id: { evento_id: eventoId, musico_id } }
            });

            if (existente) {
                return res.status(409).json({ errors: ["Registro duplicado"] });
            }

            await prisma.eventos_Integrantes.create({
                data: { evento_id: eventoId, musico_id }
            });

            return res.status(201).json({ msg: "Integrante adicionado ao evento com sucesso" });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao adicionar integrante ao evento"] });
        }
    }

    async removeIntegrante(req, res) {
        try {
            const { eventoId, integranteId } = req.params;

            const registro = await prisma.eventos_Integrantes.findUnique({
                where: { evento_id_musico_id: { evento_id: eventoId, musico_id: integranteId } }
            });

            if (!registro) {
                return res.status(404).json({ errors: ["Registro não encontrado"] });
            }

            await prisma.eventos_Integrantes.delete({ where: { id: registro.id } });
            return res.status(200).json({ msg: "Integrante removido do evento com sucesso" });
        } catch (error) {
            return res.status(500).json({ errors: ["Erro ao remover integrante do evento"] });
        }
    }
}

export default new eventoController();
