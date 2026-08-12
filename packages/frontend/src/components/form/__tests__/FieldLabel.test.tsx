/**
 * Testes do componente `FieldLabel` — wrapper de `FormLabel` (ui/form.tsx)
 * que adiciona a indicação padrão de campo obrigatório do design system.
 *
 * `FormLabel` depende do contexto do react-hook-form (`useFormField`), então
 * cada teste monta `FieldLabel` dentro de um `<Form>` + `<FormField>`
 * mínimos, seguindo o precedente de uso em `MusicaForm.tsx`.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/form/FieldLabel";

/**
 * Formulário mínimo para montar `FieldLabel` dentro do contexto do
 * react-hook-form exigido por `FormLabel`.
 *
 * @param props - Propriedades do formulário de teste.
 * @param props.required - Repassado como prop `required` ao `FieldLabel` sob teste.
 * @returns Elemento React com um único campo "Nome" rotulado por `FieldLabel`.
 */
function FormularioDeTeste({ required }: { required?: boolean }) {
  const form = useForm({ defaultValues: { nome: "" } });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FieldLabel required={required}>Nome</FieldLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
}

describe("FieldLabel", () => {
  /** Sempre renderiza o texto do rótulo passado via children, independentemente de required. */
  it("renderiza o texto do rótulo", () => {
    render(<FormularioDeTeste />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
  });

  /** Com required=true, exibe o asterisco decorativo (aria-hidden) e o texto oculto "(obrigatório)" para leitores de tela. */
  it("exibe asterisco aria-hidden e texto sr-only quando required", () => {
    render(<FormularioDeTeste required />);

    const asterisco = screen.getByText("*");
    expect(asterisco).toBeInTheDocument();
    expect(asterisco).toHaveAttribute("aria-hidden");

    expect(screen.getByText("(obrigatório)")).toBeInTheDocument();
  });

  /** Sem required (padrão), não deve haver nem o asterisco nem o texto de obrigatoriedade. */
  it("não exibe asterisco nem texto de obrigatoriedade quando não é required", () => {
    render(<FormularioDeTeste />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
    expect(screen.queryByText("(obrigatório)")).not.toBeInTheDocument();
  });
});
