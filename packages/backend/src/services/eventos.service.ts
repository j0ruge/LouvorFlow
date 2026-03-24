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
        integrantes: e.Eventos_Users.map(i => {
            const user = i.eventos_users_fk_user_id_fkey;
            return { id: user.id, nome: user.name };
        })
    };
}

/**
 * Converte um registro bruto de evento no formato detalhado para exibição (show).
 *
 * Funções do integrante vêm da tabela `Eventos_Users_Funcoes` (seleção por evento),
 * não mais de `Users_Funcoes` (funções globais).
 *
 * @param e - Registro bruto do evento (EventoShowRaw)
 * @returns Objeto formatado com músicas e integrantes com funções do evento
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
                tonalidade: musica.musicas_fk_tonalidade_fkey,
                ordem: m.ordem
            };
        }),
        integrantes: e.Eventos_Users.map(i => {
            const user = i.eventos_users_fk_user_id_fkey;
            return {
                id: user.id,
                nome: user.name,
                funcoes: i.Eventos_Users_Funcoes.map(f => f.eventos_users_funcoes_funcao_fkey)
            };
        })
    };
}

class EventosService {
    // --- Base CRUD ---

    /** Lista todos os eventos formatados para exibição em listagem. */
    async listAll() {
        const eventos = await eventosRepository.findAll();
        return eventos.map(formatEventoIndex);
    }

    /** Retorna um evento detalhado pelo ID, incluindo músicas e integrantes com funções. */
    async getById(id: string) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findById(id);
        if (!evento) throw new AppError("O evento não foi encontrado ou não existe", 404);

        return formatEventoShow(evento);
    }

    /**
     * Cria um novo evento vinculado ao tenant informado.
     *
     * @param body - Dados do evento (data, fk_tipo_evento, descricao)
     * @param tenantId - ID do tenant ao qual o evento pertence
     * @returns Evento criado com tipo de evento populado
     */
    async create(body: { data?: string; fk_tipo_evento?: string; descricao?: string }, tenantId: string) {
        const { data, fk_tipo_evento, descricao } = body;
        const errors: string[] = [];

        if (!data) errors.push("Data do evento é obrigatória");
        if (!fk_tipo_evento) errors.push("Tipo de evento é obrigatório");

        if (data && isNaN(Date.parse(String(data)))) {
            errors.push("Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)");
        }

        if (data && !isNaN(Date.parse(String(data)))) {
            const parsedYear = new Date(data).getFullYear();
            if (parsedYear < 1900 || parsedYear > 9999) {
                errors.push("Ano da data do evento deve estar entre 1900 e 9999");
            }
        }

        if (errors.length > 0) throw new AppError(errors[0], 400, errors);

        const parsedDate = new Date(data!);

        const evento = await eventosRepository.create({
            data: parsedDate,
            fk_tipo_evento: fk_tipo_evento!,
            descricao: descricao ?? ""
        }, tenantId);

        return {
            id: evento.id,
            data: evento.data,
            descricao: evento.descricao,
            tipoEvento: evento.eventos_fk_tipo_evento_fkey
        };
    }

    /** Atualiza um evento existente pelo ID com os campos informados. */
    async update(id: string, body: { data?: string; fk_tipo_evento?: string; descricao?: string }) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const existente = await eventosRepository.findByIdSimple(id);
        if (!existente) throw new AppError("O evento não foi encontrado ou não existe", 404);

        const { data, fk_tipo_evento, descricao } = body;

        if (data !== undefined && isNaN(Date.parse(String(data)))) {
            throw new AppError("Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)", 400);
        }

        if (data !== undefined && !isNaN(Date.parse(String(data)))) {
            const parsedYear = new Date(data).getFullYear();
            if (parsedYear < 1900 || parsedYear > 9999) {
                throw new AppError("Ano da data do evento deve estar entre 1900 e 9999", 400);
            }
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

    /** Remove um evento existente pelo ID. */
    async delete(id: string) {
        if (!id) throw new AppError("ID de evento não enviado", 400);

        const evento = await eventosRepository.findByIdForDelete(id);
        if (!evento) throw new AppError("O evento não foi encontrado ou não existe", 404);

        await eventosRepository.delete(id);
        return evento;
    }

    // --- Musicas ---

    /** Lista as músicas vinculadas a um evento com tonalidade e posição, ordenadas por ordem. */
    async listMusicas(eventoId: string) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musicas = await eventosRepository.findMusicas(eventoId);
        return musicas.map(m => {
            const musica = m.eventos_musicas_musicas_id_fkey;
            return {
                id: musica.id,
                nome: musica.nome,
                tonalidade: musica.musicas_fk_tonalidade_fkey,
                ordem: m.ordem
            };
        });
    }

    /**
     * Vincula uma música a um evento no tenant informado.
     *
     * @param eventoId - ID do evento
     * @param musicas_id - ID da música a vincular
     * @param tenantId - ID do tenant ao qual o vínculo pertence
     */
    async addMusica(eventoId: string, musicas_id: string | undefined, tenantId: string) {
        if (!musicas_id) throw new AppError("ID da música é obrigatório", 400);

        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musica = await eventosRepository.findMusicaById(musicas_id);
        if (!musica) throw new AppError("Música não encontrada", 404);

        const existente = await eventosRepository.findMusicaDuplicate(eventoId, musicas_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await eventosRepository.createMusica(eventoId, musicas_id, tenantId);
    }

    /**
     * Remove o vínculo entre um evento e uma música.
     * Após a remoção, recalcula a ordem das músicas restantes para manter sequência contínua.
     */
    async removeMusica(eventoId: string, musicaId: string) {
        const registro = await eventosRepository.findMusicaDuplicate(eventoId, musicaId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await eventosRepository.deleteMusica(registro.id);

        const remaining = await eventosRepository.findMusicas(eventoId);
        if (remaining.length > 0) {
            const orderedIds = remaining.map(m => m.eventos_musicas_musicas_id_fkey.id);
            await eventosRepository.reorderMusicas(eventoId, orderedIds);
        }
    }

    /**
     * Reordena as músicas de um evento conforme a ordem dos IDs recebidos.
     * Valida que o evento existe e que os IDs correspondem exatamente às músicas vinculadas.
     *
     * @param eventoId - ID do evento
     * @param musicasIds - Array de IDs de músicas na nova ordem desejada
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     * @throws {AppError} 400 — Se os IDs não corresponderem às músicas do evento
     */
    async reorderMusicas(eventoId: string, musicasIds: string[]) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const musicas = await eventosRepository.findMusicas(eventoId);
        const currentIds = new Set(musicas.map(m => m.eventos_musicas_musicas_id_fkey.id));
        const newIds = new Set(musicasIds);

        if (currentIds.size !== newIds.size || musicasIds.length !== currentIds.size) {
            throw new AppError("A lista de músicas não corresponde às músicas do evento", 400);
        }

        for (const id of musicasIds) {
            if (!currentIds.has(id)) {
                throw new AppError("A lista de músicas não corresponde às músicas do evento", 400);
            }
        }

        await eventosRepository.reorderMusicas(eventoId, musicasIds);
    }

    // --- Integrantes ---

    /**
     * Lista os integrantes vinculados a um evento com funções selecionadas para o evento.
     *
     * @param eventoId - ID do evento
     * @returns Array de integrantes com `id`, `nome` e `funcoes` selecionadas para o evento
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     */
    async listIntegrantes(eventoId: string) {
        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const integrantes = await eventosRepository.findIntegrantes(eventoId);
        return integrantes.map(i => {
            const user = i.eventos_users_fk_user_id_fkey;
            return {
                id: user.id,
                nome: user.name,
                funcoes: i.Eventos_Users_Funcoes.map(f => f.eventos_users_funcoes_funcao_fkey)
            };
        });
    }

    /**
     * Adiciona um integrante a um evento com funções selecionadas.
     *
     * Se `funcao_ids` não for fornecido (ou for `null`), todas as funções globais do integrante serão usadas.
     * Se `funcao_ids` for um array vazio (`[]`), nenhuma função será vinculada ao registro do evento.
     * Se fornecido com itens, valida que cada ID pertence às funções globais do integrante.
     *
     * @param eventoId - ID do evento
     * @param fk_integrante_id - ID do integrante a ser adicionado
     * @param funcao_ids - IDs das funções selecionadas (opcional — usa todas se omitido/null e nenhuma se array vazio)
     * @param tenantId - ID do tenant ao qual os registros pertencem
     * @throws {AppError} 400 — "ID do integrante é obrigatório" se `fk_integrante_id` não for informado
     * @throws {AppError} 400 — "Função inválida" se algum `funcao_id` não pertence ao integrante
     * @throws {AppError} 404 — "Evento não encontrado" se o evento não existir
     * @throws {AppError} 404 — "Integrante não encontrado" se o integrante não existir
     * @throws {AppError} 409 — "Registro duplicado" se o vínculo já existir
     */
    async addIntegrante(eventoId: string, fk_integrante_id: string | undefined, funcao_ids: string[] | undefined, tenantId: string) {
        if (!fk_integrante_id) throw new AppError("ID do integrante é obrigatório", 400);

        const evento = await eventosRepository.findByIdSimple(eventoId);
        if (!evento) throw new AppError("Evento não encontrado", 404);

        const integrante = await eventosRepository.findIntegranteById(fk_integrante_id);
        if (!integrante) throw new AppError("Integrante não encontrado", 404);

        const existente = await eventosRepository.findIntegranteDuplicate(eventoId, fk_integrante_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        const userFuncoes = await eventosRepository.findUserFuncoes(fk_integrante_id);
        const userFuncaoIds = new Set(userFuncoes.map(f => f.funcao_id));

        let selectedFuncaoIds: string[];
        if (funcao_ids == null) {
            selectedFuncaoIds = Array.from(userFuncaoIds);
        } else if (funcao_ids.length === 0) {
            selectedFuncaoIds = [];
        } else {
            const invalidas = funcao_ids.filter(id => !userFuncaoIds.has(id));
            if (invalidas.length > 0) {
                throw new AppError("Função inválida: não pertence ao integrante", 400);
            }
            selectedFuncaoIds = funcao_ids;
        }

        await eventosRepository.createIntegrante(eventoId, fk_integrante_id, selectedFuncaoIds, tenantId);
    }

    /** Remove o vínculo entre um evento e um integrante. */
    async removeIntegrante(eventoId: string, integranteId: string) {
        const registro = await eventosRepository.findIntegranteDuplicate(eventoId, integranteId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await eventosRepository.deleteIntegrante(registro.id);
    }
}

export default new EventosService();
