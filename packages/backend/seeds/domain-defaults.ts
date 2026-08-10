/**
 * @module seeds/domain-defaults
 * @description Seed idempotente de dados padrão de domínio por tenant.
 *
 * Cria funções musicais, grupos de funções, tipos de evento e categorias
 * de músicas para um tenant específico. Usa `createMany` com `skipDuplicates`
 * para ser seguro em re-execuções (idempotente).
 *
 * Chamado em dois pontos:
 * - `seeds/admin.ts` — para todos os tenants ativos no deploy
 * - `igrejas.service.ts` — ao criar uma nova igreja via API
 */
import type { Prisma } from '@prisma/client';

/**
 * Cliente aceito pelas funções de seed.
 *
 * Tipado como `Prisma.TransactionClient` — o `PrismaClient` base também o
 * satisfaz, então a mesma função serve tanto para o seed avulso quanto para uma
 * execução dentro de `$transaction` (usada ao criar uma igreja pela API).
 */
type SeedClient = Prisma.TransactionClient;

/** Funções musicais padrão para um ministério de louvor. */
const DEFAULT_FUNCOES = [
  'Ministro de Louvor',
  'Vocal',
  'Back Vocal',
  'Violão',
  'Guitarra',
  'Contrabaixo',
  'Bateria',
  'Percussão',
  'Teclado',
  'Saxofone',
  'Sonorização',
  'Mídia',
  'Iluminação',
];

/**
 * Grupos padrão que organizam as funções por papel.
 * A `ordem` define a sequência dos blocos de integrantes na mensagem
 * de compartilhamento da escala.
 */
const DEFAULT_FUNCOES_GRUPOS = [
  { nome: 'Ministração', ordem: 1 },
  { nome: 'Direção Musical', ordem: 2 },
  { nome: 'Vocal', ordem: 3 },
  { nome: 'Instrumentos', ordem: 4 },
  { nome: 'Outros', ordem: 5 },
];

/**
 * Classificação padrão de função → grupo, indexada pelo nome da função
 * em minúsculas. Espelha o mapeamento da migração
 * `20260809183209_add_funcoes_grupos`; alterar um exige alterar o outro.
 */
const DEFAULT_FUNCAO_GRUPO: Record<string, string> = {
  'ministração': 'Ministração',
  'ministro de louvor': 'Ministração',
  'direção musical': 'Direção Musical',
  'vocal': 'Vocal',
  'back vocal': 'Vocal',
  'violão': 'Instrumentos',
  'guitarra': 'Instrumentos',
  'contrabaixo': 'Instrumentos',
  'bateria': 'Instrumentos',
  'percussão': 'Instrumentos',
  'teclado': 'Instrumentos',
  'saxofone': 'Instrumentos',
  'sonorização': 'Outros',
  'mídia': 'Outros',
  'iluminação': 'Outros',
};

/** Tipos de evento padrão para categorizar escalas. */
const DEFAULT_TIPOS_EVENTOS = [
  'Culto de Domingo',
  'Culto de Quarta',
  'Culto de Sábado',
  'Ensaio',
  'Conferência',
  'Vigília',
  'Culto de Jovens',
  'Casamento',
  'Evento Especial',
];

/** Tonalidades padrão — escala cromática completa (maiores + menores). */
const DEFAULT_TONALIDADES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];

/** Categorias padrão para classificar músicas por momento litúrgico. */
const DEFAULT_CATEGORIAS = [
  'Adoração',
  'Louvor',
  'Comunhão',
  'Celebração',
  'Ofertório',
  'Abertura',
  'Encerramento',
  'Ceia',
  'Infantil',
];

/**
 * Vincula ao grupo correspondente as funções do tenant que ainda estão sem grupo,
 * casando o nome (em minúsculas) contra `DEFAULT_FUNCAO_GRUPO`.
 *
 * Nomes não reconhecidos permanecem sem grupo — aparecem ao final da lista de
 * integrantes compartilhada até serem classificados na aba "Grupos".
 *
 * @param prisma - Instância do Prisma Client (base, sem filtro de tenant)
 * @param tenantId - UUID do tenant cujas funções serão classificadas
 * @returns Quantidade de funções efetivamente vinculadas a um grupo
 */
async function classifyFuncoesEmGrupos(prisma: SeedClient, tenantId: string): Promise<number> {
  const grupos = await prisma.funcoes_Grupos.findMany({
    where: { tenant_id: tenantId },
    select: { id: true, nome: true },
  });
  const grupoIdPorNome = new Map(grupos.map(g => [g.nome, g.id]));

  const semGrupo = await prisma.funcoes.findMany({
    where: { tenant_id: tenantId, fk_grupo: null },
    select: { id: true, nome: true },
  });

  const funcoesPorGrupo = new Map<string, string[]>();
  for (const funcao of semGrupo) {
    const nomeGrupo = DEFAULT_FUNCAO_GRUPO[funcao.nome.toLowerCase()];
    const grupoId = nomeGrupo ? grupoIdPorNome.get(nomeGrupo) : undefined;
    if (!grupoId) continue;

    const lista = funcoesPorGrupo.get(grupoId) ?? [];
    lista.push(funcao.id);
    funcoesPorGrupo.set(grupoId, lista);
  }

  let total = 0;
  for (const [grupoId, funcaoIds] of funcoesPorGrupo) {
    const { count } = await prisma.funcoes.updateMany({
      where: { id: { in: funcaoIds } },
      data: { fk_grupo: grupoId },
    });
    total += count;
  }
  return total;
}

/**
 * Semeia dados padrão de domínio (funções, grupos de funções, tipos de evento,
 * categorias, tonalidades) para um tenant.
 *
 * Idempotente — registros existentes são ignorados via `skipDuplicates`
 * (unique constraints `[tenant_id, nome]` e `[tenant_id, tom]`).
 *
 * Limitação conhecida da classificação em grupos: uma re-execução reclassifica
 * funções que estejam **sem grupo** e cujo nome seja reconhecido. Se um
 * administrador removeu deliberadamente uma função de seu grupo, o próximo
 * seed a recoloca. Funções já vinculadas a algum grupo nunca são movidas.
 *
 * @param prisma - Instância do Prisma Client (base, sem filtro de tenant)
 * @param tenantId - UUID do tenant para o qual os dados serão criados
 */
export async function seedTenantDefaults(prisma: SeedClient, tenantId: string): Promise<void> {
  const funcoes = await prisma.funcoes.createMany({
    data: DEFAULT_FUNCOES.map(nome => ({ nome, tenant_id: tenantId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${funcoes.count} funções seeded for tenant ${tenantId}`);

  const grupos = await prisma.funcoes_Grupos.createMany({
    data: DEFAULT_FUNCOES_GRUPOS.map(({ nome, ordem }) => ({ nome, ordem, tenant_id: tenantId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${grupos.count} grupos de funções seeded for tenant ${tenantId}`);

  const classificadas = await classifyFuncoesEmGrupos(prisma, tenantId);
  console.log(`  ✓ ${classificadas} funções classificadas em grupos for tenant ${tenantId}`);

  const tipos = await prisma.tipos_Eventos.createMany({
    data: DEFAULT_TIPOS_EVENTOS.map(nome => ({ nome, tenant_id: tenantId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${tipos.count} tipos de evento seeded for tenant ${tenantId}`);

  const categorias = await prisma.categorias.createMany({
    data: DEFAULT_CATEGORIAS.map(nome => ({ nome, tenant_id: tenantId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${categorias.count} categorias seeded for tenant ${tenantId}`);

  const tonalidades = await prisma.tonalidades.createMany({
    data: DEFAULT_TONALIDADES.map(tom => ({ tom, tenant_id: tenantId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${tonalidades.count} tonalidades seeded for tenant ${tenantId}`);
}
