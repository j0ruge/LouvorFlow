import { PrismaClient } from "@prisma/client";

/**
 * Creates a PrismaClient instance extended so that all integrantes query results have the `senha` field removed.
 *
 * @returns A PrismaClient augmented with a query-level extension that strips the `senha` property from integrantes query results.
 */
function createPrismaClient() {
    return new PrismaClient().$extends({
        query: {
            integrantes: {
                async $allOperations({ args, query }) {
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