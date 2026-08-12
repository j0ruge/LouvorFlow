/**
 * Linha unificada de evento (escala), usada por Dashboard, Histórico e
 * Escalas.
 *
 * Antes desta unificação, as três telas renderizavam a mesma entidade
 * (`EventoIndex`) com anatomias divergentes — inclusive usando campos
 * opostos como título (Histórico priorizava `tipoEvento`, Dashboard
 * priorizava `descricao`). `EventoRow` fixa uma única cadeia de fallback de
 * título e um único markup mobile-first, e expõe slots (`badges`, `acoes`)
 * para que cada tela componha o que é específico dela sem duplicar a
 * anatomia base.
 */

import type { ReactNode } from "react";
import { formatDateBlock, handleClickableKeyDown, cn } from "@/lib/utils";
import type { EventoIndex } from "@/schemas/evento";

/** Propriedades do componente `EventoRow`. */
interface EventoRowProps {
  /** Evento (escala) a ser exibido. */
  evento: EventoIndex;
  /**
   * Callback disparado ao ativar a linha (clique ou Enter/Espaço com foco
   * nela). Quando ausente, a linha não vira `role="button"` — usado em
   * telas como Escalas, que já têm ações destrutivas próprias no rodapé do
   * card e não devem tornar a linha inteira clicável.
   */
  onOpen?: (id: string) => void;
  /** Linha auxiliar exibida abaixo do título (ex.: data por extenso). */
  legenda?: string;
  /** Slot de badges extras, renderizado ao lado da pill de tipo de evento. */
  badges?: ReactNode;
  /** Slot de ações (ex.: Duplicar, Detalhes), isolado de `onOpen` via `stopPropagation`. */
  acoes?: ReactNode;
  /** Classes adicionais (ex.: destaque de item recém-criado). */
  className?: string;
}

/**
 * Resolve o título exibível de um evento (escala) pela cadeia de fallback
 * `descricao.trim() || tipoEvento?.nome || "Escala"`.
 *
 * `EventoRow` é o dono desta regra (é o título que ele renderiza); o helper
 * é exportado para que consumidores que precisam do mesmo título fora da
 * linha (ex.: `aria-label` de ações por item, descrição de dialogs) não
 * dupliquem a cadeia — `tipoEvento` já aparece como pill na própria linha,
 * então usá-lo como preferência de título duplicaria a informação.
 *
 * @param evento - Evento (escala) cujo título será resolvido.
 * @returns Título humano do evento.
 */
export function tituloDoEvento(evento: EventoIndex): string {
  return evento.descricao.trim() || evento.tipoEvento?.nome || "Escala";
}

/**
 * Pluraliza uma contagem em PT-BR, escolhendo a forma singular ou plural.
 *
 * @param quantidade - Quantidade a exibir.
 * @param singular - Forma singular da palavra (ex.: `"música"`).
 * @param plural - Forma plural da palavra (ex.: `"músicas"`).
 * @returns Texto `"{quantidade} {forma}"` com a forma gramatical correta.
 */
function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/**
 * Renderiza uma linha de evento (escala) com bloco de data, título,
 * legenda opcional, contagem de músicas/integrantes, pill de tipo de
 * evento, badges extras e ações — reaproveitada por Dashboard, Histórico e
 * Escalas.
 *
 * O título segue a cadeia `descricao.trim() || tipoEvento?.nome || "Escala"`:
 * `tipoEvento` já aparece como pill nesta mesma linha, então usá-lo também
 * como título duplicaria a informação; a cadeia garante que um evento sem
 * descrição ainda mostre algo significativo.
 *
 * Quando `onOpen` é informado, a linha inteira vira `role="button"`
 * acionável por clique ou teclado (guarda de `currentTarget` no
 * `onKeyDown` evita que Enter/Espaço em controles dentro de `acoes`
 * disparem a navegação). O slot `acoes` sempre isola cliques com
 * `stopPropagation`, mesmo sem `onOpen`, para que o consumidor não precise
 * repetir essa lógica em cada botão.
 *
 * O título é um `<h3>` (não `<div>`): tanto o History quanto o Escalas já
 * expunham um heading por linha antes desta unificação (`<h3>` e
 * `CardTitle`, respectivamente, que também renderiza `<h3>`) — usuários de
 * leitor de tela navegam listas de eventos pulando entre headings, e um
 * `<div>` os removeria dessa navegação. O preflight do Tailwind (`@tailwind
 * base`) zera margin/font-size padrão do `<h3>`, então o elemento é
 * visualmente neutro; a classe utilitária de texto continua controlando a
 * aparência.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento JSX com a linha do evento.
 */
export function EventoRow({
  evento,
  onOpen,
  legenda,
  badges,
  acoes,
  className,
}: EventoRowProps) {
  const { dia, mes } = formatDateBlock(evento.data);
  const titulo = tituloDoEvento(evento);
  const temTagsAoLadoDoTitulo = Boolean(evento.tipoEvento) || Boolean(badges);

  /** Aciona `onOpen` com o id do evento, quando informado. */
  function abrir() {
    onOpen?.(evento.id);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 p-3 rounded-xl bg-gradient-card border border-border",
        onOpen && "cursor-pointer hover:border-primary/30 transition-colors",
        className,
      )}
      onClick={onOpen ? abrir : undefined}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      /*
        `role="button"` calcula o nome acessível "a partir do conteúdo": sem um
        rótulo explícito, o texto dos botões do slot `acoes` (Duplicar,
        Detalhes, Publicar) entra no nome da linha e é anunciado duas vezes —
        uma como parte da linha, outra ao chegar em cada botão. Combinação real
        em `History.tsx`, que passa `onOpen` e `acoes` juntos.
        `legenda` é opcional (o `Dashboard.tsx` não a passa), então entra pelo
        filtro — interpolá-la direto anunciaria a palavra "undefined".
      */
      aria-label={
        onOpen ? [titulo, legenda].filter(Boolean).join(", ") : undefined
      }
      onKeyDown={
        onOpen
          ? (e) => {
              // Enter/Espaço disparados em controles internos (ex.: botões do
              // slot `acoes`) fazem bubble até aqui; a guarda de currentTarget
              // garante que só o próprio corpo da linha aciona a navegação.
              if (e.target === e.currentTarget) {
                handleClickableKeyDown(abrir)(e);
              }
            }
          : undefined
      }
    >
      {/* Bloco de data âmbar */}
      <div className="w-[52px] flex-shrink-0 text-center py-1.5 rounded-[10px] bg-primary/10 text-primary">
        <div className="font-display text-xl font-bold leading-none tabular-nums">
          {dia}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] mt-[3px]">
          {mes}
        </div>
      </div>

      {/* Corpo */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground leading-tight truncate min-w-0">
            {titulo}
          </h3>
          {temTagsAoLadoDoTitulo && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {evento.tipoEvento && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light truncate max-w-[7rem]">
                  {evento.tipoEvento.nome}
                </span>
              )}
              {badges}
            </div>
          )}
        </div>
        {legenda && (
          <div className="text-xs text-muted-foreground mt-[3px] truncate">
            {legenda}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-[3px] truncate">
          {pluralizar(evento.musicas.length, "música", "músicas")} ·{" "}
          {pluralizar(evento.integrantes.length, "integrante", "integrantes")}
        </div>
      </div>

      {/* Ações — sempre isoladas de onOpen, mesmo quando a linha não é clicável */}
      {acoes && (
        <div
          className="flex w-full gap-2 sm:ml-auto sm:w-auto flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {acoes}
        </div>
      )}
    </div>
  );
}
