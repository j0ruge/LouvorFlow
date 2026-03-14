/**
 * Página de login da aplicação.
 *
 * Exibe formulário com campos de e-mail e senha, validação via Zod,
 * mensagem de erro genérica (sem revelar qual campo está errado),
 * e link para recuperação de senha.
 * Após login bem-sucedido, redireciona à URL de destino original
 * ou ao Dashboard.
 */

import { useState } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LoginFormSchema, type LoginForm } from "@/schemas/auth";
import { isSafeRedirect } from "@/lib/utils";

/**
 * Componente da página de login.
 *
 * Gerencia o estado do formulário, realiza a autenticação
 * via AuthContext e redireciona após sucesso.
 *
 * @returns Elemento JSX com a página de login.
 */
const Login = () => {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginFormSchema),
  });

  const rawRedirect = searchParams.get("redirect") ?? "/";
  const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : "/";

  if (isAuthenticated) return <Navigate to="/" replace />;

  /**
   * Processa o envio do formulário de login.
   *
   * @param dados - Dados validados do formulário (e-mail e senha).
   */
  async function onSubmit(dados: LoginForm) {
    setError(null);
    try {
      await signIn(dados);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível conectar ao servidor. Tente novamente.",
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
      <Card className="w-full max-w-md shadow-soft border-0">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LouvorFlow
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Entre com suas credenciais para acessar o sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Entrar
            </Button>

            <div className="text-center">
              <Link
                to="/esqueci-senha"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
