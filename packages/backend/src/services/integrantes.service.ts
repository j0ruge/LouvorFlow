import bcrypt from 'bcryptjs';
import { AppError } from '../errors/AppError.js';
import integrantesRepository from '../repositories/integrantes.repository.js';
import type { CreateIntegranteInput, UpdateIntegranteInput, IntegranteWithFuncoes } from '../types/index.js';

const SALT_ROUNDS = 12;

/**
 * Mapeia um user do banco para o formato de resposta de integrante (português).
 * `name` → `nome`, `Users_Funcoes` → `funcoes[]` achatado.
 *
 * @param user - User com funções retornado pelo repository
 * @returns Objeto com campos em português para retrocompatibilidade da API
 */
function mapUserToIntegrante(user: IntegranteWithFuncoes) {
    return {
        id: user.id,
        nome: user.name,
        email: user.email,
        telefone: user.telefone,
        funcoes: user.Users_Funcoes.map(f => f.users_funcoes_funcao_id_fkey),
    };
}

/**
 * Mapeia o resultado de create/update (sem funções) para formato de resposta.
 *
 * @param user - User retornado pelo repository (campos públicos)
 * @returns Objeto com `name` mapeado para `nome`
 */
function mapPublicUserToIntegrante(user: { id: string; name: string; email: string; telefone: string | null }) {
    return {
        id: user.id,
        nome: user.name,
        email: user.email,
        telefone: user.telefone,
    };
}

/**
 * Service de integrantes — opera sobre o model Users com mapeamento de campos.
 * Input: campos em português (nome, senha). Output: campos em português (nome, funcoes[]).
 * Internamente: opera sobre Users (name, password).
 */
class IntegrantesService {
    /**
     * Lista todos os integrantes (users) com suas funções mapeadas.
     *
     * @returns Lista de integrantes com campo `funcoes` achatado e `nome` mapeado
     */
    async listAll() {
        const users = await integrantesRepository.findAll();
        return users.map((u: IntegranteWithFuncoes) => mapUserToIntegrante(u));
    }

    /**
     * Busca um integrante (user) pelo ID, incluindo suas funções.
     *
     * @param id - UUID do user
     * @returns Integrante com funções mapeadas
     * @throws AppError 400 se o ID não for informado
     * @throws AppError 404 se o integrante não existir
     */
    async getById(id: string) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const user = await integrantesRepository.findById(id);
        if (!user) throw new AppError("O integrante não foi encontrado ou não existe", 404);

        return mapUserToIntegrante(user as IntegranteWithFuncoes);
    }

    /**
     * Cria um novo integrante (user) com senha hasheada.
     * O user criado pode fazer login via `/api/sessions`.
     *
     * @param body - Dados de criação (nome, email, senha, telefone)
     * @returns Integrante criado (sem campo senha)
     * @throws AppError 400 se dados obrigatórios estiverem ausentes
     * @throws AppError 409 se já existir user com o mesmo email
     */
    async create(body: CreateIntegranteInput) {
        const { nome, email, senha, telefone } = body;

        if (!nome || !email || !senha) {
            throw new AppError("Dados não enviados", 400);
        }

        const existente = await integrantesRepository.findByEmail(email);
        if (existente) throw new AppError("Já existe um integrante com esse email", 409);

        const passwordHash = await bcrypt.hash(senha, SALT_ROUNDS);

        const user = await integrantesRepository.create({
            name: nome, email, password: passwordHash, telefone: telefone || null
        });

        return mapPublicUserToIntegrante(user);
    }

    /**
     * Atualiza os dados de um integrante (user) existente.
     *
     * @param id - UUID do user a atualizar
     * @param body - Campos a atualizar em português (nome, email, senha, telefone)
     * @returns Integrante atualizado (sem campo senha)
     * @throws AppError 400 se o ID ou body estiverem vazios
     * @throws AppError 404 se o integrante não existir
     * @throws AppError 409 se o novo email já pertencer a outro user
     */
    async update(id: string, body: UpdateIntegranteInput) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const existente = await integrantesRepository.findByIdSimple(id);
        if (!existente) throw new AppError("Integrante com esse ID não existe ou não foi encontrado", 404);

        if (Object.keys(body).length === 0) {
            throw new AppError("Nenhum dado enviado", 400);
        }

        const { nome, email, senha, telefone } = body;

        if (email !== undefined) {
            const duplicado = await integrantesRepository.findByEmailExcludingId(email, id);
            if (duplicado) throw new AppError("Já existe um integrante com esse email", 409);
        }

        const updateData: { name?: string; email?: string; password?: string; telefone?: string | null } = {};
        if (nome !== undefined) updateData.name = nome;
        if (email !== undefined) updateData.email = email;
        if (telefone !== undefined) updateData.telefone = telefone;

        if (senha) {
            updateData.password = await bcrypt.hash(senha, SALT_ROUNDS);
        }

        const user = await integrantesRepository.update(id, updateData);
        return mapPublicUserToIntegrante(user);
    }

    /**
     * Remove um integrante (user) pelo ID.
     *
     * @param id - UUID do user a remover
     * @returns Dados públicos do integrante removido
     * @throws AppError 400 se o ID não for informado
     * @throws AppError 404 se o integrante não existir
     */
    async delete(id: string) {
        if (!id) throw new AppError("ID de integrante não enviado", 400);

        const user = await integrantesRepository.findByIdPublic(id);
        if (!user) throw new AppError("O integrante não foi encontrado ou não existe", 404);

        await integrantesRepository.delete(id);
        return mapPublicUserToIntegrante(user);
    }

    /**
     * Lista as funções musicais atribuídas a um integrante (user).
     *
     * @param integranteId - UUID do user
     * @returns Lista de funções com id e nome
     */
    async listFuncoes(integranteId: string) {
        const funcoes = await integrantesRepository.findFuncoesByIntegranteId(integranteId);
        return funcoes.map(f => f.users_funcoes_funcao_id_fkey);
    }

    /**
     * Vincula uma função musical a um integrante (user).
     *
     * @param integranteId - UUID do user
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
     * Remove o vínculo entre um integrante (user) e uma função musical.
     *
     * @param integranteId - UUID do user
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
