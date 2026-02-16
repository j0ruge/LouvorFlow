import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppError } from './errors/AppError.js';

import homeRoutes from './routes/home.routes.js';
import artistasRoutes from './routes/artistas.routes.js';
import integrantesRoutes from './routes/integrantes.routes.js';
import musicasRoutes from './routes/musicas.routes.js';
import tonalidadesRoutes from './routes/tonalidades.routes.js';
import funcoesRoutes from './routes/funcoes.routes.js';
import tagsRoutes from './routes/tags.routes.js';
import tiposEventosRoutes from './routes/tipos-eventos.routes.js';
import eventosRoutes from './routes/eventos.routes.js';

class App {
    app: Express;

    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
        this.errorHandler();
    }
    middlewares(): void {
        this.app.use(cors());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
    }
    routes(): void {
        this.app.use('/', homeRoutes);
        this.app.use('/api/artistas', artistasRoutes);
        this.app.use('/api/integrantes', integrantesRoutes);
        this.app.use('/api/musicas', musicasRoutes);
        this.app.use('/api/tonalidades', tonalidadesRoutes);
        this.app.use('/api/funcoes', funcoesRoutes);
        this.app.use('/api/tags', tagsRoutes);
        this.app.use('/api/tipos-eventos', tiposEventosRoutes);
        this.app.use('/api/eventos', eventosRoutes);
    }
    errorHandler(): void {
        this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ errors: err.errors || [err.message] });
                return;
            }
            res.status(500).json({ errors: [err.message || "Erro interno do servidor"] });
        });
    }
}

export default new App().app;
