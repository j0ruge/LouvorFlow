/**
 * Testes unitários para o módulo de formatação e compartilhamento de escalas via WhatsApp.
 *
 * Cobre todos os cenários do layout canônico: header, músicas com/sem tom e link,
 * integrantes com/sem funções, ordenação, escala vazia, URL de compartilhamento
 * e cópia para a área de transferência.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EventoShow } from "@/schemas/evento";
import type { GrupoFuncoes } from "@/schemas/funcoes-grupos";
import {
  formatEscalaWhatsApp,
  buildWhatsAppShareUrl,
  copyEscalaToClipboard,
} from "./whatsapp-share";

/**
 * Cria um fixture completo de EventoShow para testes.
 *
 * @returns Evento com 3 músicas (com tom e versão selecionada) e 4 integrantes com funções.
 */
function makeFullEvento(): EventoShow {
  return {
    id: "evt-001",
    data: "2026-04-13T19:00:00.000Z",
    descricao: "Culto de domingo",
    tipoEvento: { id: "tipo-001", nome: "Culto Dominical" },
    musicas: [
      {
        id: "m1",
        nome: "Lugar Secreto",
        tonalidade: { id: "t1", tom: "G" },
        tonalidade_musica: { id: "t1", tom: "G" },
        ordem: 1,
        versao_selecionada: {
          id: "v1",
          artista_nome: "Gabriela Rocha",
          link_versao: "https://youtu.be/abc123",
          cifraclub_url: null,
        },
        versoes_disponiveis: [
          {
            id: "v1",
            artista_nome: "Gabriela Rocha",
            link_versao: "https://youtu.be/abc123",
            cifraclub_url: null,
          },
        ],
      },
      {
        id: "m2",
        nome: "Grande É o Senhor",
        tonalidade: { id: "t2", tom: "D" },
        tonalidade_musica: { id: "t2", tom: "D" },
        ordem: 2,
        versao_selecionada: {
          id: "v2",
          artista_nome: "Adhemar de Campos",
          link_versao: "https://youtu.be/def456",
          cifraclub_url: null,
        },
        versoes_disponiveis: [
          {
            id: "v2",
            artista_nome: "Adhemar de Campos",
            link_versao: "https://youtu.be/def456",
            cifraclub_url: null,
          },
        ],
      },
      {
        id: "m3",
        nome: "Nada Além do Sangue",
        tonalidade: { id: "t3", tom: "E" },
        tonalidade_musica: { id: "t3", tom: "E" },
        ordem: 3,
        versao_selecionada: {
          id: "v3",
          artista_nome: "Fernandinho",
          link_versao: "https://youtu.be/ghi789",
          cifraclub_url: null,
        },
        versoes_disponiveis: [
          {
            id: "v3",
            artista_nome: "Fernandinho",
            link_versao: "https://youtu.be/ghi789",
            cifraclub_url: null,
          },
        ],
      },
    ],
    integrantes: [
      {
        id: "i1",
        nome: "Carlos",
        funcoes: [
          { id: "f1", nome: "Vocal" },
          { id: "f2", nome: "Violão" },
        ],
      },
      {
        id: "i2",
        nome: "ana",
        funcoes: [{ id: "f1", nome: "Vocal" }],
      },
      {
        id: "i3",
        nome: "Bruno",
        funcoes: [{ id: "f3", nome: "Bateria" }],
      },
      {
        id: "i4",
        nome: "Diana",
        funcoes: [
          { id: "f4", nome: "Teclado" },
          { id: "f1", nome: "Vocal" },
        ],
      },
    ],
  };
}

/**
 * Cria os grupos de funções usados como configuração padrão nos testes.
 *
 * "Ministração" é declarado sem funções de propósito, para cobrir a regra
 * de omissão de blocos vazios; a ordem é deliberadamente embaralhada para
 * provar que o formatador ordena pelo campo `ordem`, não pelo array.
 *
 * @returns Grupos cobrindo as funções do fixture `makeFullEvento`.
 */
function makeGrupos(): GrupoFuncoes[] {
  return [
    {
      id: "g3",
      nome: "Instrumentos",
      ordem: 3,
      funcoes: [
        { id: "f2", nome: "Violão" },
        { id: "f3", nome: "Bateria" },
        { id: "f4", nome: "Teclado" },
      ],
    },
    { id: "g1", nome: "Ministração", ordem: 1, funcoes: [] },
    { id: "g2", nome: "Vocal", ordem: 2, funcoes: [{ id: "f1", nome: "Vocal" }] },
  ];
}

/**
 * Extrai as linhas da seção de integrantes (tudo após o cabeçalho 👥).
 *
 * @param mensagem - Mensagem completa gerada pelo formatador.
 * @returns Linhas da seção, incluindo as vazias que separam os blocos.
 */
function linhasDeIntegrantes(mensagem: string): string[] {
  const linhas = mensagem.split("\n");
  const headerIdx = linhas.findIndex((l) => l.startsWith("👥"));
  return linhas.slice(headerIdx + 1);
}

/**
 * Suite de testes de `formatEscalaWhatsApp`: valida o layout canônico do texto
 * gerado (header, músicas, integrantes, casos de falta de dados).
 */
describe("formatEscalaWhatsApp", () => {
  /** Verifica se a escala completa produz o layout canônico exato. */
  it("deve renderizar escala completa com header, músicas com tom e link, e integrantes agrupados", () => {
    const evento = makeFullEvento();
    const result = formatEscalaWhatsApp(evento, makeGrupos());

    const dateStr = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(evento.data));

    const expected = [
      `*Culto Dominical* — _${dateStr}_`,
      "",
      "🎵 *Músicas* (3)",
      "",
      "1. Lugar Secreto (G)",
      "   https://youtu.be/abc123",
      "2. Grande É o Senhor (D)",
      "   https://youtu.be/def456",
      "3. Nada Além do Sangue (E)",
      "   https://youtu.be/ghi789",
      "",
      "👥 *Integrantes* (4)",
      "",
      "Vocal — ana",
      "Vocal — Carlos",
      "Vocal — Diana",
      "",
      "Bateria — Bruno",
      "Violão — Carlos",
      "Teclado — Diana",
    ].join("\n");

    expect(result).toBe(expected);
  });

  /** Verifica que música sem tonalidade omite o segmento (Tom). */
  it("deve omitir segmento de tom quando a música não tem tonalidade", () => {
    const evento = makeFullEvento();
    evento.musicas = [
      {
        id: "m1",
        nome: "Canto Livre",
        tonalidade: null,
        tonalidade_musica: null,
        ordem: 1,
        versao_selecionada: null,
        versoes_disponiveis: [],
      },
    ];
    evento.integrantes = [];

    const result = formatEscalaWhatsApp(evento);
    expect(result).toContain("1. Canto Livre\n");
    expect(result).not.toMatch(/1\. Canto Livre \(/);
  });

  /**
   * Verifica que a mensagem usa o tom EFETIVO da escala (`musica.tonalidade`),
   * não o tom global de referência (`musica.tonalidade_musica`), quando a
   * escala definiu um tom próprio para a música (F11 — `MusicaTomPicker`).
   * `formatEscalaWhatsApp` já lê apenas `musica.tonalidade` — o comportamento
   * é correto por construção; este teste prova isso contra regressão.
   */
  it("deve usar o tom efetivo da escala, não o tom global, quando eles divergem", () => {
    const evento = makeFullEvento();
    evento.musicas = [
      {
        id: "m1",
        nome: "Lugar Secreto",
        // Override do evento (D): diverge do tom global da música (G).
        tonalidade: { id: "t-d", tom: "D" },
        tonalidade_musica: { id: "t1", tom: "G" },
        ordem: 1,
        versao_selecionada: null,
        versoes_disponiveis: [],
      },
    ];
    evento.integrantes = [];

    const result = formatEscalaWhatsApp(evento);
    expect(result).toContain("1. Lugar Secreto (D)");
    expect(result).not.toContain("(G)");
  });

  /** Verifica que música com versao_selecionada null não renderiza linha de link. */
  it("deve omitir linha de link quando versao_selecionada é null", () => {
    const evento = makeFullEvento();
    evento.musicas = [
      {
        id: "m1",
        nome: "Lugar Secreto",
        tonalidade: { id: "t1", tom: "G" },
        tonalidade_musica: { id: "t1", tom: "G" },
        ordem: 1,
        versao_selecionada: null,
        versoes_disponiveis: [],
      },
    ];
    evento.integrantes = [];

    const result = formatEscalaWhatsApp(evento);
    const lines = result.split("\n");
    const musicaLine = lines.find((l) => l.includes("Lugar Secreto"));
    expect(musicaLine).toBe("1. Lugar Secreto (G)");

    const musicaLineIndex = lines.indexOf(musicaLine!);
    const nextLine = lines[musicaLineIndex + 1];
    expect(nextLine).not.toMatch(/^\s{3}https?:\/\//);
  });

  /** Verifica que música com versao_selecionada.link_versao null não renderiza linha de link. */
  it("deve omitir linha de link quando versao_selecionada.link_versao é null", () => {
    const evento = makeFullEvento();
    evento.musicas = [
      {
        id: "m1",
        nome: "Lugar Secreto",
        tonalidade: { id: "t1", tom: "G" },
        tonalidade_musica: { id: "t1", tom: "G" },
        ordem: 1,
        versao_selecionada: {
          id: "v1",
          artista_nome: "Gabriela Rocha",
          link_versao: null,
          cifraclub_url: null,
        },
        versoes_disponiveis: [],
      },
    ];
    evento.integrantes = [];

    const result = formatEscalaWhatsApp(evento);
    const lines = result.split("\n");
    const musicaLine = lines.find((l) => l.includes("Lugar Secreto"));
    expect(musicaLine).toBe("1. Lugar Secreto (G)");

    const musicaLineIndex = lines.indexOf(musicaLine!);
    const nextLine = lines[musicaLineIndex + 1];
    expect(nextLine).not.toMatch(/^\s{3}/);
  });

  /** Verifica que integrante sem funções renderiza apenas o nome, sem traço. */
  it("deve renderizar integrante sem funções apenas com o nome, sem traço", () => {
    const evento = makeFullEvento();
    evento.musicas = [];
    evento.integrantes = [
      { id: "i1", nome: "João", funcoes: [] },
    ];

    const result = formatEscalaWhatsApp(evento);
    expect(result).toContain("João");
    expect(result).not.toContain("João —");
    expect(result).not.toContain("João —");
  });

  /** Verifica que os blocos seguem o campo `ordem` dos grupos, não a ordem do array. */
  it("deve renderizar os blocos na ordem definida pelos grupos", () => {
    const evento = makeFullEvento();
    evento.musicas = [];

    const result = formatEscalaWhatsApp(evento, makeGrupos());
    const idxVocal = result.indexOf("Vocal — ana");
    const idxInstrumentos = result.indexOf("Bateria — Bruno");

    expect(idxVocal).toBeGreaterThan(-1);
    expect(idxInstrumentos).toBeGreaterThan(idxVocal);
  });

  /** Verifica que dentro do bloco a ordenação é pelo nome do integrante, ignorando caixa. */
  it("deve ordenar as linhas do bloco pelo nome do integrante, case-insensitive", () => {
    const evento = makeFullEvento();
    evento.musicas = [];
    evento.integrantes = [
      { id: "i1", nome: "Zeca", funcoes: [{ id: "f1", nome: "Vocal" }] },
      { id: "i2", nome: "ana", funcoes: [{ id: "f1", nome: "Vocal" }] },
      { id: "i3", nome: "Ávila", funcoes: [{ id: "f1", nome: "Vocal" }] },
    ];

    const result = formatEscalaWhatsApp(evento, makeGrupos());
    const linhas = linhasDeIntegrantes(result).filter(Boolean);

    expect(linhas).toEqual(["Vocal — ana", "Vocal — Ávila", "Vocal — Zeca"]);
  });

  /** Verifica que quem exerce várias funções aparece em cada bloco correspondente. */
  it("deve repetir o integrante em cada grupo em que ele exerce função", () => {
    const evento = makeFullEvento();
    evento.musicas = [];
    evento.integrantes = [
      {
        id: "i1",
        nome: "Vanessa",
        funcoes: [
          { id: "f1", nome: "Vocal" },
          { id: "f4", nome: "Teclado" },
        ],
      },
    ];

    const result = formatEscalaWhatsApp(evento, makeGrupos());

    expect(result).toContain("Vocal — Vanessa");
    expect(result).toContain("Teclado — Vanessa");
  });

  /** Verifica que o contador do cabeçalho conta pessoas, não linhas geradas. */
  it("deve contar pessoas únicas no cabeçalho, mesmo com múltiplas funções", () => {
    const evento = makeFullEvento();
    evento.musicas = [];
    evento.integrantes = [
      {
        id: "i1",
        nome: "Vanessa",
        funcoes: [
          { id: "f1", nome: "Vocal" },
          { id: "f4", nome: "Teclado" },
        ],
      },
    ];

    const result = formatEscalaWhatsApp(evento, makeGrupos());
    const linhas = linhasDeIntegrantes(result).filter(Boolean);

    expect(result).toContain("👥 *Integrantes* (1)");
    expect(linhas).toHaveLength(2);
  });

  /** Verifica que grupos sem nenhum integrante escalado não geram bloco. */
  it("deve omitir blocos de grupos vazios", () => {
    const evento = makeFullEvento();
    evento.musicas = [];

    const result = formatEscalaWhatsApp(evento, makeGrupos());

    // "Ministração" não tem funções atribuídas — não deve produzir bloco algum.
    expect(result).not.toContain("Ministração");
  });

  /** Verifica que há exatamente uma linha em branco separando dois blocos. */
  it("deve separar blocos por exatamente uma linha em branco", () => {
    const evento = makeFullEvento();
    evento.musicas = [];

    const result = formatEscalaWhatsApp(evento, makeGrupos());
    const linhas = linhasDeIntegrantes(result);

    // Estrutura: "" | bloco Vocal (3) | "" | bloco Instrumentos (3)
    expect(linhas[0]).toBe("");
    expect(linhas[4]).toBe("");
    expect(linhas.filter((l) => l === "")).toHaveLength(2);
    expect(result).not.toContain("\n\n\n");
  });

  /** Verifica que funções sem grupo formam um bloco após o último grupo. */
  it("deve listar funções sem grupo em bloco após o último grupo", () => {
    const evento = makeFullEvento();
    evento.musicas = [];
    evento.integrantes = [
      { id: "i1", nome: "ana", funcoes: [{ id: "f1", nome: "Vocal" }] },
      { id: "i2", nome: "Jorge", funcoes: [{ id: "f9", nome: "Sonorização" }] },
    ];

    const result = formatEscalaWhatsApp(evento, makeGrupos());
    const linhas = linhasDeIntegrantes(result).filter(Boolean);

    expect(linhas).toEqual(["Vocal — ana", "Sonorização — Jorge"]);
  });

  /** Verifica que integrantes sem nenhuma função encerram a seção, só com o nome. */
  it("deve listar integrantes sem função ao final, apenas com o nome", () => {
    const evento = makeFullEvento();
    evento.musicas = [];
    evento.integrantes = [
      { id: "i1", nome: "Zoe", funcoes: [] },
      { id: "i2", nome: "ana", funcoes: [{ id: "f1", nome: "Vocal" }] },
      { id: "i3", nome: "Beto", funcoes: [] },
    ];

    const result = formatEscalaWhatsApp(evento, makeGrupos());
    const linhas = linhasDeIntegrantes(result).filter(Boolean);

    expect(linhas).toEqual(["Vocal — ana", "Beto", "Zoe"]);
  });

  /** Verifica o comportamento sem configuração: tudo num único bloco, nada se perde. */
  it("deve manter todos os integrantes em um único bloco quando não há grupos", () => {
    const evento = makeFullEvento();
    evento.musicas = [];

    const result = formatEscalaWhatsApp(evento);
    const linhas = linhasDeIntegrantes(result).filter(Boolean);

    // Mesmo integrante em linhas seguidas: "Violão" precede "Vocal" (desempate pela função).
    expect(linhas).toEqual([
      "Vocal — ana",
      "Bateria — Bruno",
      "Violão — Carlos",
      "Vocal — Carlos",
      "Teclado — Diana",
      "Vocal — Diana",
    ]);
  });

  /** Verifica que escala vazia renderiza headers com contagem (0) e sem linhas de corpo. */
  it("deve renderizar escala vazia com headers (0) e sem corpo", () => {
    const evento: EventoShow = {
      id: "evt-empty",
      data: "2026-04-13T19:00:00.000Z",
      descricao: "",
      tipoEvento: { id: "tipo-001", nome: "Ensaio" },
      musicas: [],
      integrantes: [],
    };

    const result = formatEscalaWhatsApp(evento);
    expect(result).toContain("🎵 *Músicas* (0)");
    expect(result).toContain("👥 *Integrantes* (0)");

    const lines = result.split("\n");
    const musicasIdx = lines.findIndex((l) => l.includes("*Músicas*"));
    const integrantesIdx = lines.findIndex((l) =>
      l.includes("*Integrantes*"),
    );
    // Apenas uma linha vazia entre músicas(0) e integrantes(0)
    expect(integrantesIdx - musicasIdx).toBe(2);
  });

  /** Verifica que a data no header está no formato brasileiro DD/MM/AAAA HH:mm entre _..._. */
  it("deve formatar a data no header como DD/MM/AAAA HH:mm em itálico", () => {
    const evento: EventoShow = {
      id: "evt-date",
      data: "2026-12-25T10:30:00.000Z",
      descricao: "",
      tipoEvento: { id: "tipo-001", nome: "Natal" },
      musicas: [],
      integrantes: [],
    };

    const result = formatEscalaWhatsApp(evento);

    const expectedDate = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date("2026-12-25T10:30:00.000Z"));

    expect(result).toContain(`_${expectedDate}_`);
    // Verificar formato DD/MM/AAAA HH:mm
    expect(expectedDate).toMatch(/\d{2}\/\d{2}\/\d{4},?\s+\d{2}:\d{2}/);
  });

  /** Verifica que evento sem tipoEvento usa "Evento" como fallback no header. */
  it('deve usar "Evento" como fallback quando tipoEvento é null', () => {
    const evento: EventoShow = {
      id: "evt-no-type",
      data: "2026-04-13T19:00:00.000Z",
      descricao: "",
      tipoEvento: null,
      musicas: [],
      integrantes: [],
    };

    const result = formatEscalaWhatsApp(evento);
    expect(result).toMatch(/^\*Evento\*/);
  });
});

/**
 * Suite de testes de `buildWhatsAppShareUrl`: valida que a URL gerada começa
 * com `https://wa.me/?text=` e que a mensagem é corretamente percent-encoded.
 */
describe("buildWhatsAppShareUrl", () => {
  /** Verifica que a URL retornada contém o prefixo wa.me e a mensagem codificada. */
  it("deve retornar URL wa.me com a mensagem codificada", () => {
    const message = "Olá mundo!\nLinha 2";
    const url = buildWhatsAppShareUrl(message);

    expect(url).toBe(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
    );
    expect(url).toContain("Ol%C3%A1%20mundo!");
    expect(url).toContain("%0ALinha%202");
  });
});

/**
 * Suite de testes de `copyEscalaToClipboard`: valida que `navigator.clipboard.writeText`
 * é chamado com a saída do formatador e que erros propagam para o caller.
 */
describe("copyEscalaToClipboard", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  /**
   * Configura stub determinístico do navigator.clipboard antes de cada teste
   * via vi.stubGlobal (compatível com jsdom; isolado entre testes).
   */
  beforeEach(() => {
    writeTextMock = vi.fn();
    vi.stubGlobal("navigator", {
      ...globalThis.navigator,
      clipboard: { writeText: writeTextMock },
    });
  });

  /** Remove o stub global ao final de cada teste para evitar leak entre suites. */
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Verifica que clipboard.writeText é chamado com a saída formatada. */
  it("deve chamar navigator.clipboard.writeText com o texto formatado", async () => {
    writeTextMock.mockResolvedValueOnce(undefined);

    const evento: EventoShow = {
      id: "evt-copy",
      data: "2026-04-13T19:00:00.000Z",
      descricao: "",
      tipoEvento: { id: "tipo-001", nome: "Culto" },
      musicas: [],
      integrantes: [],
    };

    await copyEscalaToClipboard(evento);

    expect(writeTextMock).toHaveBeenCalledOnce();
    expect(writeTextMock).toHaveBeenCalledWith(
      formatEscalaWhatsApp(evento),
    );
  });

  /** Verifica que rejeição do clipboard propaga para o chamador (não engole o erro). */
  it("deve rejeitar quando navigator.clipboard.writeText rejeita", async () => {
    writeTextMock.mockRejectedValueOnce(new Error("Clipboard denied"));

    const evento: EventoShow = {
      id: "evt-fail",
      data: "2026-04-13T19:00:00.000Z",
      descricao: "",
      tipoEvento: { id: "tipo-001", nome: "Culto" },
      musicas: [],
      integrantes: [],
    };

    await expect(copyEscalaToClipboard(evento)).rejects.toThrow(
      "Clipboard denied",
    );
  });
});
