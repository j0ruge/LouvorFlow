import type { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import eventosRepository from '../repositories/eventos.repository.js';
import type { EventoIndexRaw, EventoShowRaw } from '../types/index.js';

/**
 * Converte um registro bruto de evento no formato simplificado para listagem (index).
 *
 * @param e - Registro bruto do evento (EventoIndexRaw), incluindo as relações `Eventos_Musicas` e `Eventos_Integrantes`
 * @returns Objeto com `id`, `data`, `descricao`, `tipoEvento`, `musicas` (array de objetos com id e nome) e `integrantes` (array de objetos com id e nome)
 */
function formatEventoIndex(e: EventoIndexRaw) {
    return {
        id: e.id,
        data: e.data,
        descricao: e.descricao,
        tipoEvento: e.eventos_fk_tipo_evento_fkey,
        musicas: e.Eventos_Musicas.map(m => m.eventos_musicas_musicas_id_fkey),
        integrantes: e.Eventos_Integrantes.map(i => i.eventos_integrantes_fk_integrante_id_fkey)
    };
}

/**
 * Converte um registro bruto de evento no formato detalhado para exibição (show).
 *
 * @param e - Registro bruto do evento (EventoShowRaw), incluindo as relações `Eventos_Musicas` e `Eventos_Integrantes`
 * @returns Objeto com `id`, `data`, `descricao`, `tipoEvento`, `musicas` (array de `{ id, nome, tonalidade }`) e `integrantes` (array de `{ id, nome, funcoes }` onde `funcoes` é um array de IDs de funções)
 */
function formatEventoShow(e: EventoShowRaw) {
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
            const integrante = i.eventos_integrantes_fk_integrante_id_fkey;
            return {
                id: integrante.id,
                nome: integrante.nome,
                funcoes: integrante.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey)
            };
        })
    };
}

class EventosService {
    // --- Base CRUD ---

    async listAll() {
        const eventos = await eventosRepository.findAll();
        return eventos.map(formatEventoIndex);
    }

    async getById(id: string) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findById(id);
        if (!evento) throw new AppError("O evento não foi encontrado ou não existe", 404);

        return formatEventoShow(evento);
    }

    async create(body: { data?: string; fk_tipo_evento?: string; descricao?: string }) {
        const { data, fk_tipo_evento, descricao } = body;
        const errors: string[] = [];

        if (!data) errors.push("Data do evento é obrigatória");
        if (!fk_tipo_evento) errors.push("Tipo de evento é obrigatório");
        if (!descricao) errors.push("Descrição do evento é obrigatória");

        if (data && isNaN(Date.parse(String(data)))) {
            errors.push("Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)");
        }

        if (errors.length > 0) throw new AppError(errors[0], 400, errors);

        const parsedDate = new Date(data!);

        const evento = await eventosRepository.create({
            data: parsedDate,
            fk_tipo_evento: fk_tipo_evento!,
            descricao: descricao!
        });

        return {
            id: evento.id,
            data: evento.data,
            descricao: evento.descricao,
            tipoEvento: evento.eventos_fk_tipo_evento_fkey
        };
    }

    async update(id: string, body: { data?: string; fk_tipo_evento?: string; descricao?: string }) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const existente = await eventosRepository.findByIdSimple(id);
        if (!existente) throw new AppError("O evento não foi encontrado ou não existe", 404);

        const { data, fk_tipo_evento, descricao } = body;

        if (data !== undefined && isNaN(Date.parse(String(data)))) {
            throw new AppError("Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)", 400);
        }

        const updateData: Prisma.EventosUncheckedUpdateInput = {};
        if (data !== undefined) updateData.data = new Date(data);
        if (fk_tipo_evento !== undefined) updateData.fk_tipo_evento = fk_tipo_evento;
        if (descricao !== undefined) updateData.descricao = descricao;

        if (Object.keys(updateData).length === 0) {
            throw new AppError("Ao menos um campo deve ser enviado para atualização", 400);
        }

        const evento = await eventosRepository.update(id, updateData);

        return {
            id: evento.id,
            data: evento.data,
            descricao: evento.descricao,
            tipoEvento: evento.eventos_fk_tipo_evento_fkey
        };
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findByIdForDelete(id);
        if (!evento) throw new AppError("O evento não foi encontrado ou não existe", 404);

        await eventosRepository.delete(id);
        return evento;
    }

    // --- Musicas ---

    async listMusicas(eventoId: string) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musicas = await eventosRepository.findMusicas(eventoId);
        return musicas.map(m => {
            const musica = m.eventos_musicas_musicas_id_fkey;
            return {
                id: musica.id,
                nome: musica.nome,
                tonalidade: musica.musicas_fk_tonalidade_fkey
            };
        });
    }

    async addMusica(eventoId: string, musicas_id?: string) {
        if (!musicas_id) throw new AppError("ID da música é obrigatório", 400);

        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musica = await eventosRepository.findMusicaById(musicas_id);
        if (!musica) throw new AppError("Música não encontrada", 404);

        const existente = await eventosRepository.findMusicaDuplicate(eventoId, musicas_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await eventosRepository.createMusica(eventoId, musicas_id);
    }

    async removeMusica(eventoId: string, musicaId: string) {
        const registro = await eventosRepository.findMusicaDuplicate(eventoId, musicaId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await eventosRepository.deleteMusica(registro.id);
    }

    // --- Integrantes ---

    /**
     * Lista os integrantes vinculados a um evento, incluindo suas funções.
     *
     * @param eventoId - ID do evento
     * @returns Array de integrantes com `id`, `nome` e `funcoes` (array de IDs de funções)
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     */
    async listIntegrantes(eventoId: string) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const integrantes = await eventosRepository.findIntegrantes(eventoId);
        return integrantes.map(i => {
            const integrante = i.eventos_integrantes_fk_integrante_id_fkey;
            return {
                id: integrante.id,
                nome: integrante.nome,
                funcoes: integrante.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey)
            };
        });
    }

    /**
     * Adiciona um integrante a um evento.
     *
     * @param eventoId - ID do evento
     * @param fk_integrante_id - ID do integrante a ser adicionado (opcional, lança erro se ausente)
     * @throws {AppError} 400 — "ID do integrante é obrigatório" se `fk_integrante_id` não for informado
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     * @throws {AppError} 404 — "Integrante não encontrado" se o integrante não existir
     * @throws {AppError} 409 — "Registro duplicado" se o vínculo já existir
     */
    async addIntegrante(eventoId: string, fk_integrante_id?: string) {
        if (!fk_integrante_id) throw new AppError("ID do integrante é obrigatório", 400);

        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const integrante = await eventosRepository.findIntegranteById(fk_integrante_id);
        if (!integrante) throw new AppError("Integrante não encontrado", 404);

        const existente = await eventosRepository.findIntegranteDuplicate(eventoId, fk_integrante_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await eventosRepository.createIntegrante(eventoId, fk_integrante_id);
    }

    async removeIntegrante(eventoId: string, integranteId: string) {
        const registro = await eventosRepository.findIntegranteDuplicate(eventoId, integranteId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await eventosRepository.deleteIntegrante(registro.id);
    }
}

export default new EventosService();