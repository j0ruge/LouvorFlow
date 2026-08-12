import * as React from "react";

import { cn } from "@/lib/utils";

/** Propriedades do componente `RequiredFieldsLegend`. */
type RequiredFieldsLegendProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Legenda exibida no topo de formulários explicando a convenção visual do
 * asterisco usado por `FieldLabel` em campos obrigatórios.
 *
 * @param props - Propriedades HTML padrão de parágrafo (ex: `className` para ajuste de espaçamento no formulário que a utiliza).
 * @returns Elemento `<p>` com o texto "* campo obrigatório".
 */
export function RequiredFieldsLegend({ className, ...props }: RequiredFieldsLegendProps) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      * campo obrigatório
    </p>
  );
}
