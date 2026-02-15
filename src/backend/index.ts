import 'dotenv/config';
import app from './src/app.js';
import prisma from './prisma/cliente.js';

(async (): Promise<void> => {
    try {
        await prisma.$connect();
        console.log('Conectado ao banco de dados com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
    }
})();

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
