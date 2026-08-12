import { AppError } from '../errors/AppError.js';
import { comBarreiraDeDuplicidade } from '../utils/duplicidade.js';
import funcoesGruposRepository from '../repositories/funcoes-grupos.repository.js';

/** Formato de um grupo conforme retornado pelo repositório (relação Prisma `Funcoes`). */
type GrupoPrisma = {
    id: string;
    nome: string;
    ordem: number;
    Funcoes: { id: string; nome: string }[];
};

/**
 * Converte o grupo do formato Prisma para o contrato da API,
 * achatando a relação `Funcoes` para a chave `funcoes`.
 *
 * @param grupo - Grupo como retornado pelo repositório.
 * @returns Grupo no formato `{ id, nome, ordem, funcoes }`.
 */
function toApiShape(grupo: GrupoPrisma) {
    const { Funcoes, ...resto } = grupo;
    return { ...resto, funcoes: Funcoes };
}

/**
 * Regras de negócio dos grupos de funções.
 *
 * Grupos organizam as funções por papel (Ministração, Vocal, Instrumentos...)
 * e definem, pela `ordem`, a sequência dos blocos de integrantes na mensagem
 * de compartilhamento da escala.
 */
class FuncoesGruposService {
    /**
     * Lista todos os grupos do tenant com suas funções.
     *
     * @returns Grupos ordenados por `ordem` crescente.
     */
    async listAll() {
        const grupos = await funcoesGruposRepository.findAll();
        return grupos.map(toApiShape);
    }

    /**
     * Cria um grupo no fim da sequência (ordem = maior existente + 1).
     *
     * @param nome - Nome do grupo.
     * @param tenantId - UUID do tenant ativo.
     * @returns Grupo criado.
     * @throws AppError 400 se nome ausente; 409 se nome duplicado no tenant.
     */
    async create(nome: string | undefined, tenantId: string) {
        if (!nome) throw new AppError("Nome do grupo é obrigatório", 400);

        const existente = await funcoesGruposRepository.findByNome(nome);
        if (existente) throw new AppError("Já existe um grupo com esse nome", 409);

        const ordem = await funcoesGruposRepository.maxOrdem() + 1;
        const grupo = await comBarreiraDeDuplicidade(
            "Já existe um grupo com esse nome",
            () => funcoesGruposRepository.create(nome, tenantId, ordem),
        );
        return toApiShape(grupo);
    }

    /**
     * Renomeia um grupo existente.
     *
     * @param id - UUID do grupo.
     * @param nome - Novo nome.
     * @returns Grupo atualizado.
     * @throws AppError 400 se id/nome ausentes; 404 se não existir; 409 se nome duplicado.
     */
    async update(id: string, nome?: string) {
        if (!id) throw new AppError("ID de grupo não enviado", 400);

        const existente = await funcoesGruposRepository.findById(id);
        if (!existente) throw new AppError("Grupo com esse ID não existe ou não foi encontrado", 404);

        if (!nome) throw new AppError("Nome do grupo é obrigatório", 400);

        const duplicado = await funcoesGruposRepository.findByNomeExcludingId(nome, id);
        if (duplicado) throw new AppError("Nome de grupo já existe", 409);

        const grupo = await comBarreiraDeDuplicidade(
            "Nome de grupo já existe",
            () => funcoesGruposRepository.update(id, nome),
        );
        return toApiShape(grupo);
    }

    /**
     * Remove um grupo. As funções que pertenciam a ele ficam sem grupo.
     *
     * @param id - UUID do grupo.
     * @returns Grupo removido, como estava antes da exclusão.
     * @throws AppError 400 se id ausente; 404 se não existir.
     */
    async delete(id: string) {
        if (!id) throw new AppError("ID de grupo não enviado", 400);

        const grupo = await funcoesGruposRepository.findById(id);
        if (!grupo) throw new AppError("O grupo não foi encontrado ou não existe", 404);

        await funcoesGruposRepository.delete(id);
        return toApiShape(grupo);
    }

    /**
     * Reordena os grupos conforme a ordem dos IDs recebidos.
     * Exige a lista completa: reordenar é uma operação sobre o conjunto inteiro,
     * e aceitar um subconjunto deixaria posições ambíguas.
     *
     * @param gruposIds - UUIDs dos grupos na nova ordem desejada.
     * @throws AppError 400 se os IDs não corresponderem exatamente aos grupos do tenant.
     */
    async reorder(gruposIds: string[]) {
        const grupos = await funcoesGruposRepository.findAll();
        const currentIds = new Set(grupos.map(g => g.id));

        if (gruposIds.length !== currentIds.size) {
            throw new AppError("A lista de grupos não corresponde aos grupos cadastrados", 400);
        }

        for (const id of gruposIds) {
            if (!currentIds.has(id)) {
                throw new AppError("A lista de grupos não corresponde aos grupos cadastrados", 400);
            }
        }

        await funcoesGruposRepository.reorder(gruposIds);
    }

    /**
     * Define quais funções pertencem a um grupo, substituindo o conjunto atual.
     *
     * @param id - UUID do grupo.
     * @param funcoesIds - UUIDs das funções que devem pertencer ao grupo (pode ser vazio).
     * @returns Grupo atualizado com suas funções.
     * @throws AppError 400 se id ausente ou alguma função não existir; 404 se o grupo não existir.
     */
    async setFuncoes(id: string, funcoesIds: string[]) {
        if (!id) throw new AppError("ID de grupo não enviado", 400);

        const grupo = await funcoesGruposRepository.findById(id);
        if (!grupo) throw new AppError("O grupo não foi encontrado ou não existe", 404);

        if (funcoesIds.length > 0) {
            const encontradas = await funcoesGruposRepository.findFuncoesByIds(funcoesIds);
            if (encontradas.length !== funcoesIds.length) {
                throw new AppError("Uma ou mais funções não foram encontradas", 400);
            }
        }

        await funcoesGruposRepository.setFuncoes(id, funcoesIds);

        const atualizado = await funcoesGruposRepository.findById(id);
        return toApiShape(atualizado!);
    }
}

export default new FuncoesGruposService();
