/**
 * Projeção Prisma compartilhada do usuário usado para emitir sessão.
 *
 * Os três caminhos que chamam `_generateSession` (login, seleção de igreja e
 * troca de igreja) precisam do mesmo usuário: senha + roles e permissões já
 * filtradas pelo tenant de destino. O `include` era repetido nos três arquivos,
 * e o tipo do parâmetro de `_generateSession` era uma interface escrita à mão
 * espelhando essa forma — quatro cópias que precisavam ser mantidas em sincronia
 * manualmente, sem o compilador reclamar quando divergissem.
 *
 * Aqui a projeção é declarada uma vez e o tipo é **derivado** dela, de modo que
 * mudar o `include` passa a ser um erro de compilação em quem consome o
 * resultado, em vez de uma divergência silenciosa.
 */
import type { Prisma } from '@prisma/client';
import { SYSTEM_TENANT_ID } from '../../../prisma/cliente.js';

/**
 * Monta o `include` do usuário com roles/permissões restritas ao tenant alvo.
 *
 * O tenant de sistema entra junto porque é nele que vivem as atribuições de
 * `super-admin` — sem ele, um super-admin perderia esse papel ao operar dentro
 * de uma igreja comum.
 *
 * @param tenantId - UUID do tenant cuja sessão será emitida
 * @returns Objeto `include` pronto para `prisma.users.findUnique`
 */
export function montarUserSessionInclude(tenantId: string) {
    return {
        roles: {
            where: { tenant_id: { in: [tenantId, SYSTEM_TENANT_ID] } },
            select: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        created_at: true,
                        updated_at: true,
                        permissions: {
                            select: {
                                permission: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        created_at: true,
                                        updated_at: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        permissions: {
            where: { tenant_id: { in: [tenantId, SYSTEM_TENANT_ID] } },
            select: {
                permission: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
            },
        },
    } satisfies Prisma.UsersInclude;
}

/**
 * Usuário com roles e permissões carregadas — derivado da projeção acima.
 *
 * Inclui o campo `password`, por isso nunca deve ser serializado direto na
 * resposta: `_generateSession` extrai apenas os campos públicos.
 */
export type UserComRelacoesDeSessao = Prisma.UsersGetPayload<{
    include: ReturnType<typeof montarUserSessionInclude>;
}>;
