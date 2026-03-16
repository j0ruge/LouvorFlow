import { PrismaClient } from "@prisma/client";

/**
 * Instância singleton do Prisma Client.
 *
 * Após a unificação users/integrantes, a extensão que filtrava o campo `senha`
 * de integrantes foi removida — o model Integrantes não existe mais.
 * O campo `password` do model Users é protegido via select explícito nos repositories.
 */
const prisma = new PrismaClient();

export default prisma;
