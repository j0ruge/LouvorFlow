/**
 * Hook de persistência de rascunho de formulário em localStorage.
 *
 * Salva e recupera dados parcialmente preenchidos do formulário de criação
 * de música, permitindo que o usuário retome o preenchimento após fechar
 * o dialog acidentalmente.
 */

import { useState, useCallback } from "react";
import type { CreateMusicaCompleteForm } from "@/schemas/musica";

/** Chave usada no localStorage para o rascunho de criação de música. */
export const STORAGE_KEY = "louvorflow:draft:musica-create";

/** Retorno do hook useFormDraft. */
interface UseFormDraftReturn {
  /** Dados do rascunho salvo, ou `null` se não houver. */
  draft: CreateMusicaCompleteForm | null;
  /** Indica se existe um rascunho salvo no localStorage. */
  hasDraft: boolean;
  /** Salva os dados do formulário como rascunho no localStorage. */
  saveDraft: (data: CreateMusicaCompleteForm) => void;
  /** Remove o rascunho do localStorage e limpa o estado. */
  clearDraft: () => void;
  /** Remove o rascunho apenas do localStorage, sem alterar o estado do hook. */
  clearStorage: () => void;
}

/**
 * Verifica se os dados do formulário possuem pelo menos um campo significativo preenchido.
 *
 * @param data - Dados do formulário a verificar.
 * @returns `true` se `nome`, `cifras` ou `lyrics` contêm conteúdo não vazio.
 */
export function hasContent(data: CreateMusicaCompleteForm): boolean {
  return (
    (!!data.nome && data.nome.trim() !== "") ||
    (!!data.cifras && data.cifras.trim() !== "") ||
    (!!data.lyrics && data.lyrics.trim() !== "")
  );
}

/**
 * Verifica em tempo de execução se o objeto possui a estrutura mínima
 * esperada de um rascunho `CreateMusicaCompleteForm`.
 *
 * Valida os campos-chave (`nome`, `fk_tonalidade`, `artista_id`) como strings,
 * garantindo que dados corrompidos ou de formato incompatível sejam descartados.
 *
 * @param obj - Valor desconhecido vindo do JSON.parse.
 * @returns `true` se o objeto possui os campos obrigatórios com tipos corretos.
 */
export function isValidDraftShape(obj: unknown): obj is CreateMusicaCompleteForm {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.nome === "string" &&
    typeof r.fk_tonalidade === "string" &&
    typeof r.artista_id === "string"
  );
}

/**
 * Tenta ler e parsear o rascunho salvo no localStorage.
 * Valida a estrutura do objeto parseado antes de retorná-lo.
 *
 * @returns Dados do rascunho ou `null` se não existir, estiver corrompido ou com formato inválido.
 */
export function readDraft(): CreateMusicaCompleteForm | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraftShape(parsed)) return null;
    return {
      ...parsed,
      categoria_ids: parsed.categoria_ids ?? [],
      funcao_ids: parsed.funcao_ids ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Hook para persistir rascunhos do formulário de criação de música em localStorage.
 *
 * Lê o rascunho uma única vez no mount via lazy initializer do useState.
 * Oferece métodos para salvar e limpar o rascunho.
 *
 * @returns Objeto com `draft`, `hasDraft`, `saveDraft` e `clearDraft`.
 */
export function useFormDraft(): UseFormDraftReturn {
  const [draft, setDraft] = useState<CreateMusicaCompleteForm | null>(readDraft);

  /**
   * Salva os dados do formulário como rascunho no localStorage.
   * Ignora dados vazios (sem nome, cifras ou lyrics preenchidos).
   *
   * @param data - Dados atuais do formulário.
   */
  const saveDraft = useCallback((data: CreateMusicaCompleteForm) => {
    if (!hasContent(data)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setDraft(data);
    } catch {
      // localStorage indisponível ou cheio — falha silenciosa
    }
  }, []);

  /**
   * Remove o rascunho do localStorage e limpa o estado interno.
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage indisponível — falha silenciosa
    }
    setDraft(null);
  }, []);

  /**
   * Remove o rascunho apenas do localStorage, sem alterar o estado do hook.
   * Útil quando o rascunho já foi aplicado ao formulário e queremos apenas
   * evitar que seja oferecido novamente em aberturas futuras.
   */
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage indisponível — falha silenciosa
    }
  }, []);

  return {
    draft,
    hasDraft: draft !== null,
    saveDraft,
    clearDraft,
    clearStorage,
  };
}
