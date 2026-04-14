/**
 * Testes unitários para os schemas Zod do módulo de eventos (escalas).
 *
 * Valida que `VersaoMusicaSchema` e `MusicaEventoSchema` parseiam
 * corretamente dados populados, vazios e inválidos, cobrindo os campos
 * de versão selecionada e versões disponíveis.
 */

import { describe, it, expect } from 'vitest';
import { VersaoMusicaSchema, MusicaEventoSchema } from '@/schemas/evento';

/** UUID válido para testes. */
const VALID_UUID = 'aaa00001-0000-0000-0000-000000000001';
const VALID_UUID_2 = 'bbb00001-0000-0000-0000-000000000002';
const VALID_UUID_3 = 'ccc00001-0000-0000-0000-000000000003';
const VALID_UUID_TONALIDADE = 'ddd00001-0000-0000-0000-000000000004';

/**
 * Suite de testes do `VersaoMusicaSchema`: valida parsing de versões com/sem
 * artista e link, rejeição de id não-UUID e de campos obrigatórios ausentes.
 */
describe('VersaoMusicaSchema', () => {
  /** Deve aceitar versão completa com artista e link. */
  it('deve aceitar versão com artista_nome e link_versao preenchidos', () => {
    const result = VersaoMusicaSchema.safeParse({
      id: VALID_UUID,
      artista_nome: 'Gabriela Rocha',
      link_versao: 'https://youtu.be/abc123',
    });
    expect(result.success).toBe(true);
  });

  /** Deve aceitar versão genérica sem artista nem link (ambos null). */
  it('deve aceitar artista_nome: null e link_versao: null (versão genérica)', () => {
    const result = VersaoMusicaSchema.safeParse({
      id: VALID_UUID,
      artista_nome: null,
      link_versao: null,
    });
    expect(result.success).toBe(true);
  });

  /** Deve rejeitar id que não é UUID válido. */
  it('deve rejeitar id não-UUID', () => {
    const result = VersaoMusicaSchema.safeParse({
      id: 'nao-e-uuid',
      artista_nome: 'Artista',
      link_versao: null,
    });
    expect(result.success).toBe(false);
  });

  /** Deve rejeitar quando campo obrigatório id está ausente. */
  it('deve rejeitar quando id está ausente', () => {
    const result = VersaoMusicaSchema.safeParse({
      artista_nome: 'Artista',
      link_versao: null,
    });
    expect(result.success).toBe(false);
  });
});

/**
 * Suite de testes do `MusicaEventoSchema`: valida o shape da música no evento
 * (incluindo `versao_selecionada` e `versoes_disponiveis`) e rejeição de campos
 * obrigatórios ausentes.
 */
describe('MusicaEventoSchema', () => {
  /** Deve aceitar item com versão selecionada e versões disponíveis populadas. */
  it('deve aceitar item com versao_selecionada e versoes_disponiveis populados', () => {
    const result = MusicaEventoSchema.safeParse({
      id: VALID_UUID,
      nome: 'Lugar Secreto',
      tonalidade: { id: VALID_UUID_TONALIDADE, tom: 'G' },
      ordem: 1,
      versao_selecionada: {
        id: VALID_UUID_2,
        artista_nome: 'Gabriela Rocha',
        link_versao: 'https://youtu.be/abc',
      },
      versoes_disponiveis: [
        {
          id: VALID_UUID_2,
          artista_nome: 'Gabriela Rocha',
          link_versao: 'https://youtu.be/abc',
        },
        {
          id: VALID_UUID_3,
          artista_nome: 'Aline Barros',
          link_versao: 'https://youtu.be/def',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  /** Deve aceitar versao_selecionada: null com versoes_disponiveis vazio. */
  it('deve aceitar versao_selecionada: null com versoes_disponiveis: []', () => {
    const result = MusicaEventoSchema.safeParse({
      id: VALID_UUID,
      nome: 'Rendido Estou',
      tonalidade: null,
      ordem: 2,
      versao_selecionada: null,
      versoes_disponiveis: [],
    });
    expect(result.success).toBe(true);
  });

  /** Deve rejeitar quando versoes_disponiveis está ausente (campo obrigatório). */
  it('deve rejeitar item sem versoes_disponiveis', () => {
    const result = MusicaEventoSchema.safeParse({
      id: VALID_UUID,
      nome: 'Teste',
      tonalidade: null,
      ordem: 1,
      versao_selecionada: null,
    });
    expect(result.success).toBe(false);
  });

  /** Deve rejeitar quando versao_selecionada está ausente (campo obrigatório). */
  it('deve rejeitar item sem versao_selecionada', () => {
    const result = MusicaEventoSchema.safeParse({
      id: VALID_UUID,
      nome: 'Teste',
      tonalidade: null,
      ordem: 1,
      versoes_disponiveis: [],
    });
    expect(result.success).toBe(false);
  });

  /** Deve aceitar tonalidade null com versões populadas. */
  it('deve aceitar tonalidade null com versões preenchidas', () => {
    const result = MusicaEventoSchema.safeParse({
      id: VALID_UUID,
      nome: 'Teste',
      tonalidade: null,
      ordem: 3,
      versao_selecionada: {
        id: VALID_UUID_2,
        artista_nome: null,
        link_versao: null,
      },
      versoes_disponiveis: [
        { id: VALID_UUID_2, artista_nome: null, link_versao: null },
      ],
    });
    expect(result.success).toBe(true);
  });
});
