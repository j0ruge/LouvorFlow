/**
 * Dados mockados centralizados para testes unitários.
 * UUIDs fixos e previsíveis para facilitar asserções.
 * Contexto: ministério de louvor gospel.
 */

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

// ─── Integrantes ─────────────────────────────────────────
export const MOCK_INTEGRANTES = [
  {
    id: 'fff00001-0000-0000-0000-000000000001',
    nome: 'João Silva',
    doc_id: '12345678900',
    email: 'joao@igreja.com',
    senha: 'hashed_password_1',
    telefone: '11999990001',
  },
  {
    id: 'fff00001-0000-0000-0000-000000000002',
    nome: 'Maria Santos',
    doc_id: '98765432100',
    email: 'maria@igreja.com',
    senha: 'hashed_password_2',
    telefone: null,
  },
  {
    id: 'fff00001-0000-0000-0000-000000000003',
    nome: 'Pedro Oliveira',
    doc_id: '11122233344',
    email: 'pedro@igreja.com',
    senha: 'hashed_password_3',
    telefone: '11999990003',
  },
];

// ─── Integrantes_Funcoes (junction) ──────────────────────
export const MOCK_INTEGRANTES_FUNCOES = [
  {
    id: 'jjj00001-0000-0000-0000-000000000001',
    fk_integrante_id: 'fff00001-0000-0000-0000-000000000001',
    funcao_id: 'ccc00001-0000-0000-0000-000000000001',
  },
  {
    id: 'jjj00001-0000-0000-0000-000000000002',
    fk_integrante_id: 'fff00001-0000-0000-0000-000000000001',
    funcao_id: 'ccc00001-0000-0000-0000-000000000002',
  },
  {
    id: 'jjj00001-0000-0000-0000-000000000003',
    fk_integrante_id: 'fff00001-0000-0000-0000-000000000002',
    funcao_id: 'ccc00001-0000-0000-0000-000000000003',
  },
];

// ─── Músicas (3 para testes gerais) ──────────────────────
export const MOCK_MUSICAS_BASE = [
  { id: 'ggg00001-0000-0000-0000-000000000001', nome: 'Rendido Estou', fk_tonalidade: 'bbb00001-0000-0000-0000-000000000001' },
  { id: 'ggg00001-0000-0000-0000-000000000002', nome: 'Grande é o Senhor', fk_tonalidade: 'bbb00001-0000-0000-0000-000000000002' },
  { id: 'ggg00001-0000-0000-0000-000000000003', nome: 'Nada Além do Sangue', fk_tonalidade: 'bbb00001-0000-0000-0000-000000000003' },
];

/**
 * Gera 25 músicas para teste de paginação.
 * As 3 primeiras são provenientes de MOCK_MUSICAS_BASE e as demais são geradas dinamicamente.
 * Cada objeto de música contém as propriedades: id, nome e fk_tonalidade.
 * @returns Lista de músicas mockadas para testes de paginação. 
 * As 3 primeiras são as MOCK_MUSICAS_BASE, as demais são geradas.
 */
export function generatePaginationMusicas() {
  const musicas = [...MOCK_MUSICAS_BASE];
  for (let i = 4; i <= 25; i++) {
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
  },
  {
    id: 'jjj00002-0000-0000-0000-000000000002',
    artista_id: 'eee00001-0000-0000-0000-000000000002',
    musica_id: 'ggg00001-0000-0000-0000-000000000001',
    bpm: 76,
    cifras: 'G D Em C',
    lyrics: 'Rendido estou, rendido estou...',
    link_versao: 'https://exemplo.com/rendido-fernandinho',
  },
  {
    id: 'jjj00002-0000-0000-0000-000000000003',
    artista_id: 'eee00001-0000-0000-0000-000000000003',
    musica_id: 'ggg00001-0000-0000-0000-000000000002',
    bpm: 130,
    cifras: 'D A Bm G',
    lyrics: 'Grande é o Senhor...',
    link_versao: null,
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
export const MOCK_EVENTOS_MUSICAS = [
  { id: 'jjj00005-0000-0000-0000-000000000001', evento_id: 'hhh00001-0000-0000-0000-000000000001', musicas_id: 'ggg00001-0000-0000-0000-000000000001' },
  { id: 'jjj00005-0000-0000-0000-000000000002', evento_id: 'hhh00001-0000-0000-0000-000000000001', musicas_id: 'ggg00001-0000-0000-0000-000000000002' },
];

// ─── Eventos_Integrantes (junction) ──────────────────────
export const MOCK_EVENTOS_INTEGRANTES = [
  { id: 'jjj00006-0000-0000-0000-000000000001', evento_id: 'hhh00001-0000-0000-0000-000000000001', fk_integrante_id: 'fff00001-0000-0000-0000-000000000001' },
  { id: 'jjj00006-0000-0000-0000-000000000002', evento_id: 'hhh00001-0000-0000-0000-000000000001', fk_integrante_id: 'fff00001-0000-0000-0000-000000000002' },
];

// ─── UUID inexistente para testes de 404 ─────────────────
export const NON_EXISTENT_ID = 'zzz00000-0000-0000-0000-000000000000';
