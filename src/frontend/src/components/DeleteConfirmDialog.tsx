/**
 * Dialog reutilizável de confirmação de exclusão.
 *
 * Usa o AlertDialog do shadcn/ui para solicitar confirmação
 * antes de executar operações destrutivas. Exibe estado de
 * carregamento no botão de confirmação durante a operação.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Propriedades do componente DeleteConfirmDialog. */
interface DeleteConfirmDialogProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
  /** Título exibido no cabeçalho do dialog. */
  title: string;
  /** Descrição com detalhes sobre o impacto da exclusão. */
  description: string;
  /** Callback executado ao confirmar a exclusão. */
  onConfirm: () => void;
  /** Indica se a operação de exclusão está em andamento. */
  isLoading?: boolean;
}

/**
 * Dialog de confirmação de exclusão reutilizável.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog de confirmação.
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Excluindo..." : "Sim, excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
