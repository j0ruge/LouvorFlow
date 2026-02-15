import { PrismaClient } from "@prisma/client";

// R-005: Safety net — strip `senha` from all Integrantes query results
function createPrismaClient() {
    return new PrismaClient().$extends({
        query: {
            integrantes: {
                async $allOperations({ model, operation, args, query }) {
                    const result = await query(args);
                    const strip = (obj: Record<string, unknown>): Record<string, unknown> => {
                        if (obj && typeof obj === 'object') delete obj.senha;
                        return obj;
                    };
                    return Array.isArray(result)
                        ? result.map(strip as (value: unknown) => unknown)
                        : strip(result as Record<string, unknown>);
                }
            }
        }
    });
}

const prisma = createPrismaClient();

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

export default prisma;
