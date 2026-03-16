/**
 * Componente raiz da aplicação LouvorFlow.
 *
 * Configura os provedores globais (QueryClientProvider, ThemeProvider,
 * TooltipProvider, AuthProvider), o sistema de notificações (Sonner)
 * e o roteamento SPA via React Router.
 *
 * Rotas públicas (login, esqueci-senha, redefinir-senha) são acessíveis
 * sem autenticação. Todas as demais rotas são protegidas via ProtectedRoute.
 * Rotas administrativas exigem role "admin" via AdminRoute.
 *
 * @component
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import Dashboard from "./pages/Dashboard";
import Songs from "./pages/Songs";
import Scales from "./pages/Scales";
import Members from "./pages/Members";
import Reports from "./pages/Reports";
import History from "./pages/History";
import { EventoDetail } from "./components/EventoDetail";
import SongDetail from "./pages/SongDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/admin/Users";
import AdminUserAcl from "./pages/admin/UserAcl";
import AdminRoles from "./pages/admin/Roles";
import AdminRolePermissions from "./pages/admin/RolePermissions";
import AdminPermissions from "./pages/admin/Permissions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

/**
 * Wrapper que aplica layout e proteção de rota autenticada.
 *
 * @param children - Componente da página a renderizar.
 * @returns Página envolvida com layout e proteção.
 */
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

/**
 * Wrapper que aplica layout, proteção de rota autenticada e proteção admin.
 *
 * @param children - Componente da página admin a renderizar.
 * @returns Página envolvida com layout, proteção e verificação admin.
 */
function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AdminRoute>{children}</AdminRoute>
      </AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Rotas públicas (sem autenticação) */}
              <Route path="/login" element={<Login />} />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              <Route path="/redefinir-senha" element={<ResetPassword />} />

              {/* Rotas protegidas (autenticação obrigatória) */}
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/musicas" element={<ProtectedPage><Songs /></ProtectedPage>} />
              <Route path="/musicas/:id" element={<ProtectedPage><SongDetail /></ProtectedPage>} />
              <Route path="/escalas" element={<ProtectedPage><Scales /></ProtectedPage>} />
              <Route path="/escalas/:id" element={<ProtectedPage><EventoDetail /></ProtectedPage>} />
              <Route path="/integrantes" element={<ProtectedPage><Members /></ProtectedPage>} />
              <Route path="/configuracoes" element={<ProtectedPage><Settings /></ProtectedPage>} />
              <Route path="/relatorios" element={<ProtectedPage><Reports /></ProtectedPage>} />
              <Route path="/historico" element={<ProtectedPage><History /></ProtectedPage>} />
              <Route path="/perfil" element={<ProtectedPage><Profile /></ProtectedPage>} />

              {/* Rotas administrativas (autenticação + role admin) */}
              <Route path="/admin/usuarios" element={<AdminPage><AdminUsers /></AdminPage>} />
              <Route path="/admin/usuarios/:userId/acl" element={<AdminPage><AdminUserAcl /></AdminPage>} />
              <Route path="/admin/roles" element={<AdminPage><AdminRoles /></AdminPage>} />
              <Route path="/admin/roles/:roleId/permissoes" element={<AdminPage><AdminRolePermissions /></AdminPage>} />
              <Route path="/admin/permissoes" element={<AdminPage><AdminPermissions /></AdminPage>} />

              {/* Catch-all */}
              <Route path="*" element={<ProtectedPage><NotFound /></ProtectedPage>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
