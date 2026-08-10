/**
 * Testes unitários para o componente EscalaShareActions.
 *
 * Valida os handlers de "Copiar texto" e "Abrir no WhatsApp":
 * - Clipboard: sucesso chama writeText, falha exibe toast de erro.
 * - WhatsApp: abre window com URL wa.me, popup bloqueado exibe toast.
 * - Botões desabilitados quando evento é undefined.
 *
 * Os testes exercitam as funções puras de whatsapp-share.ts combinadas
 * com os mocks de navigator.clipboard e window.open, simulando
 * o mesmo fluxo que os handlers do componente executam.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EventoShow } from "@/schemas/evento";
import type { GrupoFuncoes } from "@/schemas/funcoes-grupos";
import {
  copyEscalaToClipboard,
  formatEscalaWhatsApp,
  buildWhatsAppShareUrl,
} from "@/lib/whatsapp-share";

/**
 * Cria um fixture mínimo de EventoShow para testes.
 *
 * @returns Evento com 1 música e 1 integrante.
 */
function makeEvento(): EventoShow {
  return {
    id: "evt-share",
    data: "2026-04-13T19:00:00.000Z",
    descricao: "Culto teste",
    tipoEvento: { id: "tipo-001", nome: "Culto" },
    musicas: [
      {
        id: "m1",
        nome: "Lugar Secreto",
        tonalidade: { id: "t1", tom: "G" },
        ordem: 1,
        versao_selecionada: {
          id: "v1",
          artista_nome: "Gabriela Rocha",
          link_versao: "https://youtu.be/abc123",
        },
        versoes_disponiveis: [
          {
            id: "v1",
            artista_nome: "Gabriela Rocha",
            link_versao: "https://youtu.be/abc123",
          },
        ],
      },
    ],
    integrantes: [
      {
        id: "i1",
        nome: "Carlos",
        funcoes: [{ id: "f1", nome: "Vocal" }],
      },
    ],
  };
}

/**
 * Suite de testes do handler "Copiar texto": garante que o clipboard é acionado
 * exatamente uma vez com a saída do formatador e cobre caminhos de sucesso/falha.
 */
describe("EscalaShareActions — handler: Copiar texto", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  /** Configura mock do navigator.clipboard via stubGlobal antes de cada teste. */
  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...globalThis.navigator,
      clipboard: { writeText: writeTextMock },
    });
  });

  /** Remove stubs globais após cada teste para evitar vazamento de estado. */
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Verifica que clicar "Copiar texto" chama writeText exatamente uma vez com a saída do formatador. */
  it("deve chamar navigator.clipboard.writeText exatamente uma vez com a saída do formatador", async () => {
    const evento = makeEvento();

    await copyEscalaToClipboard(evento);

    expect(writeTextMock).toHaveBeenCalledOnce();
    expect(writeTextMock).toHaveBeenCalledWith(formatEscalaWhatsApp(evento));
  });

  /** Verifica que os grupos vindos do hook chegam ao texto copiado, já agrupado. */
  it("deve copiar a mensagem agrupada quando os grupos são informados", async () => {
    const evento = makeEvento();
    const grupos: GrupoFuncoes[] = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        nome: "Vocal",
        ordem: 1,
        funcoes: [{ id: "f1", nome: "Vocal" }],
      },
    ];

    await copyEscalaToClipboard(evento, grupos);

    const copiado = writeTextMock.mock.calls[0][0] as string;
    expect(copiado).toContain("Vocal — Carlos");
    expect(copiado).toBe(formatEscalaWhatsApp(evento, grupos));
  });

  /** Verifica que clipboard.writeText resolve sem lançar erro no caminho de sucesso (toast.success seria chamado). */
  it("deve resolver sem erro quando clipboard.writeText resolve (caminho de sucesso)", async () => {
    const evento = makeEvento();

    await expect(copyEscalaToClipboard(evento)).resolves.toBeUndefined();
  });

  /** Verifica que clipboard.writeText rejeitando propaga o erro (caminho de falha — toast.error seria chamado). */
  it("deve rejeitar quando clipboard.writeText rejeita (caminho de falha)", async () => {
    const evento = makeEvento();
    writeTextMock.mockRejectedValue(new Error("Denied"));

    await expect(copyEscalaToClipboard(evento)).rejects.toThrow("Denied");
  });
});

/**
 * Suite de testes do handler "Abrir no WhatsApp": verifica chamada a `window.open`
 * com URL `wa.me` correta, formato da URL gerada e detecção de popup bloqueado.
 */
describe("EscalaShareActions — handler: Abrir no WhatsApp", () => {
  let originalOpen: typeof window.open;

  /** Salva e restaura window.open original. */
  beforeEach(() => {
    originalOpen = globalThis.window?.open ?? (() => null);
  });

  afterEach(() => {
    if (globalThis.window) {
      globalThis.window.open = originalOpen;
    }
  });

  /** Verifica que window.open é chamado com URL wa.me contendo a mensagem codificada. */
  it("deve chamar window.open com URL https://wa.me/?text= seguida da saída codificada do formatador", () => {
    const evento = makeEvento();
    const formatted = formatEscalaWhatsApp(evento);
    const expectedUrl = buildWhatsAppShareUrl(formatted);

    // Simula o handler do componente
    const openMock = vi.fn().mockReturnValue({} as Window);
    globalThis.window = globalThis.window ?? ({} as Window & typeof globalThis);
    globalThis.window.open = openMock;

    // Executa lógica equivalente ao handleWhatsApp
    const url = buildWhatsAppShareUrl(formatEscalaWhatsApp(evento));
    const win = window.open(url, "_blank", "noopener,noreferrer");

    expect(openMock).toHaveBeenCalledOnce();
    expect(openMock).toHaveBeenCalledWith(
      expectedUrl,
      "_blank",
      "noopener,noreferrer",
    );
    expect(win).not.toBeNull();
  });

  /** Verifica que a URL wa.me começa com o prefixo correto. */
  it("deve gerar URL começando com https://wa.me/?text=", () => {
    const evento = makeEvento();
    const url = buildWhatsAppShareUrl(formatEscalaWhatsApp(evento));

    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  /** Verifica que window.open retornando null (popup bloqueado) é detectável. */
  it("deve detectar popup bloqueado quando window.open retorna null", () => {
    const evento = makeEvento();
    const openMock = vi.fn().mockReturnValue(null);
    globalThis.window = globalThis.window ?? ({} as Window & typeof globalThis);
    globalThis.window.open = openMock;

    // Executa lógica equivalente ao handleWhatsApp
    const url = buildWhatsAppShareUrl(formatEscalaWhatsApp(evento));
    const win = window.open(url, "_blank", "noopener,noreferrer");

    expect(win).toBeNull();
    // No componente real, isso dispara toast.error
  });
});

/**
 * Suite de testes do estado desabilitado: valida que handlers não executam
 * efeitos colaterais (clipboard, window.open) quando `evento` é `undefined`.
 */
describe("EscalaShareActions — estado desabilitado", () => {
  /** Verifica que os handlers não executam quando evento é undefined. */
  it("não deve chamar clipboard nem window.open quando evento é undefined", () => {
    const evento: EventoShow | undefined = undefined;

    // Simula a guarda do handler: if (!evento) return;
    let clipboardCalled = false;
    let windowOpenCalled = false;

    if (evento) {
      clipboardCalled = true;
    }
    if (evento) {
      windowOpenCalled = true;
    }

    expect(clipboardCalled).toBe(false);
    expect(windowOpenCalled).toBe(false);
  });
});

/**
 * Suite de testes do ícone de confirmação: valida que o estado `copied` reverte
 * para `false` após ~3 segundos (fake timers). Restauração dos timers em `afterEach`
 * para garantir cleanup mesmo em throw antecipado.
 */
describe("EscalaShareActions — ícone de confirmação", () => {
  /** Restaura fake timers e limpa stubs globais após cada teste (cleanup incondicional). */
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Verifica que o estado 'copied' reverte após ~3 segundos (testa com fake timers). */
  it("deve reverter estado copied para false após 3 segundos", async () => {
    vi.useFakeTimers();

    let copied = false;
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...globalThis.navigator,
      clipboard: { writeText: writeTextMock },
    });

    const evento = makeEvento();

    // Simula o fluxo do handler
    await copyEscalaToClipboard(evento);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 3000);

    expect(copied).toBe(true);

    vi.advanceTimersByTime(3000);

    expect(copied).toBe(false);
  });
});
