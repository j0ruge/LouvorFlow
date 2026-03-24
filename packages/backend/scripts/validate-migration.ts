/**
 * @module scripts/validate-migration
 * @description Script de validação pós-migração para o modelo multi-tenant.
 *
 * Verifica que a migração foi concluída com sucesso, garantindo que:
 * - Todos os registros das tabelas de domínio possuem `tenant_id` preenchido.
 * - Todos os registros das tabelas de junção possuem `tenant_id` preenchido.
 * - Todos os usuários possuem pelo menos uma entrada em `TenantUsers`.
 *
 * Execução:
 * ```bash
 * npx tsx scripts/validate-migration.ts
 * ```
 *
 * Saída:
 * - Tabela resumo com nome da tabela, total de registros e status de validação.
 * - Código de saída `0` se todas as validações passarem.
 * - Código de saída `1` se alguma validação falhar.
 *
 * Variáveis de ambiente necessárias:
 * - `DB_URL`: URL de conexão com o banco de dados PostgreSQL.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/** Instância direta do Prisma Client para uso no script de validação. */
const prisma = new PrismaClient();

/**
 * Representa o resultado da validação de uma tabela individual.
 */
interface ResultadoValidacao {
  /** Nome da tabela no banco de dados. */
  tabela: string;
  /** Total de registros na tabela. */
  total: number;
  /** Quantidade de registros com `tenant_id` nulo ou usuários sem tenant (quando aplicável). */
  semTenantId: number;
  /** Indica se a validação passou. */
  ok: boolean;
  /** Mensagem descritiva do status. */
  mensagem: string;
}

/**
 * Retorno bruto da query SQL de contagem.
 */
interface RowCount {
  /** Valor da contagem retornado pelo PostgreSQL como bigint. */
  count: bigint;
}

/**
 * Valida uma tabela de domínio contando registros sem `tenant_id` via SQL raw.
 *
 * Utiliza `$queryRaw` para garantir que registros com `tenant_id IS NULL`
 * sejam detectados mesmo quando o schema Prisma não contempla o campo como opcional.
 *
 * @param nomeTabela - Nome SQL da tabela (ex: `artistas`).
 * @param nomeExibicao - Nome legível para exibição no resumo.
 * @param contarTotal - Função que executa o `count()` via Prisma para o modelo.
 * @returns Resultado da validação da tabela.
 */
async function validarTabelaDominio(
  nomeTabela: string,
  nomeExibicao: string,
  contarTotal: () => Promise<number>
): Promise<ResultadoValidacao> {
  const total = await contarTotal();

  const rows = await prisma.$queryRawUnsafe<RowCount[]>(
    `SELECT COUNT(*)::bigint AS count FROM ${nomeTabela} WHERE tenant_id IS NULL`
  );
  const semTenantId = Number(rows[0].count);
  const ok = semTenantId === 0;

  return {
    tabela: nomeExibicao,
    total,
    semTenantId,
    ok,
    mensagem: ok
      ? 'Todos os registros possuem tenant_id'
      : `${semTenantId} registro(s) sem tenant_id`,
  };
}

/**
 * Valida que todos os usuários possuem pelo menos uma entrada em `tenant_users`.
 *
 * Usuários sem nenhum vínculo de tenant indicam que a migração não criou
 * as entradas de `TenantUsers` corretamente.
 *
 * @returns Resultado da validação de usuários sem vínculo de tenant.
 */
async function validarUsuariosSemTenant(): Promise<ResultadoValidacao> {
  const totalUsuarios = await prisma.users.count();

  /** Conta usuários que não possuem nenhuma entrada em tenant_users. */
  const usuariosSemTenant = await prisma.users.count({
    where: {
      tenant_users: {
        none: {},
      },
    },
  });

  const ok = usuariosSemTenant === 0;

  return {
    tabela: 'users (vínculo com tenant)',
    total: totalUsuarios,
    semTenantId: usuariosSemTenant,
    ok,
    mensagem: ok
      ? 'Todos os usuários possuem ao menos um TenantUsers'
      : `${usuariosSemTenant} usuário(s) sem nenhum TenantUsers`,
  };
}

/**
 * Formata e imprime a tabela de resumo dos resultados de validação no console.
 *
 * @param resultados - Lista de resultados de validação a serem exibidos.
 */
function imprimirResumo(resultados: ResultadoValidacao[]): void {
  const COL_TABELA = 32;
  const COL_TOTAL = 10;
  const COL_STATUS = 12;
  const COL_MSG = 50;
  const separador = '-'.repeat(COL_TABELA + COL_TOTAL + COL_STATUS + COL_MSG + 9);

  console.log('\n=== Validação de Migração Multi-Tenant ===\n');
  console.log(separador);
  console.log(
    `| ${'Tabela'.padEnd(COL_TABELA)} | ${'Registros'.padEnd(COL_TOTAL)} | ${'Status'.padEnd(COL_STATUS)} | ${'Detalhes'.padEnd(COL_MSG)} |`
  );
  console.log(separador);

  for (const r of resultados) {
    const marcador = r.ok ? '✓' : '✗';
    const status = `${marcador} ${r.ok ? 'OK' : 'FALHA'}`;
    console.log(
      `| ${r.tabela.padEnd(COL_TABELA)} | ${String(r.total).padEnd(COL_TOTAL)} | ${status.padEnd(COL_STATUS)} | ${r.mensagem.padEnd(COL_MSG)} |`
    );
  }

  console.log(separador);
}

/**
 * Ponto de entrada do script de validação da migração multi-tenant.
 *
 * Executa todas as verificações em paralelo, imprime o resumo e encerra
 * com código `0` (sucesso) ou `1` (falha).
 */
async function main(): Promise<number> {
  console.log('Conectando ao banco de dados...');

  const resultados = await Promise.all([
    /** Tabelas de domínio principais. */
    validarTabelaDominio('artistas', 'artistas', () => prisma.artistas.count()),
    validarTabelaDominio('musicas', 'musicas', () => prisma.musicas.count()),
    validarTabelaDominio('tonalidades', 'tonalidades', () => prisma.tonalidades.count()),
    validarTabelaDominio('funcoes', 'funcoes', () => prisma.funcoes.count()),
    validarTabelaDominio('categorias', 'categorias', () => prisma.categorias.count()),
    validarTabelaDominio('tipos_eventos', 'tipos_eventos', () => prisma.tipos_Eventos.count()),
    validarTabelaDominio('eventos', 'eventos', () => prisma.eventos.count()),

    /** Tabelas de junção. */
    validarTabelaDominio('artistas_musicas', 'artistas_musicas', () => prisma.artistas_Musicas.count()),
    validarTabelaDominio('musicas_funcoes', 'musicas_funcoes', () => prisma.musicas_Funcoes.count()),
    validarTabelaDominio('musicas_categorias', 'musicas_categorias', () => prisma.musicas_Categorias.count()),
    validarTabelaDominio('eventos_musicas', 'eventos_musicas', () => prisma.eventos_Musicas.count()),
    validarTabelaDominio('eventos_users', 'eventos_users', () => prisma.eventos_Users.count()),
    validarTabelaDominio('eventos_users_funcoes', 'eventos_users_funcoes', () => prisma.eventos_Users_Funcoes.count()),
    validarTabelaDominio('users_funcoes', 'users_funcoes', () => prisma.users_Funcoes.count()),

    /** Vínculo usuários <-> tenants. */
    validarUsuariosSemTenant(),
  ]);

  imprimirResumo(resultados);

  const totalFalhas = resultados.filter((r) => !r.ok).length;

  if (totalFalhas === 0) {
    console.log('\n✓ Todas as validações passaram. Migração concluída com sucesso.\n');
    return 0;
  } else {
    console.log(`\n✗ ${totalFalhas} validação(ões) falharam. Verifique os itens marcados com ✗.\n`);
    return 1;
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    console.error('Erro fatal durante a validação:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    /** Garante que a conexão com o banco seja encerrada ao terminar o script. */
    await prisma.$disconnect();
  });
