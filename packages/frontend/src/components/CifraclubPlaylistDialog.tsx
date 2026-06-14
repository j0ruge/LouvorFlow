/**
 * Diálogo de playlist CifraClub com lista de cifras, copiar e compartilhar via WhatsApp.
 * Exibe músicas da escala com URLs CifraClub enriquecidas (#key=N para transposição).
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Guitar,
  ExternalLink,
  Copy,
  Check,
  X,
} from "lucide-react";
import { useCifraclubPlaylist } from "@/hooks/use-eventos";
import { formatCifraclubPlaylist } from "@/lib/cifraclub-playlist";
import { isSafeUrl } from "@/lib/utils";

/** Limite seguro para URLs wa.me (evita truncamento). */
const WHATSAPP_URL_SAFE_LIMIT = 3800;

/**
 * Copia um texto para a área de transferência tratando rejeições da Clipboard API
 * (contexto inseguro, permissão negada no mobile). Exibe toast de erro em falha.
 *
 * @param text - Texto a copiar.
 * @returns `true` se a cópia foi concluída, `false` caso contrário.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    toast.error("Não foi possível copiar. Tente novamente ou copie manualmente.");
    return false;
  }
}

/**
 * Compartilha um texto via WhatsApp (wa.me). Se a URL ultrapassar o limite seguro,
 * copia o texto para a área de transferência como fallback. Usa `noopener,noreferrer`
 * para isolar a janela aberta.
 *
 * @param text - Texto da mensagem a compartilhar.
 */
async function shareViaWhatsApp(text: string): Promise<void> {
  const encoded = encodeURIComponent(text);
  if (encoded.length > WHATSAPP_URL_SAFE_LIMIT) {
    if (await copyToClipboard(text)) {
      toast.error(
        "Mensagem muito longa para o WhatsApp. O texto foi copiado para a área de transferência.",
      );
    }
    return;
  }
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

/** Propriedades do componente CifraclubPlaylistDialog. */
interface CifraclubPlaylistDialogProps {
  /** UUID do evento. */
  eventoId: string;
}

/**
 * Diálogo com playlist CifraClub de uma escala.
 * Botão trigger com ícone Guitar, lista numerada de músicas com links,
 * stats de cobertura, e ações de copiar/compartilhar via WhatsApp.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o diálogo da playlist CifraClub.
 */
export function CifraclubPlaylistDialog({ eventoId }: CifraclubPlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Carregamento preguiçoso: só busca a playlist quando o diálogo está aberto,
  // evitando uma requisição em toda visualização do detalhe do evento.
  const { data, isLoading } = useCifraclubPlaylist(eventoId, open);

  /** Copia a playlist formatada para o clipboard, tratando falhas da Clipboard API. */
  async function handleCopy() {
    if (!data) return;
    const text = formatCifraclubPlaylist(data.evento, data.playlist, data.stats);
    if (await copyToClipboard(text)) {
      setCopied(true);
      toast.success("Playlist copiada para a área de transferência");
      setTimeout(() => setCopied(false), 3000);
    }
  }

  /** Compartilha a playlist via WhatsApp. */
  function handleWhatsApp() {
    if (!data) return;
    const text = formatCifraclubPlaylist(data.evento, data.playlist, data.stats);
    void shareViaWhatsApp(text);
  }

  const dataFormatada = data
    ? new Date(data.evento.data).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const actionsDisabled = !data || data.stats.com_link === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Guitar className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">CifraClub</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Playlist CifraClub</DialogTitle>
          {data && (
            <DialogDescription>
              {data.evento.descricao} — {dataFormatada}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Carregando playlist...
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <Badge variant={data.stats.com_link > 0 ? "secondary" : "outline"}>
              {data.stats.com_link > 0
                ? `${data.stats.com_link} de ${data.stats.total} músicas com cifra`
                : "Nenhuma música possui cifra cadastrada"}
            </Badge>

            <ol className="space-y-2 text-sm">
              {data.playlist.map((item) => (
                <li key={item.musica_id} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 text-right text-muted-foreground">
                    {item.ordem}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
                      <span className="font-medium truncate min-w-0">{item.nome}</span>
                      {item.tom_final && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {item.tom_final}
                        </Badge>
                      )}
                      {item.cifraclub_url && !item.tom_ajustado && (
                        <Badge variant="outline" className="text-xs flex-shrink-0 text-amber-600">
                          tom não ajustado
                        </Badge>
                      )}
                    </div>
                    {item.artista_nome && (
                      <span className="text-xs text-muted-foreground">{item.artista_nome}</span>
                    )}
                    {item.cifraclub_url && isSafeUrl(item.cifraclub_url) ? (
                      <a
                        href={item.cifraclub_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Abrir
                      </a>
                    ) : !item.cifraclub_url ? (
                      <p className="text-xs italic text-muted-foreground">Sem link CifraClub</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={actionsDisabled}
            aria-label={copied ? "Links copiados" : "Copiar links das cifras"}
          >
            {copied ? <Check className="h-4 w-4 sm:mr-1" /> : <Copy className="h-4 w-4 sm:mr-1" />}
            <span className="hidden sm:inline">
              {copied ? "Copiado" : "Copiar links"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            disabled={actionsDisabled}
            aria-label="Compartilhar playlist via WhatsApp"
          >
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden" aria-hidden="true">WA</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar diálogo"
          >
            <X className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Fechar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
