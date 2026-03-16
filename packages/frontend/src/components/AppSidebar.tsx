/**
 * Barra lateral de navegação principal da aplicação.
 *
 * Renderiza o menu de navegação com itens de domínio (acessíveis a todos
 * os usuários autenticados), filtrando "Configurações" para usuários com
 * permissão `configuracoes.write`, e uma seção "Administração" condicional
 * (visível apenas para usuários com role "admin").
 */

import { useEffect } from "react";
import {
  Music,
  Calendar,
  Users,
  BarChart3,
  History,
  Home,
  Settings,
  Shield,
  UserCog,
  Key,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

/** Itens do menu de domínio (acessíveis a todos os autenticados). */
const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Músicas", url: "/musicas", icon: Music },
  { title: "Escalas", url: "/escalas", icon: Calendar },
  { title: "Integrantes", url: "/integrantes", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Histórico", url: "/historico", icon: History },
];

/** Itens do menu de administração (visíveis apenas para admins). */
const adminItems = [
  { title: "Usuários", url: "/admin/usuarios", icon: UserCog },
  { title: "Roles", url: "/admin/roles", icon: Shield },
  { title: "Permissões", url: "/admin/permissoes", icon: Key },
];

/**
 * Componente da barra lateral de navegação.
 *
 * Renderiza menu de domínio para todos os autenticados, ocultando
 * "Configurações" para quem não tem `configuracoes.write`, e seção
 * "Administração" apenas para admins. Suporta colapso e fecha
 * automaticamente em mobile ao mudar de rota.
 *
 * @returns Elemento React com a sidebar de navegação.
 */
export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useAuth();
  const { can: canConfig } = useCan("configuracoes.write");

  /**
   * Fecha o menu mobile (Sheet) automaticamente quando a rota muda.
   * Evita que o overlay permaneça aberto após o usuário clicar em um item de navegação.
   */
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

  /**
   * Verifica se a rota informada está ativa.
   *
   * @param path - Caminho da rota a verificar.
   * @returns `true` se a rota está ativa.
   */
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-sidebar-foreground" />
            <h2 className="text-lg font-bold text-sidebar-foreground">LouvorFlow</h2>
          </div>
        )}
        {collapsed && (
          <Music className="h-6 w-6 text-sidebar-foreground mx-auto" />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center" : ""}>
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter((item) => item.url !== "/configuracoes" || canConfig).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "text-center" : ""}>
              {!collapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
