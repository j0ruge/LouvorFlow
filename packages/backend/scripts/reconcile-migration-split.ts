/**
 * @module scripts/reconcile-migration-split
 * @description Reconcilia a tabela `_prisma_migrations` após o split da migration
 * `20260411032857_add_eventos_musicas_versao_fk` em três arquivos separados.
 *
 * Contexto do problema:
 * A migration original foi quebrada em três arquivos (feature + dois drifts),
 * mas o banco já tem o schema resultante do conteúdo original "bundled". Rodar
 * `prisma migrate dev` agora falharia com (1) erro de drift no 032857 porque o
 * checksum mudou e (2) erro de "objeto duplicado" ao tentar aplicar 032858/032859.
 *
 * Este script reconcilia APENAS a tabela de metadados `_prisma_migrations`:
 * - NÃO executa SQL DDL no schema
 * - NÃO apaga linhas de dados
 * - É idempotente: detecta ambiente limpo, já reconciliado, ou pré-split
 *
 * Execução:
 * ```bash
 * cd packages/backend && npx tsx scripts/reconcile-migration-split.ts
 * ```
 *
 * Modos de operação:
 * - **Ambiente limpo**: linha 032857 ausente de `_prisma_migrations`. Sai como no-op —
 *   `prisma migrate deploy` aplicará as três migrations normalmente.
 * - **Já reconciliado**: linha 032857 presente com checksum igual ao arquivo atual.
 *   Sai como no-op.
 * - **Pré-split**: linha 032857 presente com checksum diferente (conteúdo bundled antigo).
 *   Atualiza o checksum do 032857 e insere linhas "already applied" para 032858 e 032859.
 *
 * Variáveis de ambiente necessárias:
 * - `DB_URL`: URL de conexão com o banco de dados PostgreSQL.
 */

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

/** Instância direta do Prisma Client para uso no script de reconciliação. */
const prisma = new PrismaClient();

/** Diretório absoluto contendo as pastas de migration (packages/backend/prisma/migrations). */
const MIGRATIONS_DIR = resolve(__dirname, '..', 'prisma', 'migrations');

/** Nome da migration da feature (que teve seu conteúdo reduzido pelo split). */
const FEATURE_MIGRATION = '20260411032857_add_eventos_musicas_versao_fk';

/** Migrations criadas pelo split para conter o drift que estava embutido no 032857. */
const DRIFT_MIGRATIONS = [
    '20260411032858_change_invite_tokens_created_by_ondelete_restrict',
    '20260411032859_add_artistas_musicas_tenant_musica_idx',
] as const;

/** Representa uma linha da tabela `_prisma_migrations` (subset relevante). */
interface PrismaMigrationRow {
    id: string;
    checksum: string;
}

/**
 * Calcula o checksum SHA256 (hex lowercase) do conteúdo de um `migration.sql`,
 * usando o mesmo formato que o Prisma armazena em `_prisma_migrations.checksum`.
 *
 * @param migrationName - Nome da pasta da migration
 * @returns Hash SHA256 em hex lowercase
 */
function checksumOf(migrationName: string): string {
    const filePath = resolve(MIGRATIONS_DIR, migrationName, 'migration.sql');
    const content = readFileSync(filePath, 'utf8');
    return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Busca uma linha em `_prisma_migrations` pelo nome da migration.
 *
 * @param name - Nome da migration a localizar
 * @returns Linha encontrada ou `null` se não existir
 */
async function findRow(name: string): Promise<PrismaMigrationRow | null> {
    const rows = await prisma.$queryRaw<PrismaMigrationRow[]>`
        SELECT id, checksum FROM "_prisma_migrations" WHERE migration_name = ${name}
    `;
    return rows[0] ?? null;
}

/**
 * Imprime um separador visual no console.
 */
function hr(): void {
    console.log('─'.repeat(72));
}

/**
 * Valida que o DB_URL aponta para um banco de dados local.
 * Recusa executar contra bancos remotos a menos que `RECONCILE_ALLOW_REMOTE=1` esteja definido.
 *
 * @param rawUrl - URL de conexão do banco de dados (DB_URL)
 */
function guardRemoteDb(rawUrl: string): void {
    let dbUrl: URL;
    try {
        dbUrl = new URL(rawUrl);
    } catch {
        console.error('DB_URL inválida — não é possível determinar o host de destino.');
        process.exit(2);
    }

    console.log(`Target DB: ${dbUrl.hostname}:${dbUrl.port || '5432'}${dbUrl.pathname}`);

    const localHosts = ['localhost', '127.0.0.1', '::1', 'louvorflow_db'];
    const isLocal = localHosts.includes(dbUrl.hostname);

    if (!isLocal && process.env.RECONCILE_ALLOW_REMOTE !== '1') {
        console.error(
            'Refusing to run against non-local DB. Set RECONCILE_ALLOW_REMOTE=1 to override.',
        );
        process.exit(2);
    }
}

/**
 * Orquestra a reconciliação: detecta o modo de operação e executa a ação apropriada.
 * Todas as escritas ocorrem dentro de uma única `$transaction` para garantir atomicidade.
 */
async function main(): Promise<void> {
    hr();
    console.log('Reconcile Migration Split — _prisma_migrations metadata fixup');
    hr();

    guardRemoteDb(process.env.DB_URL ?? process.env.DATABASE_URL ?? '');

    const newFeatureChecksum = checksumOf(FEATURE_MIGRATION);
    const featureRow = await findRow(FEATURE_MIGRATION);

    if (!featureRow) {
        console.log(`[${FEATURE_MIGRATION}] not found in _prisma_migrations.`);
        console.log('Fresh environment detected — nothing to reconcile.');
        console.log('Run `npx prisma migrate deploy` (or `migrate dev`) normally.');
        return;
    }

    if (featureRow.checksum === newFeatureChecksum) {
        console.log(`[${FEATURE_MIGRATION}] checksum already matches the post-split file.`);
        console.log('Already reconciled — nothing to do.');
        return;
    }

    console.log(`[${FEATURE_MIGRATION}] checksum mismatch detected (pre-split state).`);
    console.log('Pre-reconcile state (save this to reverse manually if needed):');
    console.log(`  migration: ${FEATURE_MIGRATION}`);
    console.log(`  old checksum: ${featureRow.checksum}`);
    console.log(`  new checksum: ${newFeatureChecksum}`);
    console.log('Starting reconciliation transaction...');

    const summary: { migration: string; action: 'updated' | 'inserted' | 'skipped' }[] = [];

    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            UPDATE "_prisma_migrations"
            SET checksum = ${newFeatureChecksum}
            WHERE migration_name = ${FEATURE_MIGRATION}
        `;
        summary.push({ migration: FEATURE_MIGRATION, action: 'updated' });

        for (const name of DRIFT_MIGRATIONS) {
            const existing = await tx.$queryRaw<{ id: string }[]>`
                SELECT id FROM "_prisma_migrations" WHERE migration_name = ${name}
            `;
            if (existing.length > 0) {
                summary.push({ migration: name, action: 'skipped' });
                continue;
            }

            const checksum = checksumOf(name);
            await tx.$executeRaw`
                INSERT INTO "_prisma_migrations" (
                    id, checksum, started_at, finished_at, migration_name, applied_steps_count
                )
                VALUES (
                    gen_random_uuid()::text,
                    ${checksum},
                    NOW(),
                    NOW(),
                    ${name},
                    1
                )
            `;
            summary.push({ migration: name, action: 'inserted' });
        }
    });

    hr();
    console.log('Reconciliation complete:');
    for (const row of summary) {
        console.log(`  ${row.action.padEnd(9)} ${row.migration}`);
    }
    hr();
    console.log('Next step: run `npx prisma migrate status` to confirm everything is in sync.');
}

main()
    .catch((err: unknown) => {
        console.error('Reconciliation failed:', err);
        process.exit(1);
    })
    .finally(() => {
        void prisma.$disconnect();
    });
