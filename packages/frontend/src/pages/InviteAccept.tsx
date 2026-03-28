/**
 * Página pública de aceitação de convite.
 *
 * Valida o token ao carregar, exibe o nome do tenant e um formulário
 * de cadastro. Trata estados do token (expirado, usado, revogado, 404)
 * com mensagens claras. Após cadastro, redireciona para login.
 */

import { useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Music, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidateInvite, useAcceptInvite } from "@/hooks/use-convites";
import { useAuth } from "@/hooks/use-auth";

/** Schema Zod para validação do formulário de cadastro via convite. */
const AcceptFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  senha_confirmacao: z.string().min(1, "Confirme a senha"),
}).refine((data) => data.senha === data.senha_confirmacao, {
  message: "As senhas não coincidem",
  path: ["senha_confirmacao"],
});

/** Tipo do formulário de aceitação de convite. */
type AcceptForm = z.infer<typeof AcceptFormSchema>;

/**
 * Componente da página de aceitação de convite.
 *
 * Rota pública: `/convite/:token`. Valida o token, exibe form
 * de cadastro e redireciona para login após sucesso.
 *
 * @returns Elemento JSX com a página de aceitação.
 */
const InviteAccept = () => {
  const { isAuthenticated } = useAuth();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: validation, isLoading, error: validateError } = useValidateInvite(token ?? "");
  const acceptMutation = useAcceptInvite();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptForm>({
    resolver: zodResolver(AcceptFormSchema),
  });

  /** Redireciona ao dashboard se já autenticado (padrão de rotas públicas). */
  if (isAuthenticated) return <Navigate to="/" replace />;

  /**
   * Processa o envio do formulário de cadastro via convite.
   *
   * @param dados - Dados validados do formulário.
   */
  async function onSubmit(dados: AcceptForm) {
    setSubmitError(null);
    acceptMutation.mutate(
      { token: token!, body: dados },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => navigate("/login"), 2000);
        },
        onError: (error: Error) => {
          setSubmitError(error.message);
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Music className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LouvorFlow
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Convite para participar
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {/* Token inválido */}
          {!isLoading && validateError && (
            <div className="text-center space-y-4 py-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-muted-foreground">
                {(validateError as Error).message}
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-2">
                  Ir para login
                </Button>
              </Link>
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-foreground font-medium">
                {acceptMutation.data?.msg}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o login...
              </p>
            </div>
          )}

          {/* Formulário */}
          {!isLoading && validation && !success && (
            <>
              <div className="text-center pb-2">
                <p className="text-sm text-muted-foreground">
                  Você foi convidado para
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {validation.tenant.name}
                </p>
              </div>

              {submitError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    {...register("nome")}
                  />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <PasswordInput
                    id="senha"
                    placeholder="Mínimo 6 caracteres"
                    {...register("senha")}
                  />
                  {errors.senha && (
                    <p className="text-xs text-destructive">{errors.senha.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha_confirmacao">Confirmar senha</Label>
                  <PasswordInput
                    id="senha_confirmacao"
                    placeholder="Repita a senha"
                    {...register("senha_confirmacao")}
                  />
                  {errors.senha_confirmacao && (
                    <p className="text-xs text-destructive">{errors.senha_confirmacao.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta e participar"
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Faça login
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;
