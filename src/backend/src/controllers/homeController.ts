import { Request, Response } from 'express';

class homeController {
    index(req: Request, res: Response): void {
        res.send('Rota de Início');
    }
}

export default new homeController();
