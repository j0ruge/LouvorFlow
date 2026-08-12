/**
 * Componente reutilizável para exibir estado vazio em listagens.
 *
 * Mostra um ícone dentro de tile âmbar, título com tipografia display,
 * descrição e um botão de ação opcional para orientar o usuário quando
 * não há dados para exibir. Container usa borda dashed para reforçar
 * visualmente que é um estado de placeholder.
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
 * Exibe um estado vazio com tile de ícone, mensagem e ação opcional.
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
    <div className="flex flex-col items-center justify-center text-center px-5 py-12 bg-card border border-dashed border-border rounded-2xl">
      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">
        {title}
      </h3>
      {/* `break-words`: descrições podem interpolar texto do usuário sem
          espaços (ex.: termo de busca no zero-result) — sem quebra forçada,
          um token longo estouraria os 360px do mobile. */}
      <p className="text-sm text-muted-foreground mt-1 max-w-[42ch] break-words">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 bg-gradient-primary hover:opacity-90 text-white shadow-soft"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
