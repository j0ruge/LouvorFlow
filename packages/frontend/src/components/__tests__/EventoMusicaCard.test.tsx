/**
 * Testes do card de música da escala (`SortableMusicaCard`): navegação por
 * clique/teclado e isolamento dos controles internos (`stopPropagation`).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { SortableMusicaCard } from "@/components/EventoDetail";
import type { MusicaEvento } from "@/schemas/evento";

/** Música de teste sem tonalidade e sem versões (picker renderiza null). */
const musica: MusicaEvento = {
  id: "musica-1",
  nome: "Oceans",
  ordem: 1,
  tonalidade: null,
  versao_selecionada: null,
  versoes_disponiveis: [],
};

/**
 * Renderiza o card dentro dos provedores necessários (DnD + React Query).
 *
 * @param props - Spies `onOpen` e `onRemove`.
 * @returns Resultado do render do RTL.
 */
function renderCard(props: {
  onOpen: (id: string) => void;
  onRemove: () => void;
}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DndContext>
        <SortableContext items={[musica.id]}>
          <SortableMusicaCard
            musica={musica}
            canWrite={true}
            eventoId="evento-1"
            isPending={false}
            onOpen={props.onOpen}
            onRemove={props.onRemove}
          />
        </SortableContext>
      </DndContext>
    </QueryClientProvider>,
  );
}

describe("SortableMusicaCard", () => {
  /** Clicar no corpo do card chama onOpen com o id da música. */
  it("navega ao clicar no card", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen, onRemove: vi.fn() });
    fireEvent.click(
      screen.getByRole("button", { name: /abrir detalhes da música oceans/i }),
    );
    expect(onOpen).toHaveBeenCalledWith("musica-1");
  });

  /** Enter aciona a navegação via teclado. */
  it("navega ao pressionar Enter", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen, onRemove: vi.fn() });
    fireEvent.keyDown(
      screen.getByRole("button", { name: /abrir detalhes da música oceans/i }),
      { key: "Enter" },
    );
    expect(onOpen).toHaveBeenCalledWith("musica-1");
  });

  /** Clicar em remover dispara onRemove e NÃO navega (stopPropagation). */
  it("remover não navega", () => {
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    renderCard({ onOpen, onRemove });
    fireEvent.click(screen.getByRole("button", { name: /remover música/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  /**
   * Enter/Espaço em controles internos (grip de arraste, botão de remover) NÃO
   * deve navegar: o keydown faz bubble até o card, mas o guard de `currentTarget`
   * no `onKeyDown` do card ignora eventos cujo alvo não seja o próprio card.
   */
  it("teclado em controle interno não navega (guard de currentTarget)", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen, onRemove: vi.fn() });
    fireEvent.keyDown(
      screen.getByRole("button", { name: /arrastar para reordenar/i }),
      { key: "Enter" },
    );
    fireEvent.keyDown(
      screen.getByRole("button", { name: /remover música/i }),
      { key: " " },
    );
    expect(onOpen).not.toHaveBeenCalled();
  });
});
