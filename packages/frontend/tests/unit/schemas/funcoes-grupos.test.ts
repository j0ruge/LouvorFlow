import { describe, it, expect } from "vitest";
import {
  GrupoFuncoesSchema,
  GrupoFuncoesMutationResponseSchema,
  CreateGrupoFormSchema,
} from "@/schemas/funcoes-grupos";

/** Payload válido de grupo, usado como base nos testes. */
const GRUPO_VALIDO = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Vocal",
  ordem: 3,
  funcoes: [{ id: "22222222-2222-4222-8222-222222222222", nome: "Back Vocal" }],
};

/** Suíte de validação dos schemas de grupos de funções. */
describe("GrupoFuncoesSchema", () => {
  /** Garante que um grupo completo é aceito e tipado corretamente. */
  it("deve aceitar um grupo com funções", () => {
    const result = GrupoFuncoesSchema.parse(GRUPO_VALIDO);
    expect(result.nome).toBe("Vocal");
    expect(result.ordem).toBe(3);
    expect(result.funcoes).toHaveLength(1);
  });

  /** Garante que um grupo sem funções é válido — grupo recém-criado ou esvaziado. */
  it("deve aceitar um grupo com lista de funções vazia", () => {
    const result = GrupoFuncoesSchema.parse({ ...GRUPO_VALIDO, funcoes: [] });
    expect(result.funcoes).toEqual([]);
  });

  /** Garante que a ausência de `ordem` é rejeitada — sem ela não há como ordenar os blocos. */
  it("deve rejeitar payload sem ordem", () => {
    const { ordem, ...semOrdem } = GRUPO_VALIDO;
    expect(() => GrupoFuncoesSchema.parse(semOrdem)).toThrow();
  });

  /** Garante que `ordem` fracionária é rejeitada. */
  it("deve rejeitar ordem não inteira", () => {
    expect(() => GrupoFuncoesSchema.parse({ ...GRUPO_VALIDO, ordem: 1.5 })).toThrow();
  });

  /** Garante que a ausência de `funcoes` é rejeitada — o agrupamento depende dela. */
  it("deve rejeitar payload sem a lista de funções", () => {
    const { funcoes, ...semFuncoes } = GRUPO_VALIDO;
    expect(() => GrupoFuncoesSchema.parse(semFuncoes)).toThrow();
  });

  /** Garante que um id fora do formato UUID é rejeitado. */
  it("deve rejeitar id que não seja UUID", () => {
    expect(() => GrupoFuncoesSchema.parse({ ...GRUPO_VALIDO, id: "abc" })).toThrow();
  });
});

/** Suíte de validação da resposta das mutations de grupo. */
describe("GrupoFuncoesMutationResponseSchema", () => {
  /** Garante que a resposta com mensagem e grupo é aceita. */
  it("deve aceitar resposta com msg e grupo", () => {
    const result = GrupoFuncoesMutationResponseSchema.parse({
      msg: "Grupo criado com sucesso",
      grupo: GRUPO_VALIDO,
    });
    expect(result.msg).toBe("Grupo criado com sucesso");
    expect(result.grupo.id).toBe(GRUPO_VALIDO.id);
  });

  /** Garante que a resposta sem o grupo é rejeitada. */
  it("deve rejeitar resposta sem o grupo", () => {
    expect(() =>
      GrupoFuncoesMutationResponseSchema.parse({ msg: "ok" }),
    ).toThrow();
  });
});

/** Suíte de validação do formulário de criação de grupo. */
describe("CreateGrupoFormSchema", () => {
  /** Garante que espaços em volta do nome são removidos. */
  it("deve remover espaços em volta do nome", () => {
    const result = CreateGrupoFormSchema.parse({ nome: "  Vocal  " });
    expect(result.nome).toBe("Vocal");
  });

  /** Garante que nome vazio ou só com espaços é rejeitado. */
  it("deve rejeitar nome vazio", () => {
    expect(() => CreateGrupoFormSchema.parse({ nome: "   " })).toThrow();
  });
});
