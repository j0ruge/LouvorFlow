import 'dotenv/config';
import app from './src/app.js';
import prisma from './prisma/cliente.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || 'localhost';

(async (): Promise<void> => {
    try {
        await prisma.$connect();
        console.log('Conectado ao banco de dados com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        process.exit(1);
    }

    app.listen(PORT, HOST, () => {
        console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    });
})();
