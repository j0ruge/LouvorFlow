import { Request, Response } from 'express';

class HomeController {
    index(req: Request, res: Response): void {
        res.send('Rota de Início');
    }
}

export default new HomeController();
