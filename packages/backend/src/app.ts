import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppError } from './errors/AppError.js';

import homeRoutes from './routes/home.routes.js';
import artistasRoutes from './routes/artistas.routes.js';
import integrantesRoutes from './routes/integrantes.routes.js';
import musicasRoutes from './routes/musicas.routes.js';
import tonalidadesRoutes from './routes/tonalidades.routes.js';
import funcoesRoutes from './routes/funcoes.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import tiposEventosRoutes from './routes/tipos-eventos.routes.js';
import eventosRoutes from './routes/eventos.routes.js';
import relatoriosRoutes from './routes/relatorios.routes.js';
import sessionsRoutes from './routes/auth/sessions.routes.js';
import authUsersRoutes from './routes/auth/users.routes.js';
import rolesRoutes from './routes/auth/roles.routes.js';
import permissionsRoutes from './routes/auth/permissions.routes.js';
import passwordRoutes from './routes/auth/password.routes.js';
import profileRoutes from './routes/auth/profile.routes.js';

/**
 * Classe principal da aplicação Express.
 *
 * Inicializa a instância do Express configurando middlewares globais,
 * registro de rotas e o handler centralizado de erros.
 */
class App {
    app: Express;

    /**
     * Cria a instância Express e executa a configuração inicial
     * de middlewares, rotas e tratamento de erros.
     */
    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
        this.errorHandler();
    }

    /**
     * Registra os middlewares globais da aplicação.
     *
     * Configura CORS, parsing de URL-encoded e parsing de JSON.
     */
    middlewares(): void {
        this.app.use(cors());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
    }

    /**
     * Registra todas as rotas da aplicação na instância Express.
     *
     * Inclui rotas de domínio (artistas, músicas, escalas, etc.)
     * e rotas de autenticação/RBAC (sessions, users, roles, permissions, profile, password).
     */
    routes(): void {
        this.app.use('/', homeRoutes);
        this.app.use('/api/artistas', artistasRoutes);
        this.app.use('/api/integrantes', integrantesRoutes);
        this.app.use('/api/musicas', musicasRoutes);
        this.app.use('/api/tonalidades', tonalidadesRoutes);
        this.app.use('/api/funcoes', funcoesRoutes);
        this.app.use('/api/categorias', categoriasRoutes);
        this.app.use('/api/tipos-eventos', tiposEventosRoutes);
        this.app.use('/api/eventos', eventosRoutes);
        this.app.use('/api/relatorios', relatoriosRoutes);
        this.app.use('/api/sessions', sessionsRoutes);
        this.app.use('/api/users', authUsersRoutes);
        this.app.use('/api/roles', rolesRoutes);
        this.app.use('/api/permissions', permissionsRoutes);
        this.app.use('/api/password', passwordRoutes);
        this.app.use('/api/profile', profileRoutes);
    }
    /**
     * Registra o handler centralizado de erros da aplicação.
     *
     * Trata instâncias de `AppError` retornando o status e mensagem correspondentes.
     * Para erros genéricos, mascara a mensagem em produção retornando status 500.
     */
    errorHandler(): void {
        this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ erro: err.errors ? err.errors.join('; ') : err.message, codigo: err.statusCode });
                return;
            }
            const message = process.env.NODE_ENV === 'production'
                ? 'Erro interno do servidor'
                : err.message || 'Erro interno do servidor';
            res.status(500).json({ erro: message, codigo: 500 });
        });
    }
}

export default new App().app;
