/**
 * Componente de ações de compartilhamento de escala via WhatsApp.
 *
 * Renderiza dois botões: "Copiar texto" (clipboard) e "Abrir no WhatsApp" (wa.me).
 * Utiliza as funções puras de `lib/whatsapp-share.ts` para formatar e compartilhar,
 * com feedback via toast Sonner e ícone de confirmação temporário.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  copyEscalaToClipboard,
  formatEscalaWhatsApp,
  buildWhatsAppShareUrl,
} from "@/lib/whatsapp-share";
import type { EventoShow } from "@/schemas/evento";

/**
 * Limite prático de tamanho da URL wa.me — WhatsApp e alguns navegadores truncam
 * URLs acima de ~4 KB. Aplicamos uma margem de segurança para o prefixo `wa.me/?text=`
 * e encoding percent. Se a mensagem codificada exceder, avisamos o usuário a usar "Copiar".
 */
const WHATSAPP_URL_SAFE_LIMIT = 3800;

/** Props do componente EscalaShareActions. */
interface EscalaShareActionsProps {
  evento: EventoShow | undefined;
}

/**
 * Grupo de ações de compartilhamento de escala.
 *
 * Exibe dois botões:
 * - "Copiar texto": copia a escala formatada para a área de transferência com toast de sucesso/erro.
 * - "Abrir no WhatsApp": abre o wa.me com a mensagem pré-preenchida em nova aba.
 *   Se a mensagem exceder o limite de URL do WhatsApp, exibe toast orientando a usar "Copiar".
 *
 * Ambos os botões ficam desabilitados quando `evento` é `undefined`.
 *
 * @param props - Propriedades contendo o evento (escala) a ser compartilhado.
 * @returns Fragmento React com os dois botões de compartilhamento.
 */
export function EscalaShareActions({ evento }: EscalaShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Memoiza o texto formatado — evita reformatar a escala em cada render e garante
   * identidade estável para os dois handlers.
   */
  const formattedMessage = useMemo(
    () => (evento ? formatEscalaWhatsApp(evento) : ""),
    [evento],
  );

  /** Limpa o timeout pendente ao desmontar o componente para evitar setState pós-unmount. */
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Handler do botão "Copiar texto".
   * Copia a escala formatada para o clipboard, exibe toast de feedback
   * e alterna o ícone para check por 3 segundos (com cleanup do timer anterior).
   */
  async function handleCopy() {
    if (!evento) return;
    try {
      await copyEscalaToClipboard(evento);
      setCopied(true);
      toast.success("Escala copiada para a área de transferência");
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 3000);
    } catch {
      toast.error('Não foi possível copiar. Use o botão "Abrir no WhatsApp".');
    }
  }

  /**
   * Handler do botão "Abrir no WhatsApp".
   * Abre nova aba com a URL wa.me contendo a escala formatada.
   * Se a mensagem codificada exceder `WHATSAPP_URL_SAFE_LIMIT`, orienta o usuário
   * a usar "Copiar texto" (evita truncamento silencioso).
   * Exibe toast de erro caso o popup seja bloqueado pelo navegador.
   */
  function handleWhatsApp() {
    if (!evento) return;
    const encoded = encodeURIComponent(formattedMessage);
    if (encoded.length > WHATSAPP_URL_SAFE_LIMIT) {
      toast.error(
        'Escala muito grande para compartilhar via link do WhatsApp. Use "Copiar texto" e cole na conversa.',
      );
      return;
    }
    const url = buildWhatsAppShareUrl(formattedMessage);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win === null) {
      toast.error(
        "Pop-up bloqueado. Habilite pop-ups para este site ou use 'Copiar texto'.",
      );
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={!evento}
        aria-label="Copiar escala para a área de transferência"
      >
        {copied ? (
          <Check className="h-4 w-4 sm:mr-1 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 sm:mr-1" />
        )}
        <span className="hidden sm:inline">Copiar texto</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        disabled={!evento}
        aria-label="Abrir escala no WhatsApp"
      >
        <MessageCircle className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
    </>
  );
}
