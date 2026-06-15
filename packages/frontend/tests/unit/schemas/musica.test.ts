/**
 * Testes unitários para os schemas Zod de criação/edição completa de música.
 *
 * Valida que artista é opcional em `CreateMusicaCompleteFormSchema`
 * (campos de versão aceitos sem artista) e as regras de validação
 * de `UpdateMusicaCompleteFormSchema`.
 */

import { describe, it, expect } from 'vitest';
import {
  CreateMusicaCompleteFormSchema,
  UpdateMusicaCompleteFormSchema,
  VersaoSchema,
  CreateVersaoFormSchema,
} from '@/schemas/musica';

/** UUID válido para testes. */
const VALID_UUID = 'aaa00001-0000-0000-0000-000000000001';
const VALID_UUID_2 = 'bbb00001-0000-0000-0000-000000000002';

describe('CreateMusicaCompleteFormSchema', () => {
  it('deve aceitar apenas nome (criação mínima)', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({ nome: 'Rendido Estou' });
    expect(result.success).toBe(true);
  });

  it('deve aceitar todos os campos preenchidos com artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Rendido Estou',
      fk_tonalidade: VALID_UUID,
      artista_id: VALID_UUID_2,
      bpm: 120,
      cifras: 'G D Em C',
      lyrics: 'Letra...',
      link_versao: 'https://exemplo.com/versao',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar quando nome está vazio', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({ nome: '' });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar quando nome não é enviado', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('deve aceitar campos opcionais como strings vazias', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      fk_tonalidade: '',
      artista_id: '',
      bpm: '',
      cifras: '',
      lyrics: '',
      link_versao: '',
    });
    expect(result.success).toBe(true);
  });

  // ─── Artista opcional: campos de versão aceitos sem artista (spec 024) ───

  /** Deve aceitar bpm preenchido sem artista (artista é opcional). */
  it('deve aceitar quando bpm preenchido sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      bpm: 120,
    });
    expect(result.success).toBe(true);
  });

  /** Deve aceitar cifras preenchidas sem artista (artista é opcional). */
  it('deve aceitar quando cifras preenchidas sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      cifras: 'G D Em C',
    });
    expect(result.success).toBe(true);
  });

  /** Deve aceitar lyrics preenchidas sem artista (artista é opcional). */
  it('deve aceitar quando lyrics preenchidas sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      lyrics: 'Letra da música...',
    });
    expect(result.success).toBe(true);
  });

  /** Deve aceitar link_versao preenchido sem artista (artista é opcional). */
  it('deve aceitar quando link_versao preenchido sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      link_versao: 'https://exemplo.com/versao',
    });
    expect(result.success).toBe(true);
  });

  it('deve aceitar artista sem campos de versão (versão vazia)', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      artista_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('deve aceitar artista com artista_id como string vazia e sem campos de versão', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      artista_id: '',
    });
    expect(result.success).toBe(true);
  });

  // ─── Validação de categoria_ids e funcao_ids ───

  it('deve aceitar categoria_ids como array de UUIDs válidos', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      categoria_ids: [VALID_UUID, VALID_UUID_2],
    });
    expect(result.success).toBe(true);
  });

  it('deve aceitar funcao_ids como array de UUIDs válidos', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      funcao_ids: [VALID_UUID],
    });
    expect(result.success).toBe(true);
  });

  it('deve aceitar arrays vazios de categoria_ids e funcao_ids', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      categoria_ids: [],
      funcao_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar categoria_ids com UUID inválido', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      categoria_ids: ['nao-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('deve usar default vazio quando categoria_ids não é enviado', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({ nome: 'Teste' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoria_ids).toEqual([]);
    }
  });

  // ─── Validação de URL ───

  it('deve rejeitar link_versao com URL inválida', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      artista_id: VALID_UUID,
      link_versao: 'nao-e-url',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar link_versao com protocolo ftp', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      artista_id: VALID_UUID,
      link_versao: 'ftp://exemplo.com/versao',
    });
    expect(result.success).toBe(false);
  });

  // ─── Validação de UUID ───

  it('deve rejeitar fk_tonalidade com UUID inválido', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      fk_tonalidade: 'nao-uuid',
    });
    expect(result.success).toBe(false);
  });

  // ─── Validação de BPM ───

  it('deve rejeitar bpm menor que 1', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      artista_id: VALID_UUID,
      bpm: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateMusicaCompleteFormSchema', () => {
  it('deve aceitar apenas nome (atualização mínima)', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({ nome: 'Novo Nome' });
    expect(result.success).toBe(true);
  });

  it('deve aceitar todos os campos preenchidos', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({
      nome: 'Novo Nome',
      fk_tonalidade: VALID_UUID,
      versao_id: VALID_UUID_2,
      bpm: 90,
      cifras: 'Am G F C',
      lyrics: 'Nova letra...',
      link_versao: 'https://exemplo.com/nova',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar quando nome está vazio', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({ nome: '' });
    expect(result.success).toBe(false);
  });

  it('deve aceitar campos opcionais como strings vazias', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      fk_tonalidade: '',
      versao_id: '',
      bpm: '',
      cifras: '',
      lyrics: '',
      link_versao: '',
    });
    expect(result.success).toBe(true);
  });

  it('deve aceitar versao_id como UUID válido', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      versao_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar versao_id com UUID inválido', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      versao_id: 'nao-uuid',
    });
    expect(result.success).toBe(false);
  });

  // ─── Validação de categoria_ids e funcao_ids ───

  it('deve aceitar categoria_ids e funcao_ids na atualização', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      categoria_ids: [VALID_UUID],
      funcao_ids: [VALID_UUID, VALID_UUID_2],
    });
    expect(result.success).toBe(true);
  });

  it('deve usar default vazio quando categoria_ids não é enviado na atualização', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({ nome: 'Teste' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoria_ids).toEqual([]);
      expect(result.data.funcao_ids).toEqual([]);
    }
  });

  it('deve rejeitar funcao_ids com UUID inválido na atualização', () => {
    const result = UpdateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      funcao_ids: ['invalido'],
    });
    expect(result.success).toBe(false);
  });
});

// ─── cifraclub_url ───────────────────────────────────────
describe('cifraclub_url persistence schemas', () => {
  /** Deve aceitar cifraclub_url válida no VersaoSchema (resposta API). */
  it('VersaoSchema deve aceitar cifraclub_url válida', () => {
    const result = VersaoSchema.safeParse({
      id: VALID_UUID,
      artista: { id: VALID_UUID_2, nome: 'Aline Barros' },
      bpm: 72,
      cifras: 'G D Em C',
      lyrics: 'Rendido estou...',
      link_versao: 'https://exemplo.com/versao',
      cifraclub_url: 'https://www.cifraclub.com.br/diante-do-trono/a-ele-gloria/',
      intensidade: 'calma',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cifraclub_url).toBe('https://www.cifraclub.com.br/diante-do-trono/a-ele-gloria/');
    }
  });

  /** Deve aceitar cifraclub_url null no VersaoSchema. */
  it('VersaoSchema deve aceitar cifraclub_url null', () => {
    const result = VersaoSchema.safeParse({
      id: VALID_UUID,
      artista: null,
      bpm: null,
      cifras: null,
      lyrics: null,
      link_versao: null,
      cifraclub_url: null,
      intensidade: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cifraclub_url).toBeNull();
    }
  });

  /** Deve aceitar cifraclub_url no CreateVersaoFormSchema. */
  it('CreateVersaoFormSchema deve aceitar cifraclub_url válida', () => {
    const result = CreateVersaoFormSchema.safeParse({
      cifraclub_url: 'https://www.cifraclub.com.br/diante-do-trono/a-ele-gloria/',
    });
    expect(result.success).toBe(true);
  });

  /** Deve aceitar cifraclub_url no CreateMusicaCompleteFormSchema. */
  it('CreateMusicaCompleteFormSchema deve aceitar cifraclub_url válida', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'A Ele Glória',
      cifraclub_url: 'https://www.cifraclub.com.br/diante-do-trono/a-ele-gloria/',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cifraclub_url).toBe('https://www.cifraclub.com.br/diante-do-trono/a-ele-gloria/');
    }
  });

  /** Deve aceitar cifraclub_url vazia (campo opcional). */
  it('CreateMusicaCompleteFormSchema deve aceitar cifraclub_url vazia', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      cifraclub_url: '',
    });
    expect(result.success).toBe(true);
  });

  /** Deve rejeitar cifraclub_url com protocolo javascript. */
  it('CreateMusicaCompleteFormSchema deve rejeitar cifraclub_url com protocolo inseguro', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      cifraclub_url: 'javascript:alert(1)',
    });
    expect(result.success).toBe(false);
  });
});
