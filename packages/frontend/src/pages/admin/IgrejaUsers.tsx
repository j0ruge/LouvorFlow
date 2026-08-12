/**
 * Página de gerenciamento de usuários de uma igreja.
 *
 * Exibe o nome da igreja e lista todos os usuários vinculados.
 * Permite vincular novos usuários via dropdown de seleção e desvincular
 * usuários existentes com confirmação. Acessível apenas para super-admins.
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequiredFieldsLegend } from "@/components/form/RequiredFieldsLegend";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";
import {
  useIgreja,
  useIgrejaUsers,
  useAddUserToIgreja,
  useRemoveUserFromIgreja,
} from "@/hooks/use-igrejas";
import { useUsers } from "@/hooks/use-admin";
import { ErrorState } from "@/components/ErrorState";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { IgrejaTenantUser } from "@/schemas/auth";

/**
 * Componente da página de usuários de uma igreja.
 *
 * Carrega os dados da igreja e lista seus usuários vinculados.
 * Permite vincular usuários ainda não associados e desvincular os existentes.
 *
 * @returns Elemento JSX com a página de gerenciamento de usuários da igreja.
 */
const IgrejaUsers = () => {
  const { id } = useParams<{ id: string }>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  /** Usuário aguardando confirmação de desvínculo (null = nenhum diálogo aberto). */
  const [confirmingRemoval, setConfirmingRemoval] =
    useState<IgrejaTenantUser | null>(null);

  const {
    data: igreja,
    isLoading: isLoadingIgreja,
    isError: isErrorIgreja,
    error: errorIgreja,
    refetch: refetchIgreja,
  } = useIgreja(id ?? undefined);
  const {
    data: igrejaUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: errorUsers,
    refetch: refetchUsers,
  } = useIgrejaUsers(id ?? undefined);
  const {
    data: allUsers,
    isLoading: isLoadingAllUsers,
    isError: isErrorAllUsers,
    error: errorAllUsers,
    refetch: refetchAllUsers,
  } = useUsers();
  const addMutation = useAddUserToIgreja();
  const removeMutation = useRemoveUserFromIgreja();

  /**
   * Guarda de alterações não salvas do dialog de vinculação. A tela não usa
   * react-hook-form: o boolean protegido é o estado local de seleção
   * (`selectedUserId !== ""`) — exatamente o que o usuário perderia ao fechar
   * sem vincular. O `aoFechar` centraliza a limpeza da seleção que antes
   * vivia no `onOpenChange` do Dialog.
   */
  const guardaVinculo = useDirtyFormGuard({
    temAlteracoes: selectedUserId !== "",
    aoFechar: () => {
      setSelectedUserId("");
      setAddDialogOpen(false);
    },
  });

  const isLoading = isLoadingIgreja || isLoadingUsers;
  // Falha em `useUsers()` não bloqueia a página: o estado de erro é
  // tratado defensivamente dentro do dialog "Vincular Usuário", já que
  // a listagem só é necessária ao abrir esse fluxo.
  const isError = isErrorIgreja || isErrorUsers;

  /**
   * Calcula os usuários disponíveis para vinculação (não vinculados ainda).
   *
   * @returns Lista de usuários que ainda não pertencem à igreja.
   */
  const availableUsers = allUsers
    ? allUsers.filter((user) => !igrejaUsers?.some((iu) => iu.id === user.id))
    : [];

  /**
   * Processa a vinculação de um usuário à igreja.
   */
  function handleAddUser() {
    if (!id || !selectedUserId) return;
    addMutation.mutate(
      { igrejaId: id, userId: selectedUserId },
      {
        onSuccess: () => {
          setSelectedUserId("");
          setAddDialogOpen(false);
          toast.success("Usuário vinculado com sucesso.");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao vincular usuário.");
        },
      },
    );
  }

  /**
   * Abre a confirmação de desvinculação de um usuário.
   *
   * A desvinculação é destrutiva e sem desfazer — remove o vínculo e, junto
   * com ele, os papéis e permissões daquele usuário na igreja. Por isso passa
   * por confirmação explícita, como as demais ações destrutivas do projeto.
   *
   * @param usuario - Usuário a ser desvinculado.
   */
  function handleRemoveUser(usuario: IgrejaTenantUser) {
    setConfirmingRemoval(usuario);
  }

  /**
   * Executa a desvinculação após a confirmação do super-admin.
   *
   * @param userId - UUID do usuário a ser desvinculado.
   */
  function confirmRemoveUser(userId: string) {
    if (!id) return;
    setRemovingUserId(userId);
    removeMutation.mutate(
      { igrejaId: id, userId },
      {
        onSuccess: () => {
          toast.success("Usuário desvinculado com sucesso.");
          setConfirmingRemoval(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao desvincular usuário.");
        },
        onSettled: () => {
          setRemovingUserId(null);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Voltar para lista de igrejas" asChild>
            <Link to="/admin/igrejas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <Card className="shadow-soft border-0">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  /** Exibe estado de erro quando as queries de igreja ou usuários falham. */
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Voltar para lista de igrejas" asChild>
            <Link to="/admin/igrejas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <ErrorState
          message={
            errorIgreja?.message
            ?? errorUsers?.message
            ?? "Erro ao carregar dados da igreja."
          }
          onRetry={() => {
            refetchIgreja();
            refetchUsers();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com link de voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Voltar para lista de igrejas" asChild>
          <Link to="/admin/igrejas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent line-clamp-2">
            {igreja?.name ?? "Igreja"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar usuários vinculados à organização
          </p>
        </div>
      </div>

      {/* Card de usuários vinculados */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {igrejaUsers
                  ? `${igrejaUsers.length} usuário(s) vinculado(s)`
                  : "Carregando..."}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Vincular Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!igrejaUsers || igrejaUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário vinculado a esta igreja.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 sm:hidden">
                {igrejaUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border border-border space-y-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {user.telefone && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.telefone}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemoveUser(user)}
                      disabled={removingUserId === user.id || removeMutation.isPending}
                    >
                      {removingUserId === user.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <UserMinus className="mr-1 h-3 w-3" />
                      )}
                      Desvincular
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {igrejaUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium max-w-[14rem] truncate">
                          {user.name}
                        </TableCell>
                        <TableCell className="max-w-[16rem] truncate">{user.email}</TableCell>
                        <TableCell>{user.telefone ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user)}
                            disabled={removingUserId === user.id || removeMutation.isPending}
                          >
                            {removingUserId === user.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <UserMinus className="mr-1 h-3 w-3" />
                            )}
                            Desvincular
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de vinculação de usuário (Drawer no mobile, Dialog no desktop) */}
      <ResponsiveFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Vincular Usuário"
        description="Selecione o usuário que passará a ter acesso a esta igreja."
        onSubmit={(event) => {
          // Sem react-hook-form aqui: o submit nativo do <form> do
          // ResponsiveFormDialog é interceptado e delega ao handler da mutation.
          event.preventDefault();
          handleAddUser();
        }}
        contentClassName="sm:max-w-[425px]"
        dirtyGuard={guardaVinculo}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => guardaVinculo.pedirFechamento()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={!selectedUserId || addMutation.isPending}
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Vincular
            </Button>
          </>
        }
      >
        <RequiredFieldsLegend />
        <div className="space-y-2">
          {/*
            A tela não usa react-hook-form, então o indicador de obrigatório é
            o mesmo markup do FieldLabel (asterisco decorativo + texto sr-only),
            aplicado sobre o Label puro — FieldLabel exige o contexto do RHF.
          */}
          <Label htmlFor="select-user">
            Selecionar Usuário
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </Label>
          {isLoadingAllUsers ? (
            <Skeleton className="h-10 w-full" />
          ) : isErrorAllUsers ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <span>{errorAllUsers?.message ?? 'Erro ao carregar usuários.'}</span>
              {/* `type="button"` explícito: o conteúdo agora vive dentro do
                  <form> do ResponsiveFormDialog, onde o padrão do HTML seria
                  submit — recarregar a lista dispararia o envio do formulário. */}
              <Button type="button" variant="link" size="sm" onClick={() => refetchAllUsers()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger id="select-user" aria-required>
                <SelectValue placeholder="Selecione um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    Nenhum usuário disponível
                  </SelectItem>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} — {user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </ResponsiveFormDialog>

      {/* Confirmação de desvínculo — remove também papéis e permissões na igreja */}
      <DeleteConfirmDialog
        open={confirmingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmingRemoval(null);
        }}
        title="Desvincular usuário?"
        description={
          confirmingRemoval
            ? `${confirmingRemoval.name} (${confirmingRemoval.email}) perderá o acesso a esta igreja, junto com os papéis e permissões que tinha nela. Esta ação não pode ser desfeita.`
            : ""
        }
        onConfirm={() => {
          if (confirmingRemoval) confirmRemoveUser(confirmingRemoval.id);
        }}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
};

export default IgrejaUsers;
