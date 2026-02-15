import { PrismaClient } from "@prisma/client";

// R-005: Safety net — strip `senha` from all Integrantes query results
const prisma = new PrismaClient().$extends({
    query: {
        integrantes: {
            async $allOperations({ model, operation, args, query }) {
                const result = await query(args);
                const strip = (obj) => {
                    if (obj && typeof obj === 'object') delete obj.senha;
                    return obj;
                };
                return Array.isArray(result) ? result.map(strip) : strip(result);
            }
        }
    }
});

export default prisma;
