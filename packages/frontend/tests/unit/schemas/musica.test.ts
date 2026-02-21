/**
 * Testes unitários para os schemas Zod de criação/edição completa de música.
 *
 * Valida o comportamento do `superRefine` em `CreateMusicaCompleteFormSchema`
 * (artista obrigatório quando campos de versão são preenchidos) e as regras
 * de validação de `UpdateMusicaCompleteFormSchema`.
 */

import { describe, it, expect } from 'vitest';
import {
  CreateMusicaCompleteFormSchema,
  UpdateMusicaCompleteFormSchema,
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

  // ─── superRefine: artista obrigatório com campos de versão ───

  it('deve rejeitar quando bpm preenchido sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      bpm: 120,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const artistaIssue = result.error.issues.find(i => i.path.includes('artista_id'));
      expect(artistaIssue).toBeDefined();
      expect(artistaIssue?.message).toBe('Artista é obrigatório quando campos de versão são preenchidos');
    }
  });

  it('deve rejeitar quando cifras preenchidas sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      cifras: 'G D Em C',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const artistaIssue = result.error.issues.find(i => i.path.includes('artista_id'));
      expect(artistaIssue).toBeDefined();
    }
  });

  it('deve rejeitar quando lyrics preenchidas sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      lyrics: 'Letra da música...',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const artistaIssue = result.error.issues.find(i => i.path.includes('artista_id'));
      expect(artistaIssue).toBeDefined();
    }
  });

  it('deve rejeitar quando link_versao preenchido sem artista', () => {
    const result = CreateMusicaCompleteFormSchema.safeParse({
      nome: 'Teste',
      link_versao: 'https://exemplo.com/versao',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const artistaIssue = result.error.issues.find(i => i.path.includes('artista_id'));
      expect(artistaIssue).toBeDefined();
    }
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
});
