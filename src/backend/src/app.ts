import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import homeRoutes from './router/homeRoutes.js';
import artistasRoutes from './router/artistasRoutes.js';
import integrantesRoutes from './router/integrantesRoutes.js';
import musicasRoutes from './router/musicasRoutes.js';
import tonalidadesRoutes from './router/tonalidadesRoutes.js';
import funcoesRoutes from './router/funcoesRoutes.js';
import tagsRoutes from './router/tagsRoutes.js';
import tiposEventosRoutes from './router/tiposEventosRoutes.js';
import eventosRoutes from './router/eventosRoutes.js';

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
            res.status(500).json({ errors: [err.message || "Erro interno do servidor"] });
        });
    }
}

export default new App().app;
