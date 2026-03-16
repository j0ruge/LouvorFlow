/**
 * Página de Acesso Negado (403).
 *
 * Exibida quando o usuário autenticado tenta acessar uma rota
 * para a qual não possui permissão administrativa.
 */

import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * Componente da página 403 — Acesso Negado.
 *
 * Exibe mensagem informando que o usuário não tem permissão
 * e um botão para voltar ao Dashboard.
 *
 * @returns Elemento JSX com a página de acesso negado.
 */
const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <ShieldX className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold text-foreground">Acesso Negado</h1>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar esta página.
        Entre em contato com o administrador se acredita que isso é um erro.
      </p>
      <Button
        variant="outline"
        onClick={() => navigate("/")}
        className="mt-4"
      >
        Voltar ao Dashboard
      </Button>
    </div>
  );
};

export default Forbidden;
