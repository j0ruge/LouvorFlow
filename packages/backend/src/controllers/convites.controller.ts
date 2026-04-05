/**
 * Controller de convites — gerencia links de convite para onboarding de integrantes.
 *
 * Endpoints autenticados (líder): gerar, listar e revogar convites.
 * Endpoints públicos (participante): validar token e aceitar convite.
 * Express 5 async error handling — sem try-catch.
 */
import { Request, Response } from 'express';
import createInviteService from '../services/convites/create-convite.service.js';
import listInvitesService from '../services/convites/list-convites.service.js';
import revokeInviteService from '../services/convites/revoke-convite.service.js';
import validateInviteService from '../services/convites/validate-convite.service.js';
import acceptInviteService from '../services/convites/accept-convite.service.js';

class ConvitesController {
    /**
     * Gera um novo link de convite para o tenant do líder autenticado.
     * Retorna 201 com dados do convite incluindo URL para compartilhar.
     */
    async create(req: Request, res: Response): Promise<void> {
        const invite = await createInviteService.execute(
            req.user!.tenantId!,
            req.user!.id,
        );
        res.status(201).json({ msg: 'Convite gerado com sucesso', invite });
    }

    /**
     * Lista todos os convites do tenant do líder autenticado com status derivado.
     */
    async index(req: Request, res: Response): Promise<void> {
        const invites = await listInvitesService.execute(req.user!.tenantId!);
        res.status(200).json({ invites });
    }

    /**
     * Revoga um convite ativo antes de ser utilizado.
     */
    async revoke(req: Request<{ id: string }>, res: Response): Promise<void> {
        await revokeInviteService.execute(req.params.id, req.user!.tenantId!);
        res.status(200).json({ msg: 'Convite revogado com sucesso' });
    }

    /**
     * Valida o estado de um token de convite (rota pública).
     * Retorna informações do tenant se válido, ou erro com status do token.
     */
    async validate(req: Request<{ token: string }>, res: Response): Promise<void> {
        const result = await validateInviteService.execute(req.params.token);
        res.status(200).json(result);
    }

    /**
     * Aceita um convite e cria conta (ou vincula conta existente) ao tenant.
     * Rota pública — não requer autenticação.
     */
    async accept(req: Request<{ token: string }>, res: Response): Promise<void> {
        const result = await acceptInviteService.execute(req.params.token, req.body);
        res.status(result.statusCode).json({ msg: result.msg });
    }
}

export default new ConvitesController();
