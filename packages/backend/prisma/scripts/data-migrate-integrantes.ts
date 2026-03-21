// @ts-nocheck — Script de migração one-shot já executado.
// O model `integrantes` foi removido do schema (spec 018).
// Mantido apenas como referência histórica.

/**
 * Script de migração de dados: integrantes → users.
 *
 * Executa em transação única ($transaction) para garantir rollback total em caso de falha.
 * Lógica de merge:
 *   1. Para cada integrante, busca user com mesmo email.
 *   2. Se encontrar: atualiza telefone do user, copia junction records (eventos e funções).
 *   3. Se não encontrar: cria novo user com hash aleatório (UUID) como senha.
 *   4. Copia registros de Eventos_Integrantes → Eventos_Users e Integrantes_Funcoes → Users_Funcoes.
 *
 * Uso: npx tsx prisma/migrations/data-migrate-integrantes.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const SALT_ROUNDS = 12;

const prisma = new PrismaClient();

/**
 * Executa a migração de dados de integrantes para users em transação única.
 */
async function main(): Promise<void> {
    const integrantes = await prisma.integrantes.findMany({
        include: {
            Eventos_Integrantes: true,
            Integrantes_Funcoes: true,
        },
    });

    if (integrantes.length === 0) {
        console.log("Nenhum integrante encontrado. Migração de dados não necessária.");
        return;
    }

    console.log(`Migrando ${integrantes.length} integrante(s)...`);

    await prisma.$transaction(async (tx) => {
        for (const integrante of integrantes) {
            if (!integrante.email || integrante.email.trim() === "") {
                throw new Error(
                    `Integrante id=${integrante.id} possui email inválido (nulo ou vazio). Corrija antes de migrar.`
                );
            }

            const existingUser = await tx.users.findUnique({
                where: { email: integrante.email },
            });

            let targetUserId: string;

            if (existingUser) {
                /** Merge: absorve telefone do integrante se o user não tiver */
                if (!existingUser.telefone && integrante.telefone) {
                    await tx.users.update({
                        where: { id: existingUser.id },
                        data: { telefone: integrante.telefone },
                    });
                }
                targetUserId = existingUser.id;
                console.log(
                    `  MERGE: integrante ${integrante.email} → user existente ${targetUserId}`
                );
            } else {
                /** Novo user com senha aleatória (força "Esqueci minha senha") */
                const randomPassword = await bcrypt.hash(randomUUID(), SALT_ROUNDS);
                const newUser = await tx.users.create({
                    data: {
                        name: integrante.nome,
                        email: integrante.email,
                        password: randomPassword,
                        telefone: integrante.telefone,
                    },
                });
                targetUserId = newUser.id;
                console.log(
                    `  NOVO: integrante ${integrante.email} → user ${targetUserId}`
                );
            }

            /** Copiar vínculos de eventos (Eventos_Integrantes → Eventos_Users) */
            for (const ei of integrante.Eventos_Integrantes) {
                const exists = await tx.eventos_Users.findUnique({
                    where: {
                        evento_id_fk_user_id: {
                            evento_id: ei.evento_id,
                            fk_user_id: targetUserId,
                        },
                    },
                });
                if (!exists) {
                    await tx.eventos_Users.create({
                        data: {
                            evento_id: ei.evento_id,
                            fk_user_id: targetUserId,
                        },
                    });
                }
            }

            /** Copiar vínculos de funções (Integrantes_Funcoes → Users_Funcoes) */
            for (const inf of integrante.Integrantes_Funcoes) {
                const exists = await tx.users_Funcoes.findUnique({
                    where: {
                        fk_user_id_funcao_id: {
                            fk_user_id: targetUserId,
                            funcao_id: inf.funcao_id,
                        },
                    },
                });
                if (!exists) {
                    await tx.users_Funcoes.create({
                        data: {
                            fk_user_id: targetUserId,
                            funcao_id: inf.funcao_id,
                        },
                    });
                }
            }
        }

        console.log("Migração de dados concluída com sucesso dentro da transação.");
    });
}

main()
    .then(() => {
        console.log("Script finalizado.");
    })
    .catch((error) => {
        console.error("ERRO na migração de dados (rollback aplicado):", error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
