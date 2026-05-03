/**
 * Componente reutilizável para exibir estado de erro em listagens.
 *
 * Mostra um ícone de alerta dentro de tile destrutivo, mensagem de erro
 * e um botão para tentar novamente a operação que falhou. Container usa
 * borda dashed na cor destrutiva para reforçar o caráter de alerta.
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
 * Exibe um estado de erro com tile de ícone, mensagem e botão de retry.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o estado de erro.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-5 py-12 bg-card border border-dashed border-destructive/30 rounded-2xl">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">
        Erro ao carregar dados
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-[42ch]">
        {message}
      </p>
      <Button variant="outline" onClick={onRetry} className="mt-4">
        Tentar novamente
      </Button>
    </div>
  );
}
