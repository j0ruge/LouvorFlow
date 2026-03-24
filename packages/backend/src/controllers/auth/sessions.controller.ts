import { Request, Response } from 'express';
import authenticateUserService from '../../services/auth/authenticate-user.service.js';
import selectTenantService from '../../services/auth/select-tenant.service.js';
import switchTenantService from '../../services/auth/switch-tenant.service.js';

/**
 * Controller responsável pela autenticação de usuários.
 * Gerencia a criação de sessões (login), a seleção de tenant no fluxo multi-tenant
 * e a troca de tenant sem re-login para usuários já autenticados.
 */
class SessionsController {
    /**
     * Cria uma nova sessão autenticando o usuário com email e senha.
     *
     * Suporta o fluxo multi-tenant:
     * - Se o usuário possui um único tenant ativo, retorna sessão completa (HTTP 200).
     * - Se o usuário possui múltiplos tenants ativos, retorna dados para seleção de tenant (HTTP 200)
     *   com `requires_tenant_selection: true`, lista de `tenants` e `selection_token`.
     *
     * @param req - Requisição contendo `email` e `password` no body.
     * @param res - Resposta com dados da sessão ou de seleção de tenant.
     */
    async create(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        const result = await authenticateUserService.execute({ email, password });
        res.status(200).json(result);
    }

    /**
     * Finaliza o fluxo de seleção de tenant emitindo os tokens de sessão definitivos.
     *
     * Recebe o `selection_token` (emitido durante o login de usuário multi-tenant) e o
     * `tenant_id` escolhido pelo usuário, valida o vínculo e gera o par de tokens de sessão
     * com o tenant selecionado no payload do JWT.
     *
     * @param req - Requisição contendo `selection_token` e `tenant_id` no body.
     * @param res - Resposta com sessão completa: usuário, token, refresh_token e tenant.
     */
    async selectTenant(req: Request, res: Response): Promise<void> {
        const { selection_token, tenant_id } = req.body;
        const result = await selectTenantService.execute({ selection_token, tenant_id });
        res.status(200).json(result);
    }

    /**
     * Troca o tenant ativo da sessão para um usuário já autenticado, sem re-login.
     *
     * Valida o vínculo do usuário com o tenant de destino, confirma que o tenant está ativo
     * e emite um novo par de tokens de sessão com o tenantId atualizado no payload JWT,
     * invalidando os tokens anteriores.
     *
     * @param req - Requisição autenticada contendo `tenant_id` no body e `req.user.id` do JWT.
     * @param res - Resposta com sessão completa: usuário, token, refresh_token e tenant.
     */
    async switchTenant(req: Request, res: Response): Promise<void> {
        const { tenant_id } = req.body;
        const userId = req.user!.id;
        const result = await switchTenantService.execute({ userId, tenant_id });
        res.status(200).json(result);
    }
}

export default new SessionsController();
