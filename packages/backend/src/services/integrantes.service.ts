import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../errors/AppError.js';
import integrantesRepository from '../repositories/integrantes.repository.js';
import type { CreateIntegranteInput, UpdateIntegranteInput, IntegranteWithFuncoes } from '../types/index.js';

class IntegrantesService {
    /**
     * Lista todos os integrantes com suas funções mapeadas.
     *
     * @returns Lista de integrantes com campo `funcoes` achatado
     */
    async listAll() {
        const integrantes = await integrantesRepository.findAll();
        return integrantes.map((i: IntegranteWithFuncoes) => ({
            ...i,
            funcoes: i.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey),
            Integrantes_Funcoes: undefined
        }));
    }

    /**
     * Busca um integrante pelo ID, incluindo suas funções.
     *
     * @param id - UUID do integrante
     * @returns Integrante com funções mapeadas
     * @throws AppError 400 se o ID não for informado
     * @throws AppError 404 se o integrante não existir
     */
    async getById(id: string) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const integrante = await integrantesRepository.findById(id);
        if (!integrante) throw new AppError("O integrante não foi encontrado ou não existe", 404);

        return {
            ...integrante,
            funcoes: integrante.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey),
            Integrantes_Funcoes: undefined
        };
    }

    /**
     * Cria um novo integrante com senha hasheada.
     *
     * @param body - Dados de criação do integrante
     * @returns Integrante criado (sem campo senha)
     * @throws AppError 400 se dados obrigatórios estiverem ausentes
     * @throws AppError 409 se já existir integrante com o mesmo email
     */
    async create(body: CreateIntegranteInput) {
        const { nome, email, senha, telefone } = body;

        if (!nome || !email || !senha) {
            throw new AppError("Dados não enviados", 400);
        }

        const integranteExistente = await integrantesRepository.findByEmail(email);
        if (integranteExistente) throw new AppError("Já existe um integrante com esse email", 409);

        const SALT_ROUNDS = 12;
        const passwordHash = await bcrypt.hash(senha, SALT_ROUNDS);

        return integrantesRepository.create({
            nome, email, senha: passwordHash, telefone: telefone || null
        });
    }

    /**
     * Atualiza os dados de um integrante existente.
     *
     * @param id - UUID do integrante a atualizar
     * @param body - Campos a atualizar (apenas os enviados são modificados)
     * @returns Integrante atualizado (sem campo senha)
     * @throws AppError 400 se o ID ou body estiverem vazios
     * @throws AppError 404 se o integrante não existir
     * @throws AppError 409 se o novo email já pertencer a outro integrante
     */
    async update(id: string, body: UpdateIntegranteInput) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const integranteExistente = await integrantesRepository.findByIdSimple(id);
        if (!integranteExistente) throw new AppError("Integrante com esse ID não existe ou não foi encontrado", 404);

        if (Object.keys(body).length === 0) {
            throw new AppError("Nenhum dado enviado", 400);
        }

        const { nome, email, senha, telefone } = body;

        if (email !== undefined) {
            const duplicado = await integrantesRepository.findByEmailExcludingId(email, id);
            if (duplicado) throw new AppError("Já existe um integrante com esse email", 409);
        }

        const updateData: Prisma.IntegrantesUpdateInput = {};
        if (nome !== undefined) updateData.nome = nome;
        if (email !== undefined) updateData.email = email;
        if (telefone !== undefined) updateData.telefone = telefone;

        if (senha) {
            const SALT_ROUNDS = 12;
            updateData.senha = await bcrypt.hash(senha, SALT_ROUNDS);
        }

        return integrantesRepository.update(id, updateData);
    }

    /**
     * Remove um integrante pelo ID.
     *
     * @param id - UUID do integrante a remover
     * @returns Dados públicos do integrante removido
     * @throws AppError 400 se o ID não for informado
     * @throws AppError 404 se o integrante não existir
     */
    async delete(id: string) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const integrante = await integrantesRepository.findByIdPublic(id);
        if (!integrante) throw new AppError("O integrante não foi encontrado ou não existe", 404);

        await integrantesRepository.delete(id);
        return integrante;
    }

    /**
     * Lista as funções atribuídas a um integrante.
     *
     * @param integranteId - UUID do integrante
     * @returns Lista de funções com id e nome
     */
    async listFuncoes(integranteId: string) {
        const funcoes = await integrantesRepository.findFuncoesByIntegranteId(integranteId);
        return funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey);
    }

    /**
     * Vincula uma função a um integrante.
     *
     * @param integranteId - UUID do integrante
     * @param funcao_id - UUID da função a vincular
     * @throws AppError 400 se o ID da função não for informado
     * @throws AppError 404 se integrante ou função não existirem
     * @throws AppError 409 se o vínculo já existir
     */
    async addFuncao(integranteId: string, funcao_id?: string) {
        if (!funcao_id) throw new AppError("ID da função é obrigatório", 400);

        const integranteExiste = await integrantesRepository.findByIdSimple(integranteId);
        if (!integranteExiste) throw new AppError("Integrante não encontrado", 404);

        const funcaoExiste = await integrantesRepository.findFuncaoById(funcao_id);
        if (!funcaoExiste) throw new AppError("Função não encontrada", 404);

        const existente = await integrantesRepository.findIntegranteFuncao(integranteId, funcao_id);
        if (existente) throw new AppError("Registro duplicado", 409);

        await integrantesRepository.createIntegranteFuncao(integranteId, funcao_id);
    }

    /**
     * Remove o vínculo entre um integrante e uma função.
     *
     * @param integranteId - UUID do integrante
     * @param funcaoId - UUID da função a desvincular
     * @throws AppError 404 se o vínculo não existir
     */
    async removeFuncao(integranteId: string, funcaoId: string) {
        const registro = await integrantesRepository.findIntegranteFuncao(integranteId, funcaoId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await integrantesRepository.deleteIntegranteFuncao(registro.id);
    }
}

export default new IntegrantesService();
