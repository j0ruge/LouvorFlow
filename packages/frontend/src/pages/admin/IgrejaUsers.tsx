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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useIgreja,
  useIgrejaUsers,
  useAddUserToIgreja,
  useRemoveUserFromIgreja,
} from "@/hooks/use-igrejas";
import { useUsers } from "@/hooks/use-admin";
import { ErrorState } from "@/components/ErrorState";

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

  const {
    data: igreja,
    isLoading: isLoadingIgreja,
    isError: isErrorIgreja,
    error: errorIgreja,
    refetch: refetchIgreja,
  } = useIgreja(id ?? null);
  const {
    data: igrejaUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: errorUsers,
    refetch: refetchUsers,
  } = useIgrejaUsers(id ?? null);
  const {
    data: allUsers,
    isLoading: isLoadingAllUsers,
    isError: isErrorAllUsers,
    error: errorAllUsers,
    refetch: refetchAllUsers,
  } = useUsers();
  const addMutation = useAddUserToIgreja();
  const removeMutation = useRemoveUserFromIgreja();

  const isLoading = isLoadingIgreja || isLoadingUsers;
  const isError = isErrorIgreja || isErrorUsers || isErrorAllUsers;

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
   * Processa a desvinculação de um usuário da igreja.
   *
   * @param userId - UUID do usuário a ser desvinculado.
   */
  function handleRemoveUser(userId: string) {
    if (!id) return;
    setRemovingUserId(userId);
    removeMutation.mutate(
      { igrejaId: id, userId },
      {
        onSuccess: () => {
          toast.success("Usuário desvinculado com sucesso.");
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
          <Link to="/admin/igrejas">
            <Button variant="ghost" size="icon" aria-label="Voltar para lista de igrejas">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
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
          <Link to="/admin/igrejas">
            <Button variant="ghost" size="icon" aria-label="Voltar para lista de igrejas">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <ErrorState
          message={
            errorIgreja?.message
            ?? errorUsers?.message
            ?? errorAllUsers?.message
            ?? "Erro ao carregar dados da igreja."
          }
          onRetry={() => {
            refetchIgreja();
            refetchUsers();
            refetchAllUsers();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com link de voltar */}
      <div className="flex items-center gap-4">
        <Link to="/admin/igrejas">
          <Button variant="ghost" size="icon" aria-label="Voltar para lista de igrejas">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {igrejaUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {user.telefone ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Dialog de vinculação de usuário */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId("");
          setAddDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="select-user">Selecionar Usuário</Label>
              {isLoadingAllUsers ? (
                <Skeleton className="h-10 w-full" />
              ) : isErrorAllUsers ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <span>{errorAllUsers?.message ?? 'Erro ao carregar usuários.'}</span>
                  <Button variant="link" size="sm" onClick={() => refetchAllUsers()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger id="select-user">
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedUserId("");
                setAddDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={handleAddUser}
              disabled={!selectedUserId || addMutation.isPending}
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IgrejaUsers;
