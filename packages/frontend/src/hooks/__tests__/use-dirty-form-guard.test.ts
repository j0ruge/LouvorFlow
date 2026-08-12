/**
 * Testes do `useDirtyFormGuard` — máquina de estados da guarda de alterações
 * não salvas em formulários de overlay.
 *
 * Cobre as transições: fechamento direto quando limpo, abertura do veil
 * quando sujo (inclusive durante submit pendente — o guard não desarma),
 * "continuar editando" (fecha só o veil), "descartar" (fecha o veil e o
 * overlay, com `aoDescartar` idempotente por exibição do veil) e o
 * fechamento automático do veil quando `temAlteracoes` cai para `false`
 * (pós-submit/`reset()`).
 *
 * Cobre também a captura/restauração de foco: em browser real o `inert`
 * rouba o foco no mesmo commit que monta o veil, então a captura precisa
 * acontecer no momento do EVENTO (`pedirFechamento`), antes do
 * `setVeilAberto`. O jsdom não simula esse blur do `inert`, por isso os
 * testes movem o foco explicitamente APÓS `pedirFechamento` e verificam que
 * a restauração volta ao elemento capturado no evento, não ao focado depois.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";
import type { UseDirtyFormGuardOptions } from "@/hooks/use-dirty-form-guard";

/**
 * Renderiza o hook com opções controláveis via rerender.
 *
 * @param options - Opções iniciais do guard.
 * @returns Resultado do `renderHook` para inspeção e rerender.
 */
function renderGuard(options: UseDirtyFormGuardOptions) {
  return renderHook((props: UseDirtyFormGuardOptions) => useDirtyFormGuard(props), {
    initialProps: options,
  });
}

describe("useDirtyFormGuard", () => {
  /** Sem alterações, pedirFechamento fecha direto sem abrir o veil. */
  it("fecha direto quando o formulário está limpo", () => {
    const aoFechar = vi.fn();
    const { result } = renderGuard({ temAlteracoes: false, aoFechar });

    act(() => result.current.pedirFechamento());

    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(result.current.veilAberto).toBe(false);
    expect(result.current.bloqueiaSaida).toBe(false);
  });

  /** Com alterações, pedirFechamento abre o veil e NÃO fecha o overlay. */
  it("abre o veil quando o formulário está sujo, sem fechar", () => {
    const aoFechar = vi.fn();
    const { result } = renderGuard({ temAlteracoes: true, aoFechar });

    act(() => result.current.pedirFechamento());

    expect(result.current.veilAberto).toBe(true);
    expect(aoFechar).not.toHaveBeenCalled();
  });

  /** bloqueiaSaida permanece true com o veil aberto (Esc sobre o veil não pode fechar o drawer). */
  it("mantém bloqueiaSaida true com o veil aberto", () => {
    const { result } = renderGuard({ temAlteracoes: true, aoFechar: vi.fn() });

    act(() => result.current.pedirFechamento());

    expect(result.current.veilAberto).toBe(true);
    expect(result.current.bloqueiaSaida).toBe(true);
  });

  /** pedirFechamento é idempotente: com o veil já aberto, apenas o mantém aberto. */
  it("mantém o veil aberto ao repetir pedirFechamento", () => {
    const aoFechar = vi.fn();
    const { result } = renderGuard({ temAlteracoes: true, aoFechar });

    act(() => result.current.pedirFechamento());
    act(() => result.current.pedirFechamento());

    expect(result.current.veilAberto).toBe(true);
    expect(aoFechar).not.toHaveBeenCalled();
  });

  /** continuarEditando fecha o veil mantendo o overlay aberto. */
  it("continuarEditando fecha o veil sem fechar o overlay", () => {
    const aoFechar = vi.fn();
    const { result } = renderGuard({ temAlteracoes: true, aoFechar });

    act(() => result.current.pedirFechamento());
    act(() => result.current.continuarEditando());

    expect(result.current.veilAberto).toBe(false);
    expect(aoFechar).not.toHaveBeenCalled();
  });

  /**
   * Decisão consciente (desvio do plano, aprovado): o guard fica armado
   * durante submit pendente — o consumidor NÃO inclui `!isPending` em
   * `temAlteracoes`. Se desarmasse, Esc/backdrop durante o in-flight
   * fechariam sem confirmação e uma mutation que falha perderia tudo. O
   * caminho feliz não precisa do desarme: o `onSuccess` fecha via
   * `onOpenChange(false)` do pai (não passa pelo guard) e o `reset()`
   * derruba `temAlteracoes`, fechando o veil sozinho.
   */
  it("abre o veil ao pedir saída durante submit pendente, em vez de fechar direto", () => {
    const aoFechar = vi.fn();
    // Submit in-flight: formulário continua sujo (reset() só roda no onSuccess).
    const { result } = renderGuard({ temAlteracoes: true, aoFechar });

    act(() => result.current.pedirFechamento());

    expect(result.current.veilAberto).toBe(true);
    expect(result.current.bloqueiaSaida).toBe(true);
    expect(aoFechar).not.toHaveBeenCalled();
  });

  /** descartar fecha o veil e chama aoDescartar e aoFechar. */
  it("descartar chama aoDescartar e aoFechar e fecha o veil", () => {
    const aoFechar = vi.fn();
    const aoDescartar = vi.fn();
    const { result } = renderGuard({
      temAlteracoes: true,
      aoFechar,
      aoDescartar,
    });

    act(() => result.current.pedirFechamento());
    act(() => result.current.descartar());

    expect(result.current.veilAberto).toBe(false);
    expect(aoDescartar).toHaveBeenCalledTimes(1);
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  /** descartar funciona sem aoDescartar (callback opcional). */
  it("descartar funciona sem aoDescartar", () => {
    const aoFechar = vi.fn();
    const { result } = renderGuard({ temAlteracoes: true, aoFechar });

    act(() => result.current.pedirFechamento());
    act(() => result.current.descartar());

    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(result.current.veilAberto).toBe(false);
  });

  /** Duplo clique em "Descartar" não roda aoDescartar duas vezes. */
  it("aoDescartar roda no máximo uma vez por exibição do veil (duplo clique)", () => {
    const aoFechar = vi.fn();
    const aoDescartar = vi.fn();
    const { result } = renderGuard({
      temAlteracoes: true,
      aoFechar,
      aoDescartar,
    });

    act(() => result.current.pedirFechamento());
    act(() => result.current.descartar());
    act(() => result.current.descartar());

    expect(aoDescartar).toHaveBeenCalledTimes(1);
  });

  /** Uma nova exibição do veil rearma o aoDescartar (a guarda é por ciclo). */
  it("rearma aoDescartar quando o veil abre de novo", () => {
    const aoFechar = vi.fn();
    const aoDescartar = vi.fn();
    const { result } = renderGuard({
      temAlteracoes: true,
      aoFechar,
      aoDescartar,
    });

    act(() => result.current.pedirFechamento());
    act(() => result.current.descartar());
    act(() => result.current.pedirFechamento());
    act(() => result.current.descartar());

    expect(aoDescartar).toHaveBeenCalledTimes(2);
  });

  /** temAlteracoes caindo para false (ex.: reset() pós-submit) fecha o veil sozinho. */
  it("fecha o veil quando temAlteracoes cai para false", () => {
    const aoFechar = vi.fn();
    const { result, rerender } = renderGuard({ temAlteracoes: true, aoFechar });

    act(() => result.current.pedirFechamento());
    expect(result.current.veilAberto).toBe(true);

    rerender({ temAlteracoes: false, aoFechar });

    expect(result.current.veilAberto).toBe(false);
    expect(result.current.bloqueiaSaida).toBe(false);
  });

  /**
   * A captura de foco acontece no momento do EVENTO: `pedirFechamento`
   * guarda o `document.activeElement` ANTES de abrir o veil. Movendo o foco
   * depois (como o `inert` + o foco inicial do veil fazem em browser real),
   * a restauração no fechamento do veil volta ao elemento capturado no
   * evento — não ao que estava focado no momento do fechamento.
   */
  it("captura o foco no evento e restaura ao fechar o veil", () => {
    const origem = document.createElement("button");
    const outro = document.createElement("button");
    document.body.append(origem, outro);
    origem.focus();

    const { result } = renderGuard({ temAlteracoes: true, aoFechar: vi.fn() });

    act(() => result.current.pedirFechamento());
    // Simula o roubo de foco pós-abertura (inert + foco inicial do veil).
    outro.focus();
    expect(document.activeElement).toBe(outro);

    act(() => result.current.continuarEditando());

    expect(document.activeElement).toBe(origem);
    origem.remove();
    outro.remove();
  });

  /** Não restaura foco para elemento que saiu do documento (ex.: overlay desmontado). */
  it("não restaura foco para elemento desconectado", () => {
    const origem = document.createElement("button");
    document.body.append(origem);
    origem.focus();

    const { result } = renderGuard({ temAlteracoes: true, aoFechar: vi.fn() });

    act(() => result.current.pedirFechamento());
    origem.remove();

    act(() => result.current.continuarEditando());

    expect(document.activeElement).not.toBe(origem);
  });
});
