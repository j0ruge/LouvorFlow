import { Request, Response } from 'express';

/**
 * Controller do health check da aplicação.
 *
 * Expõe um endpoint leve e público (sem autenticação nem contexto de tenant),
 * consumido pelo healthcheck do container, por orquestradores e pelo smoke test
 * pós-deploy do CI/CD para confirmar que a instância está no ar e qual build
 * (SHA do commit) está efetivamente servindo.
 */
class HealthController {
    /**
     * Retorna o status de saúde e a versão (SHA do build) da API.
     *
     * O SHA vem da variável de ambiente `GIT_SHA`, injetada em build-time pelo
     * Dockerfile a partir do commit que originou a imagem. Quando ausente (ex.:
     * execução local fora do CI), retorna `'unknown'`. Permite ao smoke test de
     * deploy verificar que o código novo — e não uma imagem antiga — está no ar.
     *
     * @param _req Requisição Express (não utilizada).
     * @param res Resposta Express; responde 200 com `{ status, sha, timestamp }`.
     */
    index(_req: Request, res: Response): void {
        res.status(200).json({
            status: 'ok',
            sha: process.env.GIT_SHA ?? 'unknown',
            timestamp: new Date().toISOString(),
        });
    }
}

export default new HealthController();
