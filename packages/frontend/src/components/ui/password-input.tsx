/**
 * Campo de senha com toggle de visibilidade.
 *
 * Encapsula o componente Input do shadcn/ui adicionando um botão
 * com ícone de olho (Eye/EyeOff) que alterna entre exibir e ocultar
 * o texto digitado. Compatível com react-hook-form (forwardRef).
 */

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Input de senha com botão para alternar visibilidade.
 *
 * Aceita todas as props do Input padrão (exceto `type`, que é controlado
 * internamente). Usa `forwardRef` para compatibilidade com react-hook-form.
 * O botão de toggle usa `tabIndex={-1}` para não capturar foco via Tab,
 * evitando que o Enter no campo de senha acione o toggle ao invés do submit.
 *
 * @param props - Props do componente (mesmas do Input, sem `type`).
 * @param ref - Ref encaminhada para o elemento input interno.
 * @returns Elemento JSX com input de senha e botão de toggle.
 */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
