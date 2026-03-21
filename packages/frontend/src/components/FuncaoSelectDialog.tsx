/**
 * Dialog para seleção de funções ao escalar um integrante em um evento.
 *
 * Exibe checkboxes com as funções do integrante selecionado. Todas são
 * pré-marcadas por padrão. O usuário pode desmarcar as que não se aplicam
 * ao evento e confirmar. Pelo menos 1 função deve estar selecionada.
 */

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { IdNome } from "@/schemas/shared";

/** Props do componente FuncaoSelectDialog. */
interface FuncaoSelectDialogProps {
  /** Se o dialog está aberto. */
  open: boolean;
  /** Callback de mudança de estado do dialog. */
  onOpenChange: (open: boolean) => void;
  /** Nome do integrante selecionado. */
  integranteNome: string;
  /** Funções disponíveis do integrante. */
  funcoes: IdNome[];
  /** Callback disparado ao confirmar a seleção. */
  onConfirm: (funcaoIds: string[]) => void;
  /** Se a ação de confirmação está em andamento. */
  isLoading?: boolean;
}

/**
 * Dialog com checkboxes para selecionar funções de um integrante no evento.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog de seleção de funções.
 */
export function FuncaoSelectDialog({
  open,
  onOpenChange,
  integranteNome,
  funcoes,
  onConfirm,
  isLoading = false,
}: FuncaoSelectDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const prevOpen = useRef(false);

  /** Pré-seleciona todas as funções apenas na transição de abertura do dialog. */
  useEffect(() => {
    if (open && !prevOpen.current) {
      setSelectedIds(new Set(funcoes.map((f) => f.id)));
    }
    prevOpen.current = open;
  }, [open, funcoes]);

  /**
   * Alterna a seleção de uma função.
   *
   * @param funcaoId - UUID da função a alternar.
   */
  function toggleFuncao(funcaoId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(funcaoId)) {
        next.delete(funcaoId);
      } else {
        next.add(funcaoId);
      }
      return next;
    });
  }

  /** Confirma a seleção e dispara o callback. */
  function handleConfirm() {
    onConfirm(Array.from(selectedIds));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Funções</DialogTitle>
          <DialogDescription>
            Escolha quais funções <strong>{integranteNome}</strong> exercerá
            neste evento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {funcoes.map((funcao) => (
            <div key={funcao.id} className="flex items-center space-x-3">
              <Checkbox
                id={`funcao-${funcao.id}`}
                checked={selectedIds.has(funcao.id)}
                onCheckedChange={() => toggleFuncao(funcao.id)}
              />
              <Label
                htmlFor={`funcao-${funcao.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {funcao.nome}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || isLoading}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
