/**
 * @module seeds/domain-defaults
 * @description Seed idempotente de dados padrão de domínio por tenant.
 *
 * Cria funções musicais, tipos de evento e categorias de músicas
 * para um tenant específico. Usa `createMany` com `skipDuplicates`
 * para ser seguro em re-execuções (idempotente).
 *
 * Chamado em dois pontos:
 * - `seeds/admin.ts` — para todos os tenants ativos no deploy
 * - `igrejas.service.ts` — ao criar uma nova igreja via API
 */
import type { PrismaClient } from '@prisma/client';

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
 * Semeia dados padrão de domínio (funções, tipos de evento, categorias, tonalidades) para um tenant.
 *
 * Idempotente — registros existentes são ignorados via `skipDuplicates`
 * (unique constraints `[tenant_id, nome]` e `[tenant_id, tom]`).
 *
 * @param prisma - Instância do Prisma Client (base, sem filtro de tenant)
 * @param tenantId - UUID do tenant para o qual os dados serão criados
 */
export async function seedTenantDefaults(prisma: PrismaClient, tenantId: string): Promise<void> {
  const funcoes = await prisma.funcoes.createMany({
    data: DEFAULT_FUNCOES.map(nome => ({ nome, tenant_id: tenantId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${funcoes.count} funções seeded for tenant ${tenantId}`);

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
