/**
 * Menu do usuário no header da aplicação.
 *
 * Exibe o avatar do usuário autenticado que, ao ser clicado,
 * abre um dropdown com nome, e-mail, igreja atual, acesso ao
 * perfil, seleção de tema de cores (inline no mobile, submenu
 * lateral no desktop) e botão de logout.
 */

import { LogOut, User, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { useColorTheme } from "@/hooks/use-color-theme";
import { COLOR_THEMES } from "@/contexts/ThemeColorContext";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Componente de menu do usuário com avatar e dropdown.
 *
 * Exibe no header o avatar do usuário autenticado. Ao clicar,
 * mostra dropdown com informações do usuário, acesso ao perfil
 * e opção de logout.
 *
 * @returns Elemento JSX com o menu do usuário.
 */
export function UserMenu() {
  const { user, signOut, currentTenant } = useAuth();
  const navigate = useNavigate();
  const { colorTheme, setColorTheme } = useColorTheme();
  const isMobile = useIsMobile();

  if (!user) return null;

  /**
   * Rótulo curto da role principal do usuário, capitalizado em PT-BR.
   * Usado como subtítulo no chip do header.
   */
  const roleLabel = (() => {
    const primaryRole = user.roles?.[0]?.name;
    if (!primaryRole) return null;
    const map: Record<string, string> = {
      "super-admin": "Super Admin",
      admin: "Admin",
      lider: "Líder",
      integrante: "Integrante",
    };
    return (
      map[primaryRole] ??
      primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)
    );
  })();

  /** Itens de rádio para seleção de tema de cores. */
  const themeRadioItems = (
    <DropdownMenuRadioGroup
      value={colorTheme}
      onValueChange={setColorTheme}
    >
      {COLOR_THEMES.map((theme) => (
        <DropdownMenuRadioItem
          key={theme.id}
          value={theme.id}
          className="cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="text-sm">{theme.label}</span>
            <span className="text-xs text-muted-foreground">
              {theme.description}
            </span>
          </div>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  /**
   * Executa logout e redireciona à tela de login.
   */
  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2.5 pl-1 pr-2 sm:pr-3 py-1 rounded-full border border-border bg-transparent transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-9"
          aria-label="Menu do usuário"
        >
          <Avatar className="h-7 w-7 cursor-pointer">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-primary text-white text-[11px] font-bold tracking-[0.02em]">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left leading-tight min-w-0 max-w-[140px]">
            <span className="text-[12.5px] font-bold text-foreground truncate">
              {user.name}
            </span>
            {roleLabel && (
              <span className="text-[10.5px] text-muted-foreground mt-px truncate">
                {roleLabel}
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 p-0 rounded-xl border border-border shadow-medium overflow-hidden"
      >
        {/* Header — card visual com avatar tile */}
        <div className="flex items-center gap-3 p-4 bg-gradient-card border-b border-border">
          <Avatar className="h-11 w-11 shrink-0 shadow-soft">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold tracking-[0.02em]">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-foreground leading-tight truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {user.email}
            </p>
            {currentTenant && (
              <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">
                {currentTenant.name}
              </p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={() => navigate("/perfil")}
            className="cursor-pointer rounded-md py-2.5 px-2 gap-2.5"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Meu Perfil</span>
          </DropdownMenuItem>

          {isMobile ? (
            <>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.06em] font-semibold text-muted-foreground flex items-center gap-2 px-2 pt-1.5 pb-1">
                <Palette className="h-3.5 w-3.5" />
                Temas
              </DropdownMenuLabel>
              <div className="px-0">{themeRadioItems}</div>
            </>
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer rounded-md py-2.5 px-2 gap-2.5">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Temas</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-xl border border-border shadow-medium p-1.5">
                {themeRadioItems}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </div>

        {/* Logout — destacado */}
        <DropdownMenuSeparator className="my-0" />
        <div className="p-1.5 bg-muted/30">
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer rounded-md py-2.5 px-2 gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Sair</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
