/**
 * Página de perfil do usuário autenticado.
 *
 * Exibe avatar com iniciais, formulário para edição de dados
 * básicos (nome e e-mail) e seção de alteração de senha.
 * Utiliza react-hook-form com validação Zod e React Query
 * para busca e atualização do perfil.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { UpdateProfileFormSchema, type UpdateProfileForm } from "@/schemas/auth";
import { getInitials } from "@/lib/utils";

/**
 * Componente da página de perfil.
 *
 * Carrega os dados do perfil via React Query, preenche o formulário
 * e permite atualizar nome, e-mail e senha do usuário autenticado.
 *
 * @returns Elemento JSX com a página de perfil.
 */
const Profile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileForm>({
    resolver: zodResolver(UpdateProfileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      old_password: "",
      password: "",
    },
  });

  /**
   * Preenche o formulário com os dados do perfil carregado.
   */
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        email: profile.email,
        old_password: "",
        password: "",
      });
    }
  }, [profile, reset]);

  /**
   * Processa o envio do formulário de atualização de perfil.
   *
   * Remove campos de senha se estiverem vazios antes de enviar.
   *
   * @param dados - Dados validados do formulário.
   */
  async function onSubmit(dados: UpdateProfileForm) {
    const payload: UpdateProfileForm = {};

    if (dados.name && dados.name !== profile?.name) {
      payload.name = dados.name;
    }
    if (dados.email && dados.email !== profile?.email) {
      payload.email = dados.email;
    }
    if (dados.old_password && dados.password) {
      payload.old_password = dados.old_password;
      payload.password = dados.password;
    }

    if (Object.keys(payload).length === 0) return;

    updateMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </div>
        <Card className="shadow-soft border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-primary text-white font-semibold text-2xl">
                {user?.name ? getInitials(user.name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
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
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Alterar Senha</h3>
              <p className="text-sm text-muted-foreground">
                Preencha apenas se desejar alterar sua senha atual.
              </p>

              <div className="space-y-2">
                <Label htmlFor="old_password">Senha Atual</Label>
                <Input
                  id="old_password"
                  type="password"
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  {...register("old_password")}
                />
                {errors.old_password && (
                  <p className="text-xs text-destructive">{errors.old_password.message}</p>
                )}
              </div>

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
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
                disabled={isSubmitting || updateMutation.isPending || !isDirty}
              >
                {(isSubmitting || updateMutation.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
