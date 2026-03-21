/**
 * Contexto de paleta de cores da aplicação.
 *
 * Gerencia a seleção de tema de cores (âmbar, clássico, etc.)
 * independentemente do modo claro/escuro (gerenciado pelo next-themes).
 * A paleta é persistida em localStorage e aplicada via classe CSS
 * no elemento raiz do documento.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

/** Definição de um tema de cores disponível. */
export interface ColorTheme {
  /** Identificador único do tema (usado na classe CSS e localStorage). */
  id: string;
  /** Nome exibido no menu de seleção. */
  label: string;
  /** Descrição curta do tema. */
  description: string;
}

/** Temas de cores disponíveis na aplicação. */
export const COLOR_THEMES: ColorTheme[] = [
  { id: "default", label: "Âmbar", description: "Padrão — ouro litúrgico" },
  { id: "classic", label: "Clássico", description: "Violeta e verde floresta" },
];

/** Chave do localStorage para persistência do tema de cores. */
const STORAGE_KEY = "louvorflow_color_theme";

/** Prefixo das classes CSS de tema no documento. */
const CLASS_PREFIX = "theme-";

/** Valor do contexto de paleta de cores. */
interface ThemeColorContextValue {
  /** ID do tema de cores ativo. */
  colorTheme: string;
  /** Altera o tema de cores ativo. */
  setColorTheme: (themeId: string) => void;
}

const ThemeColorContext = createContext<ThemeColorContextValue | undefined>(
  undefined,
);

/** Props do provider de paleta de cores. */
interface ThemeColorProviderProps {
  /** Componentes filhos. */
  children: ReactNode;
}

/**
 * Provider que gerencia a paleta de cores da aplicação.
 *
 * Aplica a classe CSS `theme-{id}` no `<html>` para ativar
 * as variáveis CSS do tema selecionado. O tema `default` não
 * adiciona classe (usa as variáveis de `:root`).
 *
 * @param props - Propriedades do provider.
 * @returns Provider com o contexto de paleta de cores.
 */
export function ThemeColorProvider({ children }: ThemeColorProviderProps) {
  const [colorTheme, setColorThemeState] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && COLOR_THEMES.some((t) => t.id === stored)) return stored;
    return "default";
  });

  /**
   * Aplica a classe do tema no elemento raiz e persiste a escolha.
   *
   * @param themeId - ID do tema a ativar.
   */
  function setColorTheme(themeId: string) {
    setColorThemeState(themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
  }

  /** Sincroniza a classe CSS do tema no `<html>` quando o tema muda. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.forEach((cls) => {
      if (cls.startsWith(CLASS_PREFIX)) root.classList.remove(cls);
    });
    if (colorTheme !== "default") {
      root.classList.add(`${CLASS_PREFIX}${colorTheme}`);
    }
  }, [colorTheme]);

  return (
    <ThemeColorContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

/**
 * Hook para acessar e alterar o tema de cores ativo.
 *
 * @returns Objeto com `colorTheme` (ID ativo) e `setColorTheme` (setter).
 * @throws Erro se usado fora do `ThemeColorProvider`.
 */
export function useColorTheme(): ThemeColorContextValue {
  const context = useContext(ThemeColorContext);
  if (!context) {
    throw new Error("useColorTheme deve ser usado dentro de ThemeColorProvider");
  }
  return context;
}
