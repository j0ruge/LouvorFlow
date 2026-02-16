import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../errors/AppError.js';
import integrantesRepository from '../repositories/integrantes.repository.js';
import type { IntegranteWithFuncoes } from '../types/index.js';

class IntegrantesService {
    async listAll() {
        const integrantes = await integrantesRepository.findAll();
        return integrantes.map((i: IntegranteWithFuncoes) => ({
            ...i,
            funcoes: i.Integrantes_Funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey),
            Integrantes_Funcoes: undefined
        }));
    }

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

    async create(body: { nome?: string; doc_id?: string; email?: string; senha?: string; telefone?: string }) {
        const { nome, email, senha, telefone } = body;
        const doc_id = body.doc_id?.replace(/\D/g, '');

        if (!nome || !doc_id || !email || !senha) {
            throw new AppError("Dados não enviados", 400);
        }

        const integranteExistente = await integrantesRepository.findByDocId(doc_id);
        if (integranteExistente) throw new AppError("Já existe um integrante com esse doc_id", 409);

        const SALT_ROUNDS = 12;
        const passwordHash = await bcrypt.hash(senha, SALT_ROUNDS);

        return integrantesRepository.create({
            nome, doc_id, email, senha: passwordHash, telefone: telefone || null
        });
    }

    async update(id: string, body: { nome?: string; doc_id?: string; email?: string; senha?: string; telefone?: string }) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const integranteExistente = await integrantesRepository.findByIdSimple(id);
        if (!integranteExistente) throw new AppError("Integrante com esse ID não existe ou não foi encontrado", 404);

        if (Object.keys(body).length === 0) {
            throw new AppError("Nenhum dado enviado", 400);
        }

        const { nome, email, senha, telefone } = body;
        const doc_id = body.doc_id !== undefined
            ? body.doc_id.replace(/\D/g, '')
            : undefined;

        if (doc_id !== undefined) {
            const duplicado = await integrantesRepository.findByDocIdExcludingId(doc_id, id);
            if (duplicado) throw new AppError("Já existe um integrante com esse doc_id", 409);
        }

        const updateData: Prisma.IntegrantesUpdateInput = {};
        if (nome !== undefined) updateData.nome = nome;
        if (doc_id !== undefined) updateData.doc_id = doc_id;
        if (email !== undefined) updateData.email = email;
        if (telefone !== undefined) updateData.telefone = telefone;

        if (senha) {
            const SALT_ROUNDS = 12;
            updateData.senha = await bcrypt.hash(senha, SALT_ROUNDS);
        }

        return integrantesRepository.update(id, updateData);
    }

    async delete(id: string) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const integrante = await integrantesRepository.findByIdPublic(id);
        if (!integrante) throw new AppError("O integrante não foi encontrado ou não existe", 404);

        await integrantesRepository.delete(id);
        return integrante;
    }

    async listFuncoes(integranteId: string) {
        const funcoes = await integrantesRepository.findFuncoesByIntegranteId(integranteId);
        return funcoes.map(f => f.integrantes_funcoes_funcao_id_fkey);
    }

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

    async removeFuncao(integranteId: string, funcaoId: string) {
        const registro = await integrantesRepository.findIntegranteFuncao(integranteId, funcaoId);
        if (!registro) throw new AppError("Registro não encontrado", 404);

        await integrantesRepository.deleteIntegranteFuncao(registro.id);
    }
}

export default new IntegrantesService();
