/**
 * Testes unitários para as funções utilitárias do hook useFormDraft.
 *
 * Cobre `hasContent`, `isValidDraftShape` e `readDraft` — a lógica pura
 * de verificação e leitura de rascunho em localStorage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  hasContent,
  isValidDraftShape,
  readDraft,
  STORAGE_KEY,
} from '@/hooks/use-form-draft';
import type { CreateMusicaCompleteForm } from '@/schemas/musica';

/** Dados de rascunho válidos para uso nos testes. */
const VALID_DRAFT: CreateMusicaCompleteForm = {
  nome: 'Rendido Estou',
  fk_tonalidade: '',
  artista_id: '',
  bpm: '',
  cifras: '',
  lyrics: '',
  link_versao: '',
  categoria_ids: [],
  funcao_ids: [],
};

/** Dados de rascunho completamente vazios. */
const EMPTY_DRAFT: CreateMusicaCompleteForm = {
  nome: '',
  fk_tonalidade: '',
  artista_id: '',
  bpm: '',
  cifras: '',
  lyrics: '',
  link_versao: '',
  categoria_ids: [],
  funcao_ids: [],
};

/** Mock do localStorage para ambiente node. */
function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((_index: number) => null),
    /** Acessa o store interno para setup de dados nos testes. */
    _store: store,
  };
}

describe('hasContent', () => {
  it('deve retornar true quando nome está preenchido', () => {
    expect(hasContent({ ...EMPTY_DRAFT, nome: 'Teste' })).toBe(true);
  });

  it('deve retornar true quando cifras estão preenchidas', () => {
    expect(hasContent({ ...EMPTY_DRAFT, cifras: 'Am G C' })).toBe(true);
  });

  it('deve retornar true quando lyrics está preenchido', () => {
    expect(hasContent({ ...EMPTY_DRAFT, lyrics: 'Letra da música' })).toBe(true);
  });

  it('deve retornar false quando todos os campos relevantes estão vazios', () => {
    expect(hasContent(EMPTY_DRAFT)).toBe(false);
  });

  it('deve retornar false quando campos relevantes contêm apenas espaços em branco', () => {
    expect(hasContent({ ...EMPTY_DRAFT, nome: '   ', cifras: '  ', lyrics: '\t' })).toBe(false);
  });

  it('deve ignorar campos não-relevantes (bpm, fk_tonalidade, artista_id, link_versao)', () => {
    const data: CreateMusicaCompleteForm = {
      nome: '',
      fk_tonalidade: 'aaa00001-0000-0000-0000-000000000001',
      artista_id: 'bbb00001-0000-0000-0000-000000000001',
      bpm: '120',
      cifras: '',
      lyrics: '',
      link_versao: 'https://example.com',
    };
    expect(hasContent(data)).toBe(false);
  });
});

describe('isValidDraftShape', () => {
  it('deve aceitar objeto com todos os campos obrigatórios como string', () => {
    expect(isValidDraftShape(VALID_DRAFT)).toBe(true);
  });

  it('deve aceitar objeto com campos extras (passthrough)', () => {
    expect(isValidDraftShape({ ...VALID_DRAFT, extra: 'campo' })).toBe(true);
  });

  it('deve rejeitar null', () => {
    expect(isValidDraftShape(null)).toBe(false);
  });

  it('deve rejeitar undefined', () => {
    expect(isValidDraftShape(undefined)).toBe(false);
  });

  it('deve rejeitar string', () => {
    expect(isValidDraftShape('string')).toBe(false);
  });

  it('deve rejeitar número', () => {
    expect(isValidDraftShape(42)).toBe(false);
  });

  it('deve rejeitar array', () => {
    expect(isValidDraftShape([1, 2, 3])).toBe(false);
  });

  it('deve rejeitar objeto sem campo nome', () => {
    expect(isValidDraftShape({ fk_tonalidade: '', artista_id: '' })).toBe(false);
  });

  it('deve rejeitar objeto com nome não-string', () => {
    expect(isValidDraftShape({ nome: 123, fk_tonalidade: '', artista_id: '' })).toBe(false);
  });

  it('deve rejeitar objeto sem fk_tonalidade', () => {
    expect(isValidDraftShape({ nome: 'Teste', artista_id: '' })).toBe(false);
  });

  it('deve rejeitar objeto com fk_tonalidade não-string', () => {
    expect(isValidDraftShape({ nome: 'Teste', fk_tonalidade: 42, artista_id: '' })).toBe(false);
  });

  it('deve rejeitar objeto sem artista_id', () => {
    expect(isValidDraftShape({ nome: 'Teste', fk_tonalidade: '' })).toBe(false);
  });

  it('deve rejeitar objeto com artista_id não-string', () => {
    expect(isValidDraftShape({ nome: 'Teste', fk_tonalidade: '', artista_id: true })).toBe(false);
  });
});

describe('readDraft', () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', storageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve retornar null quando localStorage está vazio', () => {
    expect(readDraft()).toBeNull();
  });

  it('deve retornar dados válidos do localStorage', () => {
    storageMock._store[STORAGE_KEY] = JSON.stringify(VALID_DRAFT);
    expect(readDraft()).toEqual(VALID_DRAFT);
  });

  it('deve retornar null para JSON inválido no localStorage', () => {
    storageMock._store[STORAGE_KEY] = '{invalid json';
    expect(readDraft()).toBeNull();
  });

  it('deve retornar null para dados com formato inválido (sem campos obrigatórios)', () => {
    storageMock._store[STORAGE_KEY] = JSON.stringify({ foo: 'bar' });
    expect(readDraft()).toBeNull();
  });

  it('deve retornar null para valor não-objeto no localStorage', () => {
    storageMock._store[STORAGE_KEY] = '"apenas uma string"';
    expect(readDraft()).toBeNull();
  });

  it('deve retornar null quando localStorage.getItem lança exceção', () => {
    storageMock.getItem.mockImplementation(() => {
      throw new Error('Storage indisponível');
    });
    expect(readDraft()).toBeNull();
  });
});
