/**
 * Componente de ações de compartilhamento de escala via WhatsApp.
 *
 * Renderiza dois botões: "Copiar texto" (clipboard) e "Abrir no WhatsApp" (wa.me).
 * Utiliza as funções puras de `lib/whatsapp-share.ts` para formatar e compartilhar,
 * com feedback via toast Sonner e ícone de confirmação temporário.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

/**
 * Ícone SVG do WhatsApp usando currentColor para herdar a cor do contexto.
 * Exibido apenas no mobile (onde o botão é icon-only) para comunicar
 * claramente a intenção do botão sem o label de texto.
 */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
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
        <WhatsAppIcon className="h-4 w-4 sm:hidden" />
        <MessageCircle className="h-4 w-4 mr-1 hidden sm:block" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
    </>
  );
}
