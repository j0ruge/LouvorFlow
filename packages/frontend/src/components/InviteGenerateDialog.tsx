/**
 * Dialog para geração de link de convite.
 *
 * O líder clica em "Gerar convite", o sistema cria um token
 * e exibe a URL com botão para copiar para o clipboard.
 * Inclui timer de expiração e feedback via toast.
 */

import { useState, useEffect } from "react";
import { Copy, Check, Link2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateConvite } from "@/hooks/use-convites";
import type { CreateInviteResponse } from "@/services/convites";

/** Props do componente InviteGenerateDialog. */
interface InviteGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Formata a diferença de tempo restante em horas e minutos.
 *
 * @param expiresAt - Data de expiração no formato ISO.
 * @returns String formatada do tempo restante ou "Expirado".
 */
function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min restantes`;
}

/**
 * Componente dialog para gerar e copiar link de convite.
 *
 * Ao abrir, reseta o estado. Ao gerar, exibe a URL com botão copiar
 * e timer de expiração que atualiza a cada minuto.
 *
 * @param props - Propriedades de controle de abertura do dialog.
 * @returns Elemento JSX com o dialog de geração de convite.
 */
export function InviteGenerateDialog({ open, onOpenChange }: InviteGenerateDialogProps) {
  const [invite, setInvite] = useState<CreateInviteResponse["invite"] | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const createMutation = useCreateConvite();

  /** Reseta o estado ao abrir/fechar o dialog. */
  useEffect(
    function resetOnToggle() {
      if (!open) {
        setInvite(null);
        setCopied(false);
      }
    },
    [open],
  );

  /** Atualiza o timer de expiração a cada minuto. */
  useEffect(
    function updateTimer() {
      if (!invite) return;
      setTimeLeft(formatTimeRemaining(invite.expires_at));
      const interval = setInterval(() => {
        setTimeLeft(formatTimeRemaining(invite.expires_at));
      }, 60_000);
      return () => clearInterval(interval);
    },
    [invite],
  );

  /** Gera um novo convite via API. */
  function handleGenerate() {
    createMutation.mutate(undefined, {
      onSuccess: (data) => {
        setInvite(data.invite);
        navigator.clipboard.writeText(data.invite.url).then(() => {
          setCopied(true);
          toast.success("Link copiado para a área de transferência!");
          setTimeout(() => setCopied(false), 3000);
        }).catch(() => {
          toast.error("Não foi possível copiar. Copie manualmente.");
        });
      },
    });
  }

  /** Copia o link para o clipboard. */
  function handleCopy() {
    if (!invite) return;
    navigator.clipboard.writeText(invite.url).then(() => {
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      toast.error("Não foi possível copiar. Copie manualmente.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Gerar convite
          </DialogTitle>
          <DialogDescription>
            Gere um link para convidar um novo integrante. O link expira em 2 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!invite && (
            <Button
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={handleGenerate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Gerando..." : "Gerar link de convite"}
            </Button>
          )}

          {invite && (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={invite.url}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{timeLeft}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Envie este link por WhatsApp, SMS ou qualquer canal.
                O participante poderá criar sua conta ao abri-lo.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
