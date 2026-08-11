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
 *
 * Com a prop opcional `dirtyGuard` (ver `useDirtyFormGuard`), as saídas
 * nativas do overlay (Esc, clique no backdrop, o X do `DialogContent`) são
 * interceptadas quando há alterações não salvas: em vez de fechar, exibem o
 * `DiscardChangesVeil` sobre o formulário. Sem a prop, o comportamento
 * permanece intacto.
 */

import { useEffect, useState } from "react";
import type { FormEventHandler, HTMLAttributes, ReactNode } from "react";
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
import { DiscardChangesVeil } from "@/components/DiscardChangesVeil";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DirtyFormGuard } from "@/hooks/use-dirty-form-guard";
import { cn } from "@/lib/utils";

/**
 * Atributos que tornam a subárvore do formulário inerte enquanto o veil de
 * descarte está aberto: `inert` contém foco/Tab/cliques e `aria-hidden`
 * esconde a subárvore dos leitores de tela — o que torna honesto o
 * `aria-modal` do veil. O cast é necessário porque `@types/react` 18 não
 * tipa o atributo `inert`.
 *
 * ATENÇÃO (migração React 19): lá `inert` vira prop booleana tipada — a
 * string vazia é falsy e o atributo seria REMOVIDO, desativando o veil
 * silenciosamente. Ao migrar, trocar para `inert: true`.
 */
const PROPS_INERTES = {
  inert: "",
  "aria-hidden": true,
} as unknown as HTMLAttributes<HTMLDivElement>;

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
  /**
   * Classes extras para o `DialogContent` no desktop (ex.: `sm:max-w-[600px]`).
   * Ignorado no mobile — o ramo `Drawer` (bottom-sheet) não recebe esta prop.
   */
  contentClassName?: string;
  /**
   * Guarda de alterações não salvas (ver `useDirtyFormGuard`). Quando
   * presente, as saídas nativas do overlay passam por
   * `dirtyGuard.pedirFechamento()` em vez de fechar direto, e o
   * `DiscardChangesVeil` é renderizado sobre o formulário quando
   * `veilAberto`. Sem a prop, comportamento atual intacto.
   */
  dirtyGuard?: DirtyFormGuard;
}

/**
 * Corpo compartilhado entre Drawer e Dialog: `<form>` com área rolável de
 * campos e rodapé fixo. Reutilizado nos dois ramos para evitar duplicação.
 *
 * `noValidate` é obrigatório aqui: campos com `min`/`max` nativos (ex.: BPM
 * em `MusicaForm.tsx`/`VersaoForm.tsx`) disparam a constraint validation do
 * próprio navegador no submit, que bloqueia o evento *antes* do `onSubmit`
 * (e, portanto, antes do resolver Zod) rodar — a mensagem de erro em
 * PT-BR do `FormMessage` nunca aparece e o botão "Salvar" parece não fazer
 * nada, mesmo editando outro campo. Isso também torna registros legados
 * fora da faixa (ex.: BPM gravado antes da validação existir) impossíveis
 * de editar, já que o valor herdado já viola o `min`/`max` no primeiro
 * render. `min`/`max` continuam no input como affordance visual (setas do
 * spinner, teclado numérico), mas quem decide se o formulário é válido é
 * sempre o Zod + `FormMessage` — a arquitetura de validação do app.
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
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
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
  dirtyGuard,
}: ResponsiveFormDialogProps) {
  const isMobile = useIsMobile();

  const bloqueia = dirtyGuard?.bloqueiaSaida ?? false;
  const veilAberto = dirtyGuard?.veilAberto ?? false;

  /**
   * Ponto único de interceptação das saídas nativas: no desktop, Esc,
   * backdrop e o X do `DialogContent` desembocam todos no `onOpenChange`
   * da `Dialog` raiz. Com `dirtyGuard`, o pedido de fechamento vira
   * `pedirFechamento()` (que fecha direto se limpo e abre o veil se sujo)
   * e o `false` NÃO é propagado — a modal continua montada.
   *
   * @param nextOpen - Novo estado de visibilidade pedido pelo overlay.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && dirtyGuard) {
      dirtyGuard.pedirFechamento();
      return;
    }
    onOpenChange(nextOpen);
  }

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
    /**
     * Interceptação mobile (vaul): um ponto único NÃO funciona aqui. Com o
     * guard ativo é preciso `dismissible={false}` — senão o swipe-down do
     * vaul chama `closeDrawer()` sem `resetDrawer()` e a folha ficaria presa
     * no transform do arraste, meio fora da tela. Só que com
     * `dismissible={false}` o vaul engole o fechamento antes do nosso
     * `onOpenChange` (`if (!dismissible && !open) return;`), então Esc e
     * backdrop precisam ser interceptados direto no `DrawerContent`
     * (`onEscapeKeyDown`/`onPointerDownOutside`, que o `ui/drawer.tsx`
     * repassa ao `DialogPrimitive.Content` subjacente). Custo aceito: com o
     * guard ativo o swipe-down fica inerte — backdrop e "Cancelar" seguem
     * exibindo o veil.
     */
    return (
      <Drawer
        open={open}
        dismissible={!bloqueia}
        onOpenChange={handleOpenChange}
      >
        <DrawerContent
          className="max-h-[92dvh] overflow-hidden"
          onEscapeKeyDown={(event) => {
            if (bloqueia && dirtyGuard) {
              event.preventDefault();
              dirtyGuard.pedirFechamento();
            }
          }}
          onPointerDownOutside={(event) => {
            if (bloqueia && dirtyGuard) {
              event.preventDefault();
              dirtyGuard.pedirFechamento();
            }
          }}
        >
          {/*
            O <div> intermediário é INCONDICIONAL: renderizá-lo só quando há
            veil trocaria o tipo de elemento nesta posição, desmontando a
            subárvore e apagando o que o usuário digitou. Só o spread
            `PROPS_INERTES` é condicional.
          */}
          <div
            className="flex min-h-0 flex-1 flex-col"
            {...(veilAberto ? PROPS_INERTES : {})}
          >
            <DrawerHeader className="shrink-0 text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            <ResponsiveFormBody onSubmit={onSubmit} footer={footer}>
              {children}
            </ResponsiveFormBody>
          </div>
          {veilAberto && dirtyGuard && (
            <DiscardChangesVeil
              onKeepEditing={dirtyGuard.continuarEditando}
              onDiscard={dirtyGuard.descartar}
            />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  /**
   * Resíduo conhecido e aceito: o `<DialogPrimitive.Close>` (o X) do
   * `ui/dialog.tsx` é irmão do wrapper inerte e continua focável com o veil
   * aberto — clicá-lo só re-dispara `pedirFechamento()` (idempotente).
   */
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0",
          contentClassName,
        )}
      >
        {/*
          O <div> intermediário é INCONDICIONAL: renderizá-lo só quando há
          veil trocaria o tipo de elemento nesta posição, desmontando a
          subárvore e apagando o que o usuário digitou. Só o spread
          `PROPS_INERTES` é condicional.
        */}
        <div
          className="flex min-h-0 flex-1 flex-col"
          {...(veilAberto ? PROPS_INERTES : {})}
        >
          <DialogHeader className="shrink-0 px-4 pt-6 sm:px-6">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <ResponsiveFormBody onSubmit={onSubmit} footer={footer}>
            {children}
          </ResponsiveFormBody>
        </div>
        {veilAberto && dirtyGuard && (
          <DiscardChangesVeil
            onKeepEditing={dirtyGuard.continuarEditando}
            onDiscard={dirtyGuard.descartar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
