/**
 * Componente reutilizável para exibir estado vazio em listagens.
 *
 * Mostra um ícone, título, descrição e um botão de ação opcional
 * para orientar o usuário quando não há dados para exibir.
 */

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Propriedades do componente EmptyState. */
interface EmptyStateProps {
  /** Título principal exibido ao usuário. */
  title: string;
  /** Descrição complementar com orientação. */
  description: string;
  /** Rótulo do botão de ação (opcional). */
  actionLabel?: string;
  /** Callback executado ao clicar no botão de ação (opcional). */
  onAction?: () => void;
}

/**
 * Exibe um estado vazio com ícone, mensagem e ação opcional.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o estado vazio.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
