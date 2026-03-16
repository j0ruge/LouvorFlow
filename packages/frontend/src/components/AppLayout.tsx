/**
 * Layout principal da aplicação.
 *
 * Envolve o conteúdo com sidebar de navegação, header sticky
 * com controles de tema e menu do usuário autenticado.
 */

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { ReactNode } from "react";

/** Props do AppLayout. */
interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Componente de layout que estrutura sidebar, header e área de conteúdo.
 *
 * O header inclui o trigger do sidebar, toggle de tema e menu do usuário.
 *
 * @param children - Conteúdo da página renderizado na área principal.
 * @returns Elemento React com o layout completo.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-subtle">
        <AppSidebar />
        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <ThemeToggle />
            <UserMenu />
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
