/**
 * Controller de igrejas (tenants) — manipuladores HTTP para gestão de igrejas.
 *
 * Utiliza Express 5 com async error handling nativo — sem try-catch.
 * Todos os endpoints são exclusivos ao super-admin (cadeia de middleware
 * `ensureAuthenticated → ensureSuperAdmin` aplicada nas rotas).
 */
import { Request, Response } from 'express';
import igrejasService from '../services/igrejas.service.js';

/**
 * Controller responsável pelos endpoints REST de gestão de igrejas (tenants).
 *
 * Delega toda a lógica de negócio ao `igrejasService` e trata apenas
 * a camada HTTP (serialização de resposta e status codes).
 */
class IgrejasController {
  /**
   * Lista todas as igrejas (tenants) cadastradas na plataforma.
   *
   * @param _req - Objeto de requisição (não utilizado)
   * @param res - Objeto de resposta Express
   */
  async index(_req: Request, res: Response): Promise<void> {
    const igrejas = await igrejasService.listAll();
    res.status(200).json(igrejas);
  }

  /**
   * Retorna os dados de uma igreja (tenant) pelo ID.
   *
   * @param req - Objeto de requisição com `params.id` (UUID do tenant)
   * @param res - Objeto de resposta Express
   */
  async show(req: Request<{ id: string }>, res: Response): Promise<void> {
    const igreja = await igrejasService.getById(req.params.id);
    res.status(200).json(igreja);
  }

  /**
   * Cria uma nova igreja (tenant) na plataforma.
   *
   * @param req - Objeto de requisição com `body.name`
   * @param res - Objeto de resposta Express
   */
  async create(req: Request, res: Response): Promise<void> {
    const igreja = await igrejasService.create(req.body.name);
    res.status(201).json({ msg: 'Igreja criada com sucesso', igreja });
  }

  /**
   * Atualiza os dados de uma igreja (tenant) existente.
   *
   * @param req - Objeto de requisição com `params.id` e `body` contendo name e/ou status
   * @param res - Objeto de resposta Express
   */
  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    const igreja = await igrejasService.update(req.params.id, req.body);
    res.status(200).json({ msg: 'Igreja atualizada com sucesso', igreja });
  }

  /**
   * Desativa uma igreja (tenant) alterando seu status para `inactive`.
   *
   * @param req - Objeto de requisição com `params.id` (UUID do tenant)
   * @param res - Objeto de resposta Express
   */
  async destroy(req: Request<{ id: string }>, res: Response): Promise<void> {
    await igrejasService.deactivate(req.params.id);
    res.status(204).send();
  }

  /**
   * Vincula um usuário a uma igreja (tenant).
   *
   * @param req - Objeto de requisição com `params.id` (tenantId) e `body.user_id`
   * @param res - Objeto de resposta Express
   */
  async addUser(req: Request<{ id: string }>, res: Response): Promise<void> {
    const vinculo = await igrejasService.addUser(req.params.id, req.body.user_id);
    res.status(201).json({ msg: 'Usuário vinculado à igreja com sucesso', vinculo });
  }

  /**
   * Remove o vínculo entre um usuário e uma igreja (tenant).
   *
   * @param req - Objeto de requisição com `params.id` (tenantId) e `params.userId`
   * @param res - Objeto de resposta Express
   */
  async removeUser(req: Request<{ id: string; userId: string }>, res: Response): Promise<void> {
    await igrejasService.removeUser(req.params.id, req.params.userId);
    res.status(204).send();
  }

  /**
   * Lista os usuários vinculados a uma igreja (tenant).
   *
   * @param req - Objeto de requisição com `params.id` (UUID do tenant)
   * @param res - Objeto de resposta Express
   */
  async listUsers(req: Request<{ id: string }>, res: Response): Promise<void> {
    const usuarios = await igrejasService.listUsers(req.params.id);
    res.status(200).json(usuarios);
  }
}

export default new IgrejasController();
