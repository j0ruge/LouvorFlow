/**
 * Barra lateral de navegação principal da aplicação.
 *
 * Renderiza o menu de navegação com itens de domínio (acessíveis a todos
 * os usuários autenticados) e uma seção "Administração" condicional
 * (visível apenas para usuários com role "admin"). O item "Configurações"
 * fica na seção Administração e é gateado por `configuracoes.write`. O item
 * "Igrejas" é exibido adicionalmente apenas para usuários com role
 * "super-admin". TenantSwitcher fica no rodapé como tile.
 */

import { useEffect } from "react";
import {
  Music,
  Calendar,
  Users,
  BarChart2,
  History,
  LayoutDashboard,
  Settings,
  Shield,
  UserCog,
  Key,
  Building2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { TenantSwitcher } from "@/components/TenantSwitcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Músicas", url: "/musicas", icon: Music },
  { title: "Escalas", url: "/escalas", icon: Calendar },
  { title: "Integrantes", url: "/integrantes", icon: Users },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Relatórios", url: "/relatorios", icon: BarChart2 },
];

/** Itens base do menu de administração (visíveis apenas para admins). */
const adminItems = [
  { title: "Usuários", url: "/admin/usuarios", icon: UserCog },
  { title: "Roles", url: "/admin/roles", icon: Shield },
  { title: "Permissões", url: "/admin/permissoes", icon: Key },
];

/** Classes compartilhadas dos items de navegação (estado base). */
const navItemClass =
  "flex items-center gap-3 rounded-lg px-2.5 py-2.5 min-h-11 text-[15px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent [&_svg]:text-muted-foreground hover:[&_svg]:text-foreground";

/** Classes aplicadas ao item ativo (sobrescrevem o estado base com !important). */
const navItemActiveClass =
  "!bg-sidebar-accent font-semibold !text-foreground [&_svg]:!text-primary";

/**
 * Componente da barra lateral de navegação.
 *
 * Renderiza menu de domínio para todos os autenticados e seção "Administração"
 * apenas para admins. Suporta colapso e fecha automaticamente em mobile ao
 * mudar de rota. TenantSwitcher fica no rodapé.
 *
 * @returns Elemento React com a sidebar de navegação.
 */
export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin, isSuperAdmin } = useAuth();
  const { can: canConfig } = useCan("configuracoes.write");

  /**
   * Lista de items administrativos efetiva, incluindo Configurações condicional.
   * Configurações só aparece para admins com permissão `configuracoes.write`.
   */
  const visibleAdminItems = [
    ...adminItems,
    ...(canConfig
      ? [{ title: "Configurações", url: "/configuracoes", icon: Settings }]
      : []),
  ];

  /**
   * Fecha o menu mobile (Sheet) automaticamente quando a rota muda.
   * Evita que o overlay permaneça aberto após o usuário clicar em um item.
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
      <SidebarHeader className="border-b border-sidebar-border px-3 h-16 flex items-center">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-[10px] bg-gradient-primary shadow-soft flex items-center justify-center shrink-0">
              <Music className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-display text-lg font-bold tracking-tight text-sidebar-foreground leading-none">
              LouvorFlow
            </h2>
          </div>
        ) : (
          <div className="h-9 w-9 rounded-[10px] bg-gradient-primary shadow-soft flex items-center justify-center mx-auto">
            <Music className="h-5 w-5 text-white" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground/80 px-3 pt-3.5 pb-1.5">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={navItemClass}
                      activeClassName={navItemActiveClass}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
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
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground/80 px-3 pt-3.5 pb-1.5">
              {!collapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className={navItemClass}
                        activeClassName={navItemActiveClass}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {isSuperAdmin && (
                  <SidebarMenuItem key="Igrejas">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/igrejas")}
                    >
                      <NavLink
                        to="/admin/igrejas"
                        className={navItemClass}
                        activeClassName={navItemActiveClass}
                      >
                        <Building2 className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span>Igrejas</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <TenantSwitcher compact={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
