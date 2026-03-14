/**
 * Página de redefinição de senha.
 *
 * Obtém o token de recuperação via query string da URL,
 * exibe formulário para nova senha e confirmação,
 * e redireciona ao login após sucesso.
 */

import { useState } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Music, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { resetPassword } from "@/services/auth";
import { ResetPasswordFormSchema, type ResetPasswordForm } from "@/schemas/auth";

/**
 * Componente da página de redefinição de senha.
 *
 * Lê o token da URL, valida nova senha e confirmação via Zod,
 * e redireciona ao login com toast de sucesso após a redefinição.
 *
 * @returns Elemento JSX com a página de redefinição de senha.
 */
const ResetPassword = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      token,
      password: "",
      password_confirmation: "",
    },
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  /**
   * Processa o envio do formulário de redefinição de senha.
   *
   * @param dados - Dados validados do formulário (token, senha, confirmação).
   */
  async function onSubmit(dados: ResetPasswordForm) {
    setError(null);
    try {
      await resetPassword(dados);
      toast.success("Senha redefinida com sucesso! Faça login com sua nova senha.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível redefinir a senha. O link pode ter expirado.",
      );
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md shadow-soft border-0">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold text-destructive">Token inválido</h2>
            <p className="text-sm text-muted-foreground">
              O link de redefinição de senha é inválido ou está ausente.
              Solicite um novo link de recuperação.
            </p>
            <Link to="/esqueci-senha">
              <Button variant="outline" className="w-full mt-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Solicitar novo link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
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
            Defina sua nova senha
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <input type="hidden" {...register("token")} />

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite a nova senha"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirmar Senha</Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Confirme a nova senha"
                autoComplete="new-password"
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive">
                  {errors.password_confirmation.message}
                </p>
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
              Redefinir Senha
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
