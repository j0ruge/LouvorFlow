/**
 * Testes dos schemas Zod de evento (escala), focados no campo `status`
 * introduzido pelo fluxo de rascunho (F12/F13).
 *
 * O ponto crítico é o padrão defensivo `default("publicada")`: numa janela
 * de deploy em que o backend ainda não envia o campo, o parse da resposta
 * inteira não pode quebrar — toda escala sem status é tratada como
 * publicada (comportamento pré-feature).
 */

import { describe, it, expect } from "vitest";
import { EventoIndexSchema, EventoShowSchema } from "@/schemas/evento";

/** Payload mínimo de EventoIndex como o backend envia (sem `status`). */
const indexSemStatus = {
  id: "3f8a2c9e-5b1d-4e6f-8a7b-9c0d1e2f3a4b",
  data: "2026-04-13T19:00:00.000Z",
  descricao: "Culto de domingo",
  tipoEvento: { id: "5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d", nome: "Culto" },
  musicas: [],
  integrantes: [],
};

/** Payload mínimo de EventoShow como o backend envia (sem `status`). */
const showSemStatus = {
  ...indexSemStatus,
  musicas: [],
  integrantes: [],
};

describe("EventoIndexSchema — status", () => {
  /** Sem `status` no payload (janela de deploy), o parse aplica "publicada". */
  it('aplica o default "publicada" quando o backend não envia status', () => {
    const parsed = EventoIndexSchema.parse(indexSemStatus);
    expect(parsed.status).toBe("publicada");
  });

  /** O valor "rascunho" enviado pelo backend é preservado no parse. */
  it('preserva o status "rascunho" enviado pelo backend', () => {
    const parsed = EventoIndexSchema.parse({
      ...indexSemStatus,
      status: "rascunho",
    });
    expect(parsed.status).toBe("rascunho");
  });

  /** Um status fora do enum é rejeitado pelo parse. */
  it("rejeita status fora do enum rascunho/publicada", () => {
    const result = EventoIndexSchema.safeParse({
      ...indexSemStatus,
      status: "arquivada",
    });
    expect(result.success).toBe(false);
  });
});

describe("EventoShowSchema — status", () => {
  /** Sem `status` no payload (janela de deploy), o parse aplica "publicada". */
  it('aplica o default "publicada" quando o backend não envia status', () => {
    const parsed = EventoShowSchema.parse(showSemStatus);
    expect(parsed.status).toBe("publicada");
  });

  /** O valor "rascunho" enviado pelo backend é preservado no parse. */
  it('preserva o status "rascunho" enviado pelo backend', () => {
    const parsed = EventoShowSchema.parse({
      ...showSemStatus,
      status: "rascunho",
    });
    expect(parsed.status).toBe("rascunho");
  });
});
