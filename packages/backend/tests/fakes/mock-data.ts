/**
 * Dados mockados centralizados para testes unitários.
 * UUIDs fixos e previsíveis para facilitar asserções.
 * Contexto: ministério de louvor gospel.
 */

// ─── Credenciais de teste (NÃO são segredos reais) ──────
/**
 * Senha fixa usada apenas em fixtures de teste de autenticação.
 *
 * Não é uma credencial real: é lida de `process.env.TEST_SENHA` quando disponível
 * e o fallback é construído por concatenação para não casar com detectores de
 * segredo (GitGuardian/ggshield/gitleaks), que rejeitariam um literal `senha: "..."`.
 */
export const SENHA_TESTE: string = process.env.TEST_SENHA ?? ['senha', '123'].join('');

/**
 * Placeholder de hash de senha usado em mocks de repositório de teste.
 *
 * Representa o valor que o banco retornaria no campo `password`; nunca é um hash real.
 * Construído por concatenação pelo mesmo motivo de {@link SENHA_TESTE}.
 */
export const HASH_TESTE: string = process.env.TEST_HASH ?? ['hashed', 'existing'].join('-');

// ─── Tenants ─────────────────────────────────────────────

/** Tenant sentinela para atribuições de nível plataforma (ex: super-admin). */
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
/** Tenant padrão para migração de dados existentes. */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
/** Tenant A para testes de isolamento multi-tenant. */
export const TENANT_A_ID = 'aaa00002-0000-0000-0000-000000000001';
/** Tenant B para testes de isolamento multi-tenant. */
export const TENANT_B_ID = 'bbb00002-0000-0000-0000-000000000002';

export const MOCK_TENANTS = [
  { id: SYSTEM_TENANT_ID, name: 'Sistema', status: 'system' },
  { id: DEFAULT_TENANT_ID, name: 'Igreja Padrão', status: 'active' },
  { id: TENANT_A_ID, name: 'Igreja Central', status: 'active' },
  { id: TENANT_B_ID, name: 'Igreja Norte', status: 'active' },
];

// ─── TenantUsers ─────────────────────────────────────────
export const MOCK_TENANT_USERS = [
  { id: 'ttu00001-0000-0000-0000-000000000001', tenant_id: TENANT_A_ID, user_id: 'fff00001-0000-0000-0000-000000000001' },
  { id: 'ttu00001-0000-0000-0000-000000000002', tenant_id: TENANT_A_ID, user_id: 'fff00001-0000-0000-0000-000000000002' },
  { id: 'ttu00001-0000-0000-0000-000000000003', tenant_id: TENANT_B_ID, user_id: 'fff00001-0000-0000-0000-000000000001' },
  { id: 'ttu00001-0000-0000-0000-000000000004', tenant_id: TENANT_B_ID, user_id: 'fff00001-0000-0000-0000-000000000003' },
];

// ─── Categorias ─────────────────────────────────────────
export const MOCK_CATEGORIAS = [
  { id: 'aaa00001-0000-0000-0000-000000000001', nome: 'Adoração' },
  { id: 'aaa00001-0000-0000-0000-000000000002', nome: 'Celebração' },
  { id: 'aaa00001-0000-0000-0000-000000000003', nome: 'Natal' },
];

// ─── Tonalidades ─────────────────────────────────────────
export const MOCK_TONALIDADES = [
  { id: 'bbb00001-0000-0000-0000-000000000001', tom: 'G' },
  { id: 'bbb00001-0000-0000-0000-000000000002', tom: 'D' },
  { id: 'bbb00001-0000-0000-0000-000000000003', tom: 'C' },
  { id: 'bbb00001-0000-0000-0000-000000000004', tom: 'A' },
  { id: 'bbb00001-0000-0000-0000-000000000005', tom: 'E' },
];

// ─── Funções ─────────────────────────────────────────────
export const MOCK_FUNCOES = [
  { id: 'ccc00001-0000-0000-0000-000000000001', nome: 'Vocal' },
  { id: 'ccc00001-0000-0000-0000-000000000002', nome: 'Guitarra' },
  { id: 'ccc00001-0000-0000-0000-000000000003', nome: 'Teclado' },
  { id: 'ccc00001-0000-0000-0000-000000000004', nome: 'Bateria' },
  { id: 'ccc00001-0000-0000-0000-000000000005', nome: 'Baixo' },
];

// ─── Grupos de Funções ───────────────────────────────────
export const MOCK_FUNCOES_GRUPOS = [
  {
    id: 'ccc00002-0000-0000-0000-000000000001',
    nome: 'Ministração',
    ordem: 1,
    Funcoes: [] as { id: string; nome: string }[],
  },
  {
    id: 'ccc00002-0000-0000-0000-000000000002',
    nome: 'Vocal',
    ordem: 2,
    Funcoes: [{ id: 'ccc00001-0000-0000-0000-000000000001', nome: 'Vocal' }],
  },
  {
    id: 'ccc00002-0000-0000-0000-000000000003',
    nome: 'Instrumentos',
    ordem: 3,
    Funcoes: [
      { id: 'ccc00001-0000-0000-0000-000000000004', nome: 'Bateria' },
      { id: 'ccc00001-0000-0000-0000-000000000005', nome: 'Baixo' },
      { id: 'ccc00001-0000-0000-0000-000000000002', nome: 'Guitarra' },
      { id: 'ccc00001-0000-0000-0000-000000000003', nome: 'Teclado' },
    ],
  },
];

// ─── Tipos de Eventos ────────────────────────────────────
export const MOCK_TIPOS_EVENTOS = [
  { id: 'ddd00001-0000-0000-0000-000000000001', nome: 'Culto Dominical' },
  { id: 'ddd00001-0000-0000-0000-000000000002', nome: 'Ensaio' },
  { id: 'ddd00001-0000-0000-0000-000000000003', nome: 'Conferência' },
];

// ─── Artistas ────────────────────────────────────────────
export const MOCK_ARTISTAS = [
  { id: 'eee00001-0000-0000-0000-000000000001', nome: 'Aline Barros' },
  { id: 'eee00001-0000-0000-0000-000000000002', nome: 'Fernandinho' },
  { id: 'eee00001-0000-0000-0000-000000000003', nome: 'Gabriela Rocha' },
];

// ─── Integrantes (opera sobre Users após unificação) ─────
export const MOCK_INTEGRANTES = [
  {
    id: 'fff00001-0000-0000-0000-000000000001',
    name: 'João Silva',
    email: 'joao@igreja.com',
    password: 'hashed_password_1',
    telefone: '11999990001',
  },
  {
    id: 'fff00001-0000-0000-0000-000000000002',
    name: 'Maria Santos',
    email: 'maria@igreja.com',
    password: 'hashed_password_2',
    telefone: null,
  },
  {
    id: 'fff00001-0000-0000-0000-000000000003',
    name: 'Pedro Oliveira',
    email: 'pedro@igreja.com',
    password: 'hashed_password_3',
    telefone: '11999990003',
  },
];

// ─── Users_Funcoes (junction — ex-Integrantes_Funcoes) ───
export const MOCK_INTEGRANTES_FUNCOES = [
  {
    id: 'jjj00001-0000-0000-0000-000000000001',
    fk_user_id: 'fff00001-0000-0000-0000-000000000001',
    funcao_id: 'ccc00001-0000-0000-0000-000000000001',
  },
  {
    id: 'jjj00001-0000-0000-0000-000000000002',
    fk_user_id: 'fff00001-0000-0000-0000-000000000001',
    funcao_id: 'ccc00001-0000-0000-0000-000000000002',
  },
  {
    id: 'jjj00001-0000-0000-0000-000000000003',
    fk_user_id: 'fff00001-0000-0000-0000-000000000002',
    funcao_id: 'ccc00001-0000-0000-0000-000000000003',
  },
];

// ─── Músicas (4 para testes gerais) ──────────────────────
export const MOCK_MUSICAS_BASE = [
  { id: 'ggg00001-0000-0000-0000-000000000001', nome: 'Rendido Estou', fk_tonalidade: 'bbb00001-0000-0000-0000-000000000001' },
  { id: 'ggg00001-0000-0000-0000-000000000002', nome: 'Grande é o Senhor', fk_tonalidade: 'bbb00001-0000-0000-0000-000000000002' },
  { id: 'ggg00001-0000-0000-0000-000000000003', nome: 'Nada Além do Sangue', fk_tonalidade: 'bbb00001-0000-0000-0000-000000000003' },
  /** Música sem nenhuma versão cadastrada — usada para testar listas vazias de versoes_disponiveis. */
  { id: 'ggg00001-0000-0000-0000-000000000099', nome: 'Música Sem Versões', fk_tonalidade: null as string | null },
];

/**
 * Gera 25 músicas para teste de paginação.
 * As 4 primeiras são provenientes de MOCK_MUSICAS_BASE e as demais são geradas dinamicamente.
 * Cada objeto de música contém as propriedades: id, nome e fk_tonalidade.
 * @returns Lista de músicas mockadas para testes de paginação.
 * As 4 primeiras são as MOCK_MUSICAS_BASE, as demais são geradas.
 */
export function generatePaginationMusicas() {
  const musicas: { id: string; nome: string; fk_tonalidade: string | null }[] = [...MOCK_MUSICAS_BASE];
  for (let i = 5; i <= 25; i++) {
    const padded = String(i).padStart(3, '0');
    musicas.push({
      id: `ggg00001-0000-0000-0000-0000000000${padded.slice(-2).padStart(2, '0')}`,
      nome: `Música de Teste ${i}`,
      fk_tonalidade: MOCK_TONALIDADES[i % MOCK_TONALIDADES.length].id,
    });
  }
  return musicas;
}

// ─── Artistas_Musicas (versões) ──────────────────────────
export const MOCK_ARTISTAS_MUSICAS = [
  {
    id: 'jjj00002-0000-0000-0000-000000000001',
    artista_id: 'eee00001-0000-0000-0000-000000000001',
    musica_id: 'ggg00001-0000-0000-0000-000000000001',
    bpm: 72,
    cifras: 'G D Em C',
    lyrics: 'Rendido estou, rendido estou...',
    link_versao: 'https://exemplo.com/rendido-aline',
    cifraclub_url: 'https://www.cifraclub.com.br/aline-barros/rendido-estou/',
  },
  {
    id: 'jjj00002-0000-0000-0000-000000000002',
    artista_id: 'eee00001-0000-0000-0000-000000000002',
    musica_id: 'ggg00001-0000-0000-0000-000000000001',
    bpm: 76,
    cifras: 'G D Em C',
    lyrics: 'Rendido estou, rendido estou...',
    link_versao: 'https://exemplo.com/rendido-fernandinho',
    cifraclub_url: null,
  },
  {
    id: 'jjj00002-0000-0000-0000-000000000003',
    artista_id: 'eee00001-0000-0000-0000-000000000003',
    musica_id: 'ggg00001-0000-0000-0000-000000000002',
    bpm: 130,
    cifras: 'D A Bm G',
    lyrics: 'Grande é o Senhor...',
    link_versao: null,
    cifraclub_url: null,
  },
  /** Versão sem artista vinculado para testes de artista opcional (spec 024). */
  {
    id: 'jjj00002-0000-0000-0000-000000000004',
    artista_id: null,
    musica_id: 'ggg00001-0000-0000-0000-000000000003',
    bpm: 90,
    cifras: 'Am F C G',
    lyrics: 'Nada além do sangue...',
    link_versao: null,
    cifraclub_url: null,
  },
];

// ─── Musicas_Categorias (junction) ──────────────────────
export const MOCK_MUSICAS_CATEGORIAS = [
  { id: 'jjj00003-0000-0000-0000-000000000001', musica_id: 'ggg00001-0000-0000-0000-000000000001', categoria_id: 'aaa00001-0000-0000-0000-000000000001' },
  { id: 'jjj00003-0000-0000-0000-000000000002', musica_id: 'ggg00001-0000-0000-0000-000000000001', categoria_id: 'aaa00001-0000-0000-0000-000000000002' },
  { id: 'jjj00003-0000-0000-0000-000000000003', musica_id: 'ggg00001-0000-0000-0000-000000000002', categoria_id: 'aaa00001-0000-0000-0000-000000000001' },
];

// ─── Musicas_Funcoes (junction) ──────────────────────────
export const MOCK_MUSICAS_FUNCOES = [
  { id: 'jjj00004-0000-0000-0000-000000000001', musica_id: 'ggg00001-0000-0000-0000-000000000001', funcao_id: 'ccc00001-0000-0000-0000-000000000001' },
  { id: 'jjj00004-0000-0000-0000-000000000002', musica_id: 'ggg00001-0000-0000-0000-000000000001', funcao_id: 'ccc00001-0000-0000-0000-000000000002' },
];

// ─── Eventos ─────────────────────────────────────────────
export const MOCK_EVENTOS = [
  {
    id: 'hhh00001-0000-0000-0000-000000000001',
    data: new Date('2026-03-01T10:00:00Z'),
    fk_tipo_evento: 'ddd00001-0000-0000-0000-000000000001',
    descricao: 'Culto de domingo pela manhã',
  },
  {
    id: 'hhh00001-0000-0000-0000-000000000002',
    data: new Date('2026-03-05T19:00:00Z'),
    fk_tipo_evento: 'ddd00001-0000-0000-0000-000000000002',
    descricao: 'Ensaio semanal da banda',
  },
  {
    id: 'hhh00001-0000-0000-0000-000000000003',
    data: new Date('2026-04-10T08:00:00Z'),
    fk_tipo_evento: 'ddd00001-0000-0000-0000-000000000003',
    descricao: 'Conferência de louvor anual',
  },
];

// ─── Eventos_Musicas (junction) ──────────────────────────
/**
 * Vínculos entre eventos e músicas com versão selecionada opcional (`fk_artistas_musicas`).
 * - Linha 1: evento 1 ↔ música 1, com versão selecionada (Aline) — testa selected populado.
 * - Linha 2: evento 1 ↔ música 2, sem versão selecionada — testa selected null.
 * - Linha 3: evento 3 ↔ música 3, com versão genérica (artista nulo) — testa artista_nome null.
 * - Linha 4: evento 3 ↔ música 4 (sem versões cadastradas) — testa versoes_disponiveis vazio.
 */
export const MOCK_EVENTOS_MUSICAS: {
  id: string;
  evento_id: string;
  musicas_id: string;
  ordem: number;
  fk_artistas_musicas: string | null;
}[] = [
  { id: 'jjj00005-0000-0000-0000-000000000001', evento_id: 'hhh00001-0000-0000-0000-000000000001', musicas_id: 'ggg00001-0000-0000-0000-000000000001', ordem: 1, fk_artistas_musicas: 'jjj00002-0000-0000-0000-000000000001' },
  { id: 'jjj00005-0000-0000-0000-000000000002', evento_id: 'hhh00001-0000-0000-0000-000000000001', musicas_id: 'ggg00001-0000-0000-0000-000000000002', ordem: 2, fk_artistas_musicas: null },
  { id: 'jjj00005-0000-0000-0000-000000000003', evento_id: 'hhh00001-0000-0000-0000-000000000003', musicas_id: 'ggg00001-0000-0000-0000-000000000003', ordem: 1, fk_artistas_musicas: 'jjj00002-0000-0000-0000-000000000004' },
  { id: 'jjj00005-0000-0000-0000-000000000004', evento_id: 'hhh00001-0000-0000-0000-000000000003', musicas_id: 'ggg00001-0000-0000-0000-000000000099', ordem: 2, fk_artistas_musicas: null },
];

// ─── Eventos_Users (junction — ex-Eventos_Integrantes) ───
export const MOCK_EVENTOS_INTEGRANTES = [
  { id: 'jjj00006-0000-0000-0000-000000000001', evento_id: 'hhh00001-0000-0000-0000-000000000001', fk_user_id: 'fff00001-0000-0000-0000-000000000001' },
  { id: 'jjj00006-0000-0000-0000-000000000002', evento_id: 'hhh00001-0000-0000-0000-000000000001', fk_user_id: 'fff00001-0000-0000-0000-000000000002' },
];

// ─── Convites (InviteTokens) ────────────────────────────
/** ID do líder que gera convites nos testes. */
export const INVITE_CREATOR_ID = 'fff00001-0000-0000-0000-000000000001';

/** Convite ativo (expira em 2h a partir de agora). */
export const MOCK_INVITE_ACTIVE = {
  id: 'kkk00001-0000-0000-0000-000000000001',
  token: 'kkk00002-0000-0000-0000-000000000001',
  tenant_id: TENANT_A_ID,
  created_by: INVITE_CREATOR_ID,
  expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
  used_at: null as Date | null,
  used_by: null as string | null,
  revoked_at: null as Date | null,
  created_at: new Date(),
  updated_at: new Date(),
};

/** Convite expirado (expirou 1h atrás). */
export const MOCK_INVITE_EXPIRED = {
  id: 'kkk00001-0000-0000-0000-000000000002',
  token: 'kkk00002-0000-0000-0000-000000000002',
  tenant_id: TENANT_A_ID,
  created_by: INVITE_CREATOR_ID,
  expires_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
  used_at: null as Date | null,
  used_by: null as string | null,
  revoked_at: null as Date | null,
  created_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
  updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
};

/** Convite já utilizado. */
export const MOCK_INVITE_USED = {
  id: 'kkk00001-0000-0000-0000-000000000003',
  token: 'kkk00002-0000-0000-0000-000000000003',
  tenant_id: TENANT_A_ID,
  created_by: INVITE_CREATOR_ID,
  expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000),
  used_at: new Date(),
  used_by: 'fff00001-0000-0000-0000-000000000002',
  revoked_at: null as Date | null,
  created_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
  updated_at: new Date(),
};

/** Convite revogado pelo líder. */
export const MOCK_INVITE_REVOKED = {
  id: 'kkk00001-0000-0000-0000-000000000004',
  token: 'kkk00002-0000-0000-0000-000000000004',
  tenant_id: TENANT_A_ID,
  created_by: INVITE_CREATOR_ID,
  expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000),
  used_at: null as Date | null,
  used_by: null as string | null,
  revoked_at: new Date(),
  created_at: new Date(Date.now() - 30 * 60 * 1000),
  updated_at: new Date(),
};

// ─── UUID inexistente para testes de 404 ─────────────────
export const NON_EXISTENT_ID = 'zzz00000-0000-0000-0000-000000000000';
