import { PrismaClient } from "@prisma/client";

// R-005: Safety net — strip `senha` from all Integrantes query results
function createPrismaClient() {
    return new PrismaClient().$extends({
        query: {
            integrantes: {
                async $allOperations({ model, operation, args, query }) {
                    const result = await query(args);
                    const strip = (value: unknown): unknown => {
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            delete (value as { senha?: unknown }).senha;
                        }
                        return value;
                    };
                    return Array.isArray(result) ? result.map(strip) : strip(result);
                }
            }
        }
    });
}

const prisma = createPrismaClient();

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

export default prisma;
