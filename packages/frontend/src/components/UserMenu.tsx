/**
 * Menu do usuário no header da aplicação.
 *
 * Exibe o avatar do usuário autenticado que, ao ser clicado,
 * abre um dropdown estilo GitHub com nome, e-mail, link para
 * o perfil e botão de logout.
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

  if (!user) return null;

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
          className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Menu do usuário"
        >
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {currentTenant && (
              <p className="text-xs leading-none text-muted-foreground/70 mt-0.5">
                {currentTenant.name}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/perfil")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            Temas
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
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
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
