/**
 * Shell responsivo para formulários em overlay.
 *
 * Renderiza um **Drawer (bottom-sheet) no mobile** e um **Dialog centralizado
 * no desktop**, detectando o viewport com `useIsMobile()` — mesmo padrão do
 * `DateTimePicker.tsx` e exigido pela regra de responsividade do projeto
 * (`.claude/rules/frontend-react.md`, item "Overlays com conteúdo alto").
 *
 * Resolve dois bugs de mobile em formulários altos:
 * 1. Header fixo + corpo rolável + footer fixo (sticky), com a altura total
 *    limitada à viewport — o botão de ação (ex.: "Salvar") nunca fica escondido.
 * 2. No mobile o `Drawer` (vaul) é ancorado ao fundo e reposiciona o campo em
 *    foco acima do teclado virtual (`repositionInputs`, ligado por padrão),
 *    ao contrário do `Dialog` centralizado/`fixed`, que fica atrás do teclado.
 */

import { useEffect, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/** Propriedades do componente `ResponsiveFormDialog`. */
interface ResponsiveFormDialogProps {
  /** Se o overlay está aberto. */
  open: boolean;
  /** Callback ao abrir/fechar o overlay. */
  onOpenChange: (open: boolean) => void;
  /** Título acessível (obrigatório para a11y do Dialog/Drawer). */
  title: string;
  /** Descrição opcional exibida abaixo do título. */
  description?: string;
  /** Handler de submit do formulário (geralmente `form.handleSubmit(...)`). */
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** Botões de ação fixos no rodapé (ex.: Cancelar + Salvar). */
  footer: ReactNode;
  /** Campos do formulário (corpo rolável). */
  children: ReactNode;
  /** Classes extras para o `DialogContent` no desktop (ex.: `sm:max-w-[600px]`). */
  contentClassName?: string;
}

/**
 * Corpo compartilhado entre Drawer e Dialog: `<form>` com área rolável de
 * campos e rodapé fixo. Reutilizado nos dois ramos para evitar duplicação.
 *
 * @param props - Submit, rodapé e campos do formulário.
 * @returns Elemento `<form>` em coluna flex (corpo rola, rodapé fixa).
 */
function ResponsiveFormBody({
  onSubmit,
  footer,
  children,
}: Pick<ResponsiveFormDialogProps, "onSubmit" | "footer" | "children">) {
  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 sm:px-6">
        {children}
      </div>
      <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
        {footer}
      </div>
    </form>
  );
}

/**
 * Overlay de formulário responsivo (Drawer no mobile, Dialog no desktop).
 *
 * @param props - Estado, conteúdo, rodapé e classes do overlay.
 * @returns Elemento React do overlay apropriado ao viewport.
 */
export function ResponsiveFormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  footer,
  children,
  contentClassName,
}: ResponsiveFormDialogProps) {
  const isMobile = useIsMobile();

  /**
   * `useIsMobile` retorna `false` no primeiro render (antes de seu efeito medir
   * o viewport). Sem aguardar a montagem, um formulário aberto no mobile
   * renderizaria por um instante o `Dialog` centralizado antes de trocar para o
   * `Drawer` — um flash visível. Só decidimos entre os ramos após montar,
   * quando o valor de `isMobile` é confiável.
   */
  const [viewportReady, setViewportReady] = useState(false);
  useEffect(function marcarViewportPronto() {
    setViewportReady(true);
  }, []);

  if (!viewportReady) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh] overflow-hidden">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <ResponsiveFormBody onSubmit={onSubmit} footer={footer}>
            {children}
          </ResponsiveFormBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0",
          contentClassName,
        )}
      >
        <DialogHeader className="shrink-0 px-4 pt-6 sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ResponsiveFormBody onSubmit={onSubmit} footer={footer}>
          {children}
        </ResponsiveFormBody>
      </DialogContent>
    </Dialog>
  );
}
