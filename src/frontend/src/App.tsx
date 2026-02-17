import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Songs from "./pages/Songs";
import Scales from "./pages/Scales";
import Members from "./pages/Members";
import Reports from "./pages/Reports";
import History from "./pages/History";
import { EventoDetail } from "./components/EventoDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

/**
 * Componente raiz da aplicação LouvorFlow.
 *
 * Configura os provedores globais (QueryClientProvider, ThemeProvider, TooltipProvider),
 * o sistema de notificações (Sonner) e o roteamento SPA via React Router.
 * Rotas customizadas devem ser adicionadas acima da rota catch-all ("*").
 *
 * @component
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/musicas" element={<Songs />} />
              <Route path="/escalas" element={<Scales />} />
              <Route path="/escalas/:id" element={<EventoDetail />} />
              <Route path="/integrantes" element={<Members />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/historico" element={<History />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
