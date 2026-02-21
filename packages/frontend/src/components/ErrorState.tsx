/**
 * Componente reutilizável para exibir estado de erro em listagens.
 *
 * Mostra um ícone de alerta, a mensagem de erro e um botão para
 * tentar novamente a operação que falhou.
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Propriedades do componente ErrorState. */
interface ErrorStateProps {
  /** Mensagem de erro exibida ao usuário. */
  message: string;
  /** Callback executado ao clicar em "Tentar novamente". */
  onRetry: () => void;
}

/**
 * Exibe um estado de erro com mensagem e botão de retry.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o estado de erro.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground">
        Erro ao carregar dados
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>
      <Button variant="outline" onClick={onRetry} className="mt-4">
        Tentar novamente
      </Button>
    </div>
  );
}
