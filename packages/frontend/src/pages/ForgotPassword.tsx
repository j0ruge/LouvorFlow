/**
 * Página de recuperação de senha.
 *
 * Exibe formulário para o usuário informar seu e-mail e solicitar
 * o envio de um link de redefinição de senha. Após o envio bem-sucedido,
 * mostra uma mensagem de confirmação com link de volta ao login.
 */

import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Music, Loader2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { forgotPassword } from "@/services/auth";
import { ForgotPasswordFormSchema, type ForgotPasswordForm } from "@/schemas/auth";

/**
 * Componente da página de recuperação de senha.
 *
 * Gerencia o estado do formulário, envia a solicitação de recuperação
 * via API e exibe mensagem de sucesso após o envio.
 *
 * @returns Elemento JSX com a página de recuperação de senha.
 */
const ForgotPassword = () => {
  const { isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordFormSchema),
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  /**
   * Processa o envio do formulário de recuperação de senha.
   *
   * @param dados - Dados validados do formulário (e-mail).
   */
  async function onSubmit(dados: ForgotPasswordForm) {
    setError(null);
    try {
      await forgotPassword(dados);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar o e-mail. Tente novamente.",
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
            {submitted
              ? "Verifique seu e-mail"
              : "Informe seu e-mail para recuperar a senha"}
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">E-mail enviado!</h2>
                <p className="text-sm text-muted-foreground">
                  Se o e-mail informado estiver cadastrado, você receberá um link
                  para redefinir sua senha. Verifique também a pasta de spam.
                </p>
              </div>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full mt-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
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

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enviar Link de Recuperação
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
