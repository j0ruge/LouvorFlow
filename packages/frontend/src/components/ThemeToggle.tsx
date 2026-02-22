/**
 * Botão de alternância entre tema claro e escuro.
 *
 * Utiliza `resolvedTheme` do next-themes para resolver corretamente o tema
 * quando configurado como "system". Renderiza um placeholder até a montagem
 * para evitar flash de conteúdo incorreto (hydration mismatch).
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

/**
 * Botão de alternância de tema claro/escuro.
 *
 * @returns Elemento React com o botão de toggle de tema.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /** Marca o componente como montado para evitar mismatch de hydration. */
  useEffect(function markMounted() {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
