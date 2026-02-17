/**
 * Página de gerenciamento de integrantes do ministério.
 *
 * Carrega dados reais da API via React Query, exibe estados de
 * loading (Skeleton), erro (ErrorState) e vazio (EmptyState),
 * permite criar, editar e excluir integrantes via dialogs,
 * e implementa filtragem client-side com debounce de 300ms.
 */

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Mail, Phone, Trash2 } from "lucide-react";
import { useIntegrantes, useDeleteIntegrante } from "@/hooks/use-integrantes";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { IntegranteForm } from "@/components/IntegranteForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

/**
 * Extrai as iniciais do nome para exibir no avatar.
 *
 * @param nome - Nome completo do integrante.
 * @returns Iniciais em maiúsculo.
 */
function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Componente de skeleton para o card de integrante durante carregamento.
 *
 * @returns Elemento React com placeholder animado.
 */
function MemberSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente da página de integrantes do ministério.
 *
 * Exibe a lista de integrantes com dados de contato e funções,
 * permite criar, editar e excluir integrantes via dialogs,
 * e gerencia estados de loading, erro e lista vazia.
 * Implementa busca client-side com debounce de 300ms.
 *
 * @returns Elemento JSX com a página de integrantes.
 */
const Members = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<{ id: string; nome: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const { data: members, isLoading, isError, error, refetch } = useIntegrantes();
  const deleteMutation = useDeleteIntegrante();

  /** Debounce de 300ms para o termo de busca. */
  useEffect(
    function debounceSearchTerm() {
      const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
      return () => clearTimeout(timer);
    },
    [searchTerm],
  );

  const isSearching = debouncedTerm.length > 0;

  /** Aplica filtragem client-side por nome (case-insensitive). */
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!isSearching) return members;
    const term = debouncedTerm.toLowerCase();
    return members.filter((m) => m.nome.toLowerCase().includes(term));
  }, [members, debouncedTerm, isSearching]);

  /** Abre o formulário no modo criação, limpando o id de edição. */
  function handleOpenCreateForm() {
    setEditingId(null);
    setFormOpen(true);
  }

  /**
   * Abre o formulário no modo edição para o integrante informado.
   *
   * @param memberId - UUID do integrante a editar.
   */
  function handleOpenEditForm(memberId: string) {
    setEditingId(memberId);
    setFormOpen(true);
  }

  /**
   * Controla a visibilidade do dialog do formulário.
   * Limpa o id de edição ao fechar.
   *
   * @param open - Novo estado de visibilidade.
   */
  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingId(null);
  }

  /** Confirma e executa a exclusão do integrante selecionado. */
  function handleConfirmDelete() {
    if (deletingMember) {
      deleteMutation.mutate(deletingMember.id, {
        onSuccess: () => setDeletingMember(null),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Integrantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros do ministério
          </p>
        </div>
        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={handleOpenCreateForm}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Integrante
        </Button>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar integrantes por nome..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <MemberSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorState
              message={error?.message ?? "Erro ao carregar integrantes."}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && filteredMembers.length === 0 && !isSearching && (
            <EmptyState
              title="Nenhum integrante cadastrado"
              description="Comece adicionando os membros do ministério para gerenciar a equipe."
              actionLabel="Novo Integrante"
              onAction={handleOpenCreateForm}
            />
          )}

          {!isLoading && !isError && filteredMembers.length === 0 && isSearching && (
            <EmptyState
              title="Nenhum resultado encontrado"
              description={`Nenhum integrante encontrado para "${debouncedTerm}".`}
            />
          )}

          {!isLoading && !isError && filteredMembers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-lg bg-gradient-card border border-border hover:shadow-soft transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-white font-semibold text-lg">
                        {getInitials(member.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-foreground text-lg">
                          {member.nome}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingMember({ id: member.id, nome: member.nome })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{member.email}</span>
                        </div>
                        {member.telefone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{member.telefone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {member.funcoes.map((funcao) => (
                          <Badge
                            key={funcao.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {funcao.nome}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenEditForm(member.id)}
                        >
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Contatar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <IntegranteForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        integranteId={editingId}
      />

      <DeleteConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => {
          if (!open) setDeletingMember(null);
        }}
        title={`Remover ${deletingMember?.nome ?? "integrante"}`}
        description="Essa ação não pode ser desfeita. O integrante será removido permanentemente do ministério."
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Members;
