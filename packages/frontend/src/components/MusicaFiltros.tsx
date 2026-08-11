/**
 * Filtros da página de Músicas — intensidade (tempo) e categorias.
 *
 * No mobile os chips vivem atrás do botão "Filtros" (bottom-sheet via
 * `Drawer`), mantendo a busca por texto como protagonista da tela; no
 * desktop a página renderiza os chips inline. O conteúdo é compartilhado
 * pelos dois contextos via `MusicaFiltrosChips`, seguindo a regra do design
 * system de extrair conteúdo de overlay em subcomponente (evita duplicação).
 */

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { handleClickableKeyDown } from "@/lib/utils";

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
