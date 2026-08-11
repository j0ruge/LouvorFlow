import * as React from "react";

import { FormLabel } from "@/components/ui/form";

/** Propriedades do componente `FieldLabel`. */
interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof FormLabel> {
  /** Indica se o campo associado é obrigatório, exibindo o indicador visual/acessível. */
  required?: boolean;
}

/**
 * Wrapper de `FormLabel` (`ui/form.tsx`) que adiciona a indicação padrão de
 * campo obrigatório do design system: um asterisco decorativo (`aria-hidden`,
 * pois é puramente visual) seguido de um texto `sr-only` " (obrigatório)"
 * para que leitores de tela anunciem a obrigatoriedade mesmo sem o símbolo.
 *
 * Não modifica `ui/form.tsx` — apenas compõe `FormLabel`, preservando toda a
 * integração com o contexto do react-hook-form (`useFormField`).
 *
 * @param props - Propriedades do rótulo, incluindo `required` e os `children` (texto do label).
 * @returns Elemento React com o rótulo do campo e, quando `required`, o indicador de obrigatoriedade.
 */
export const FieldLabel = React.forwardRef<React.ElementRef<typeof FormLabel>, FieldLabelProps>(
  ({ required, children, ...props }, ref) => {
    return (
      <FormLabel ref={ref} {...props}>
        {children}
        {required && (
          <>
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        )}
      </FormLabel>
    );
  },
);
FieldLabel.displayName = "FieldLabel";
