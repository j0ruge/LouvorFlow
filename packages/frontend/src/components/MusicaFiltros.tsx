/**
 * Filtros da página de Músicas — intensidade (tempo) e categorias.
 *
 * No mobile os chips vivem atrás do botão "Filtros" (bottom-sheet via
 * `Drawer`), mantendo a busca por texto como protagonista da tela; no
 * desktop a página renderiza os chips inline. O conteúdo é compartilhado
 * pelos dois contextos via `MusicaFiltrosChips`, seguindo a regra do design
 * system de extrair conteúdo de overlay em subcomponente (evita duplicação).
 */

import { SlidersHorizontal, X } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { IntensityBars } from "@/components/IntensidadeSelector";
import {
  INTENSIDADE_OPTIONS,
  type Intensidade,
} from "@/components/intensidade-options";
import { cn, handleClickableKeyDown } from "@/lib/utils";

/** Propriedades dos chips de filtro (compartilhadas entre inline e drawer). */
export interface MusicaFiltrosProps {
  /** Categorias disponíveis (`{ id, nome }`) para o grupo de chips. */
  categorias: { id: string; nome: string }[];
  /** IDs das categorias atualmente selecionadas. */
  categoriaIds: string[];
  /** Intensidades (tempo) atualmente selecionadas. */
  intensidades: Intensidade[];
  /** Alterna uma categoria no filtro. */
  onToggleCategoria: (id: string) => void;
  /** Alterna uma intensidade no filtro. */
  onToggleIntensidade: (value: Intensidade) => void;
}

/** Propriedades do drawer mobile de filtros. */
export interface MusicaFiltrosDrawerProps extends MusicaFiltrosProps {
  /** Limpa todos os filtros de chips (categorias e intensidades). */
  onLimpar: () => void;
}

/**
 * Classes compartilhadas dos chips clicáveis conforme o estado.
 *
 * @param active - Se o chip está selecionado.
 * @returns String de classes Tailwind do chip.
 */
function chipClassName(active: boolean): string {
  return (
    "cursor-pointer select-none transition-colors " +
    (active
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "hover:bg-primary/10")
  );
}

/**
 * Grupos de chips multi-seleção de intensidade (tempo) e categorias.
 *
 * Usado inline no desktop (`Songs.tsx`) e dentro do drawer no mobile.
 *
 * @param props - Categorias, seleções atuais e callbacks de toggle.
 * @returns Elemento React com os dois grupos de chips.
 */
export function MusicaFiltrosChips({
  categorias,
  categoriaIds,
  intensidades,
  onToggleCategoria,
  onToggleIntensidade,
}: MusicaFiltrosProps) {
  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por intensidade (tempo)"
      >
        {INTENSIDADE_OPTIONS.map((opt) => {
          const active = intensidades.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={active ? "default" : "outline"}
              className={"gap-1.5 " + chipClassName(active)}
              role="button"
              aria-pressed={active}
              tabIndex={0}
              onClick={() => onToggleIntensidade(opt.value)}
              onKeyDown={handleClickableKeyDown(() =>
                onToggleIntensidade(opt.value),
              )}
            >
              <IntensityBars bars={opt.bars} className="h-3.5 w-3.5" />
              {opt.label}
            </Badge>
          );
        })}
      </div>

      {categorias.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por categoria"
        >
          {categorias.map((cat) => {
            const active = categoriaIds.includes(cat.id);
            return (
              <Badge
                key={cat.id}
                variant={active ? "default" : "outline"}
                className={chipClassName(active)}
                role="button"
                aria-pressed={active}
                tabIndex={0}
                onClick={() => onToggleCategoria(cat.id)}
                onKeyDown={handleClickableKeyDown(() =>
                  onToggleCategoria(cat.id),
                )}
              >
                {cat.nome}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Botão "Filtros" com bottom-sheet para o mobile.
 *
 * Exibe um contador de filtros ativos sobre o botão para que o estado dos
 * filtros permaneça visível mesmo colapsados. Os chips dentro do drawer
 * aplicam o filtro imediatamente (a lista atualiza por trás do overlay);
 * "Ver resultados" apenas fecha o sheet.
 *
 * @param props - Filtros, callbacks de toggle e ação de limpar.
 * @returns Elemento React com o gatilho e o drawer de filtros.
 */
export function MusicaFiltrosDrawer({
  onLimpar,
  ...chipProps
}: MusicaFiltrosDrawerProps) {
  const ativos = chipProps.categoriaIds.length + chipProps.intensidades.length;
  const rotulo =
    ativos > 0
      ? `Filtros, ${ativos} ${ativos === 1 ? "filtro ativo" : "filtros ativos"}`
      : "Filtros";

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative flex-shrink-0"
          aria-label={rotulo}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {ativos > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {ativos}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Filtros</DrawerTitle>
          <DrawerDescription>Refine por intensidade e categoria.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-2">
          <MusicaFiltrosChips {...chipProps} />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="bg-gradient-primary shadow-soft hover:opacity-90">
              Ver resultados
            </Button>
          </DrawerClose>
          <Button variant="ghost" onClick={onLimpar} disabled={ativos === 0}>
            Limpar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** Um filtro de chip atualmente ativo, resolvido para exibição removível. */
export interface FiltroAtivo {
  /** Chave estável (`categoria:<id>` / `intensidade:<value>`) para uso em `key` de lista. */
  chave: string;
  /** Rótulo humano exibido no badge (nome da categoria ou label da intensidade). */
  rotulo: string;
  /** Remove apenas este filtro, preservando os demais. */
  remover: () => void;
}

/**
 * Resolve os filtros de chips atualmente ativos (intensidades + categorias)
 * para uma lista de badges removíveis com rótulo humano.
 *
 * IDs de categoria que não existem mais em `categorias` (link antigo,
 * categoria excluída) são omitidos do retorno — não há rótulo humano para
 * eles. Por isso esta lista **não** deve ser usada para decidir se há
 * filtros ativos (gate de exibição de `MusicaFiltrosAtivos`): ver a
 * contagem crua usada lá.
 *
 * @param props - Categorias disponíveis, seleções atuais e callbacks de toggle.
 * @returns Filtros ativos resolvidos, intensidades seguidas de categorias —
 *   mesma ordem visual dos grupos em `MusicaFiltrosChips`.
 */
export function descreverFiltrosAtivos({
  categorias,
  categoriaIds,
  intensidades,
  onToggleCategoria,
  onToggleIntensidade,
}: MusicaFiltrosProps): FiltroAtivo[] {
  const intensidadesAtivas: FiltroAtivo[] = intensidades.map((value) => {
    const opcao = INTENSIDADE_OPTIONS.find((opt) => opt.value === value);
    return {
      chave: `intensidade:${value}`,
      rotulo: opcao?.label ?? value,
      remover: () => onToggleIntensidade(value),
    };
  });

  const categoriasAtivas: FiltroAtivo[] = categoriaIds.flatMap((id) => {
    const categoria = categorias.find((c) => c.id === id);
    if (!categoria) return [];
    return [
      {
        chave: `categoria:${id}`,
        rotulo: categoria.nome,
        remover: () => onToggleCategoria(id),
      },
    ];
  });

  return [...intensidadesAtivas, ...categoriasAtivas];
}

/** Propriedades de `MusicaFiltrosAtivos`. */
export interface MusicaFiltrosAtivosProps extends MusicaFiltrosProps {
  /** Remove todos os filtros de chips ativos (categorias e intensidades). */
  onLimpar: () => void;
  /**
   * Callback opcional disparado depois de remover um filtro (badge
   * individual ou "Limpar filtros"). O botão acionado desmonta nesse
   * instante — remover o único filtro restante zera `ativos` e o
   * componente inteiro retorna `null` — então o foco cairia em `<body>`
   * sem essa notificação. O componente não conhece o destino do foco (Lei
   * de Demeter): quem usa (`Songs.tsx`) decide focar a busca através deste
   * hook, sem que `MusicaFiltrosAtivos` precise referenciar `searchRef`.
   */
  aoRemover?: () => void;
}

/**
 * Badges removíveis dos filtros de chips atualmente ativos, com botão
 * "Limpar filtros" ao lado.
 *
 * Renderizado junto da linha de resultados em `Songs.tsx`. O gate de
 * exibição usa a contagem **crua** de filtros
 * (`categoriaIds.length + intensidades.length`), não
 * `descreverFiltrosAtivos().length`: `Songs.tsx` mantém na URL qualquer
 * UUID bem-formado de categoria (mesmo inexistente), e usar a contagem
 * resolvida deixaria o usuário preso num resultado vazio sem badges e sem
 * botão para limpar o filtro inválido. Cada badge é o pill inteiro
 * clicável (não um badge inerte com "x" aninhado, como em `MusicaDetail.tsx`)
 * — decisão deliberada: aumenta a área de toque a 360px (item crítico de
 * mobile-first) às custas de destoar do padrão de badge de dado; a pista
 * `hover:text-destructive` compensa a affordance de remoção.
 *
 * @param props - Filtros ativos, categorias disponíveis e callbacks de toggle/limpar/foco.
 * @returns Elemento React com os badges removíveis, ou `null` sem filtros ativos.
 */
export function MusicaFiltrosAtivos(props: MusicaFiltrosAtivosProps) {
  const { onLimpar, aoRemover, categoriaIds, intensidades } = props;
  const ativos = categoriaIds.length + intensidades.length;
  if (ativos === 0) return null;

  const filtros = descreverFiltrosAtivos(props);

  /**
   * Remove um filtro específico e avisa o consumidor via `aoRemover` — o
   * badge clicado (e possivelmente o componente inteiro, se era o último
   * filtro) desmonta em seguida.
   *
   * @param filtro - Filtro a remover.
   */
  function removerFiltro(filtro: FiltroAtivo) {
    filtro.remover();
    aoRemover?.();
  }

  /**
   * Limpa todos os filtros e avisa o consumidor via `aoRemover` — mesmo
   * motivo de `removerFiltro`: o componente sempre desmonta ao zerar os
   * filtros ativos.
   */
  function limparTodosOsFiltros() {
    onLimpar();
    aoRemover?.();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filtros.map((filtro) => (
        <button
          key={filtro.chave}
          type="button"
          onClick={() => removerFiltro(filtro)}
          aria-label={`Remover filtro ${filtro.rotulo}`}
          className={cn(
            badgeVariants({ variant: "secondary" }),
            "min-h-[32px] cursor-pointer gap-1.5 px-3 py-1.5 hover:border-destructive/40 hover:bg-secondary/70 hover:text-destructive",
          )}
        >
          {filtro.rotulo}
          <X className="h-3 w-3" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={limparTodosOsFiltros}>
        Limpar filtros
      </Button>
    </div>
  );
}
