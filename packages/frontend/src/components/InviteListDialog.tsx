/**
 * Dialog para listagem e gerenciamento de convites.
 *
 * Exibe todos os convites do tenant com status (badge colorido),
 * criador, expiração e ação de revogação para convites ativos.
 */

import { Copy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConvites, useRevokeConvite } from "@/hooks/use-convites";
import type { Invite } from "@/services/convites";

/** Props do componente InviteListDialog. */
interface InviteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mapeamento de status para labels em PT-BR e variantes de badge. */
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  expired: { label: "Expirado", variant: "secondary" },
  used: { label: "Usado", variant: "outline" },
  revoked: { label: "Revogado", variant: "destructive" },
};

/**
 * Formata data ISO para exibição curta (DD/MM HH:MM).
 *
 * @param dateStr - Data no formato ISO string.
 * @returns Data formatada em PT-BR.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Componente dialog com lista de convites e ações.
 *
 * Exibe cards no mobile com status, criador, expiração e botão revogar.
 *
 * @param props - Propriedades de controle de abertura do dialog.
 * @returns Elemento JSX com o dialog de lista de convites.
 */
export function InviteListDialog({ open, onOpenChange }: InviteListDialogProps) {
  const { data: invites, isLoading } = useConvites();
  const revokeMutation = useRevokeConvite();

  /**
   * Copia o link do convite para o clipboard.
   *
   * @param invite - Convite com URL a copiar.
   */
  function handleCopy(invite: Invite) {
    navigator.clipboard.writeText(invite.url).then(() => {
      toast.success("Link copiado!");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convites</DialogTitle>
          <DialogDescription>
            Gerencie os links de convite do seu ministério.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </>
          )}

          {!isLoading && invites?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhum convite gerado ainda.
            </p>
          )}

          {!isLoading && invites?.map((invite) => {
            const statusInfo = STATUS_MAP[invite.status] ?? STATUS_MAP.expired;

            return (
              <div
                key={invite.id}
                className="p-3 rounded-lg border border-border space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={statusInfo.variant} className="text-xs">
                    {statusInfo.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(invite.expires_at)}
                  </span>
                </div>

                {invite.created_by && (
                  <p className="text-xs text-muted-foreground">
                    Gerado por {invite.created_by.name}
                  </p>
                )}

                {invite.used_by && (
                  <p className="text-xs text-muted-foreground">
                    Aceito por {invite.used_by.name}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {invite.status === "active" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopy(invite)}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copiar link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => revokeMutation.mutate(invite.id)}
                        disabled={revokeMutation.isPending}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Revogar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
